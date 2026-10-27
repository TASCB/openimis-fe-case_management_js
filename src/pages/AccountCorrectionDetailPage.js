import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import {
  Avatar, Button, Divider, Grid, IconButton, Paper, Table, TableBody, TableCell, TableHead, TableRow,
  Tooltip, Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import {
  Error as CoreError, formatDateTimeFromISO, formatMessage, formatMessageWithValues, Helmet, journalize,
  ProgressOrError, TextInput, useModulesManager,
} from '@openimis/fe-core';

import PaymentChangeDialog from '../components/PaymentChangeDialog';
import PaymentLockChip from '../components/PaymentLockChip';
import PaymentPhoneDialog from '../components/PaymentPhoneDialog';
import { parseCaseError } from '../utils/errors';
import { fetchAccountCorrection, updatePaymentDetails, updatePaymentPhone } from '../actions';
import {
  MODULE_NAME, RIGHT_ACCOUNT_CORRECTION_SEARCH, RIGHT_PAYMENT_CHANGE_UPDATE,
  RIGHT_PAYMENT_PHONE_UPDATE, ROUTE_CASE_ACCOUNT_CORRECTIONS, ROUTE_CASE_PENDING,
} from '../constants';

const CHANGE_LABELS = {
  account_number: 'accountCorrections.accountNumber',
  account_name: 'accountCorrection.accountName',
  fsp_name: 'accountCorrections.fsp',
  fsp_type: 'accountCorrections.fspType',
  is_primary: 'accountCorrection.isPrimary',
  contact_phone: 'accountCorrection.contactPhone',
};

const parseJson = (value) => {
  if (!value) return {};
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch (e) { return {}; }
};

const useStyles = makeStyles((theme) => ({
  failure: {
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', textAlign: 'right',
  },
  page: theme.page,
  paper: theme.paper.paper,
  // Detached header card, built like fe-core's <Form> header: back chevron, title, actions.
  header: {
    ...theme.paper.header,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  headerTitle: { display: 'flex', alignItems: 'center', gap: theme.spacing(1) },
  headerActions: {
    display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', marginLeft: 'auto',
  },
  paperHeaderAction: theme.paper.action,
  item: theme.paper.item,
  tableTitle: theme.table.title,
  submitted: { fontWeight: 500, color: theme.palette.primary.main },
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
  const [justSubmitted, setJustSubmitted] = useState(false);
  const modulesManager = useModulesManager();
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
      if (!parsed) { setJustSubmitted(dialog === 'payment'); setDialog(null); load(); }
    }
    prevSubmitting.current = submitting;
  }, [submitting]);

  if (!rights.includes(RIGHT_ACCOUNT_CORRECTION_SEARCH)) return null;

  const record = state?.accountCorrection;
  // The dialogs send `account.id` as the mutation's paymentAccountId, which must be the raw
  // UUID. `uuid` is exposed for exactly this; the decoded relay id is only a fallback.
  const account = record ? { ...record, id: record.uuid ?? record.id } : null;
  const attempts = account?.verificationAttempts ?? [];
  const pending = account?.pendingChange;
  const pendingFields = parseJson(pending?.fields);
  const pendingPrevious = parseJson(pending?.previous);
  const shown = (key, value) => {
    if (value === true || value === false) return t(value ? 'boolean.yes' : 'boolean.no');
    if (key === 'fsp_type' && value) return t(`accountCorrections.fspType.${value}`);
    return value || '-';
  };

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
            <div className={classes.header}>
              <div className={classes.headerTitle}>
                <Tooltip title={t('accountCorrection.action.back')}>
                  <IconButton
                    onClick={() => (history.length > 1
                      ? history.goBack()
                      : history.push(`/${ROUTE_CASE_ACCOUNT_CORRECTIONS}`))}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                </Tooltip>
                <Typography variant="h6">
                  {account.recipientName || t('accountCorrections.noName')}
                </Typography>
                <PaymentLockChip account={account} />
              </div>
              <div className={classes.headerActions}>
                <span className={classes.paperHeaderAction}>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!rights.includes(RIGHT_PAYMENT_CHANGE_UPDATE)}
                    onClick={() => { setError(null); setDialog('payment'); }}
                  >
                    {t('accountCorrection.action.editDetails')}
                  </Button>
                </span>
                <span className={classes.paperHeaderAction}>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!rights.includes(RIGHT_PAYMENT_PHONE_UPDATE)}
                    onClick={() => { setError(null); setDialog('phone'); }}
                  >
                    {t('accountCorrection.action.editPhone')}
                  </Button>
                </span>
              </div>
            </div>
          </Paper>

          {pending && (
            <Paper className={classes.paper}>
              <Typography className={classes.tableTitle}>
                {t('accountCorrection.pending.title')}
              </Typography>
              <Divider />
              <Grid container className={classes.item}>
                {justSubmitted && (
                  <Grid item xs={12} className={classes.item}>
                    <Typography className={classes.submitted}>{t('accountCorrection.pending.submitted')}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} className={classes.item}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('accountCorrection.pending.field')}</TableCell>
                        <TableCell>{t('accountCorrection.pending.now')}</TableCell>
                        <TableCell>{t('accountCorrection.pending.after')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.keys(pendingFields).map((key) => (
                        <TableRow key={key}>
                          <TableCell>{CHANGE_LABELS[key] ? t(CHANGE_LABELS[key]) : key}</TableCell>
                          <TableCell>{shown(key, pendingPrevious[key])}</TableCell>
                          <TableCell>{shown(key, pendingFields[key])}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Grid>
                <Grid item xs={12} sm={9} className={classes.item}>
                  <Typography>
                    {formatMessageWithValues(intl, MODULE_NAME, 'accountCorrection.pending.note', {
                      user: pending.submittedBy || '-',
                      date: formatDateTimeFromISO(modulesManager, intl, pending.submittedAt),
                    })}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3} className={`${classes.item} ${classes.failure}`}>
                  <Button variant="outlined" color="primary" onClick={() => history.push(`/${ROUTE_CASE_PENDING}`)}>
                    {t('accountCorrection.pending.open')}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          )}

          <Paper className={classes.paper}>
            <Typography className={classes.tableTitle}>
              {t('accountCorrection.details.title')}
            </Typography>
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
                  <Grid item xs={12} md={9} className={`${classes.item} ${classes.failure}`}>
                    <CoreError
                      error={{
                        code: attempts[0]?.result ?? 'FAILED',
                        message: attempts[0]?.returnedName
                          ? formatMessageWithValues(intl, MODULE_NAME, 'accountCorrection.operatorName', {
                            returned: attempts[0].returnedName,
                            expected: attempts[0].expectedName || account.recipientName || '-',
                          })
                          : account.failureReason || t('accountCorrections.noReason'),
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
                    <TableCell>{t('accountCorrection.attempts.names')}</TableCell>
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
                      <TableCell>
                        {a.returnedName
                          ? `${a.expectedName || '-'} → ${a.returnedName}${a.matchScore != null ? ` (${a.matchScore}%)` : ''}`
                          : '-'}
                      </TableCell>
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
