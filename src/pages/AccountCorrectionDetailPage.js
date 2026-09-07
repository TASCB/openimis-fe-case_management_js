import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import {
  Avatar, Button, Divider, Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  Error as CoreError, formatMessage, Helmet, journalize, ProgressOrError, TextInput,
} from '@openimis/fe-core';

import PaymentChangeDialog from '../components/PaymentChangeDialog';
import PaymentPhoneDialog from '../components/PaymentPhoneDialog';
import { parseCaseError } from '../utils/errors';
import { fetchAccountCorrection, updatePaymentDetails, updatePaymentPhone } from '../actions';
import {
  MODULE_NAME, RIGHT_ACCOUNT_CORRECTION_SEARCH, RIGHT_PAYMENT_CHANGE_UPDATE,
  RIGHT_PAYMENT_PHONE_UPDATE, ROUTE_CASE_ACCOUNT_CORRECTIONS,
} from '../constants';

const useStyles = makeStyles((theme) => ({
  page: theme.page,
  paper: theme.paper.paper,
  paperHeader: theme.paper.title,
  paperHeaderAction: theme.paper.action,
  item: theme.paper.item,
  tableTitle: theme.table.title,
  bigAvatar: theme.bigAvatar,   // 160x160, the insuree profile's own token
}));

function AccountCorrectionDetailPage({ match, history }) {
  const classes = useStyles();
  const intl = useIntl();
  const dispatch = useDispatch();
  const t = (id) => formatMessage(intl, MODULE_NAME, id);

  const uuid = match?.params?.account_uuid;
  const state = useSelector((s) => s.caseManagement);
  const mutation = useSelector((s) => s.caseManagement?.mutation);
  const submitting = useSelector((s) => s.caseManagement?.submittingMutation);
  const rights = useSelector((s) => s.core?.user?.i_user?.rights ?? []);

  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState(null);
  const prevSubmitting = useRef(submitting);

  const load = useCallback(() => dispatch(fetchAccountCorrection(uuid)), [dispatch, uuid]);
  useEffect(() => { if (uuid) load(); }, [uuid]);

  // Journalize once the mutation settles, then reload so the panel reflects what was written
  // (or, for a material change, shows that it is now awaiting approval).
  useEffect(() => {
    if (prevSubmitting.current && !submitting) {
      dispatch(journalize(mutation));
      const parsed = parseCaseError(mutation);
      setError(parsed);
      if (!parsed) { setDialog(null); load(); }
    }
    prevSubmitting.current = submitting;
  }, [submitting]);

  if (!rights.includes(RIGHT_ACCOUNT_CORRECTION_SEARCH)) return null;

  const record = state?.accountCorrection;
  // The dialogs send `account.id` as the mutation's paymentAccountId, which must be the raw
  // UUID. `uuid` is exposed for exactly this; the decoded relay id is only a fallback.
  const account = record ? { ...record, id: record.uuid ?? record.id } : null;
  const attempts = account?.verificationAttempts ?? [];

  const field = (label, value) => (
    <Grid item xs={3} className={classes.item}>
      <TextInput module={MODULE_NAME} label={label} value={value ?? ''} readOnly />
    </Grid>
  );

  return (
    <div className={classes.page}>
      <Helmet title={t('accountCorrection.page.title')} />

      <ProgressOrError
        progress={state?.fetchingAccountCorrection}
        error={state?.errorAccountCorrection}
      />

      {account && (
        <>
          <Paper className={classes.paper}>
            <Grid container className={classes.paperHeader} alignItems="center">
              <Grid item xs={5}>
                <Typography variant="h6">
                  {account.recipientName || t('accountCorrections.noName')}
                </Typography>
              </Grid>
              <Grid item xs={7} className={classes.paperHeaderAction}>
                <Grid container justifyContent="flex-end" spacing={1}>
                  <Grid item>
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={!rights.includes(RIGHT_PAYMENT_CHANGE_UPDATE)}
                      onClick={() => { setError(null); setDialog('payment'); }}
                    >
                      {t('accountCorrection.action.editDetails')}
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={!rights.includes(RIGHT_PAYMENT_PHONE_UPDATE)}
                      onClick={() => { setError(null); setDialog('phone'); }}
                    >
                      {t('accountCorrection.action.editPhone')}
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button onClick={() => history.push(`/${ROUTE_CASE_ACCOUNT_CORRECTIONS}`)}>
                      {t('accountCorrection.action.back')}
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            <Divider />

            <Grid container className={classes.item}>
              {/* The failed save, if any — about the last action, so it stays at the top. */}
              {error && <Grid item xs={12}><CoreError error={error} /></Grid>}

              {/* Avatar left, fields right — the insuree head-panel arrangement. An empty
                  MUI Avatar falls back to its own Person icon, so no photo is needed. */}
              <Grid item xs={12} sm={3} md={2} className={classes.item}>
                <Avatar className={classes.bigAvatar} />
              </Grid>
              <Grid item xs={12} sm={9} md={10}>
                <Grid container>
                  {field('accountCorrections.hhid', account.hhid)}
                  {field('accountCorrections.location', account.locationName)}
                  {field('accountCorrections.fsp', account.fspName)}
                  {field(
                    'accountCorrections.fspType',
                    account.fspType ? t(`accountCorrections.fspType.${account.fspType}`) : '',
                  )}
                  {field('accountCorrections.accountNumber', account.accountNumber)}
                  {field('accountCorrection.accountName', account.accountName)}
                  {field('accountCorrection.contactPhone', account.contactPhone)}
                  {field('accountCorrection.preAudit', account.preAuditStatus)}
                  {field(
                    'accountCorrection.isPrimary',
                    account.isPrimary ? t('boolean.yes') : t('boolean.no'),
                  )}
                  {/* Fills the rest of the row that Primary account starts. */}
                  <Grid item xs={12} md={9} className={classes.item}>
                    <CoreError
                      error={{
                        code: attempts[0]?.result ?? 'FAILED',
                        message: account.failureReason || t('accountCorrections.noReason'),
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>

          <Paper className={classes.paper}>
            <Typography className={classes.tableTitle}>
              {t('accountCorrection.attempts.title')}
            </Typography>
            {attempts.length === 0 ? (
              <Grid container className={classes.item}>
                <Grid item xs={12} className={classes.item}>
                  <Typography>{t('accountCorrection.attempts.none')}</Typography>
                </Grid>
              </Grid>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('accountCorrection.attempts.received')}</TableCell>
                    <TableCell>{t('accountCorrection.attempts.type')}</TableCell>
                    <TableCell>{t('accountCorrection.attempts.result')}</TableCell>
                    <TableCell>{t('accountCorrection.attempts.reference')}</TableCell>
                    <TableCell>{t('accountCorrection.attempts.reason')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attempts.map((a) => (
                    <TableRow key={`${a.museReference}-${a.receivedAt}`}>
                      <TableCell>{a.receivedAt?.slice(0, 19).replace('T', ' ') ?? '-'}</TableCell>
                      <TableCell>{a.verificationType ?? '-'}</TableCell>
                      <TableCell>{a.result ?? '-'}</TableCell>
                      <TableCell>{a.museReference ?? '-'}</TableCell>
                      <TableCell>{a.failureReason ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>

          {dialog === 'payment' && (
            <PaymentChangeDialog
              open
              account={account}
              error={error}
              onClose={() => setDialog(null)}
              onSubmit={(values) => dispatch(updatePaymentDetails(values, t('mutation.updatePayment')))}
            />
          )}
          {dialog === 'phone' && (
            <PaymentPhoneDialog
              open
              account={account}
              error={error}
              onClose={() => setDialog(null)}
              onSubmit={(values) => dispatch(updatePaymentPhone(values, t('mutation.updatePhone')))}
            />
          )}
        </>
      )}
    </div>
  );
}

export default AccountCorrectionDetailPage;
