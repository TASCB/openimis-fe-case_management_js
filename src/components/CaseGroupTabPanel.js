import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { Button, Divider, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import EditIcon from '@material-ui/icons/Edit';
import PhoneIcon from '@material-ui/icons/Phone';
import _debounce from 'lodash/debounce';
import {
  formatDateFromISO, formatMessage, formatMessageWithValues,
  journalize, PublishedComponent, Searcher, useModulesManager,
} from '@openimis/fe-core';
import { decId, parseCaseError } from '../utils/errors';
import {
  fetchDeactivations, fetchPaymentAudits, updatePaymentDetails, updatePaymentPhone,
} from '../actions';
import PaymentChangeDialog from './PaymentChangeDialog';
import PaymentPhoneDialog from './PaymentPhoneDialog';
import {
  CASE_DEBOUNCE_TIME, CASE_DEFAULT_PAGE_SIZE, CASE_ROWS_PER_PAGE_OPTIONS, CASE_TAB_VALUE,
  MODULE_NAME, RIGHT_PAYMENT_CHANGE_UPDATE, RIGHT_PAYMENT_PHONE_UPDATE,
} from '../constants';

const useStyles = makeStyles((theme) => ({
  // Equal-width searcher columns;
  tables: {
    '& table': { tableLayout: 'fixed' },
    '& table th': { whiteSpace: 'nowrap' },
  },
  bar: { padding: theme.spacing(1, 2) },
  state: { color: theme.palette.text.secondary },
}));

// Relay page args from the Searcher's own paging state, plus this household's filter.
const pageArgs = (base, { pageSize, afterCursor, beforeCursor }) => {
  const args = [...base];
  if (afterCursor) args.push(`after: "${afterCursor}"`);
  if (beforeCursor) args.push(`before: "${beforeCursor}"`);
  args.push(beforeCursor ? `last: ${pageSize}` : `first: ${pageSize}`);
  return args;
};

function CaseGroupTabPanel({
  value, rights = [], group, groupId,
}) {
  const intl = useIntl();
  const classes = useStyles();
  const dispatch = useDispatch();
  // formatDateFromISO's first arg is the modulesManager -- it calls .getConf() on it, so passing
  // null crashes as soon as a row renders (an empty table hides the bug).
  const modulesManager = useModulesManager();
  const t = (id) => formatMessage(intl, MODULE_NAME, id);
  const tv = (id, values) => formatMessageWithValues(intl, MODULE_NAME, id, values);
  const state = useSelector((s) => s.caseManagement);
  const submitting = state?.submittingMutation;
  const prevSubmitting = useRef();
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState(null);
  const [reset, setReset] = useState(0);

  // GroupPage passes groupId straight from the route param, so it is already a raw UUID.
  // decId only guards the fallback: fe-core's decodeId would atob() a UUID and throw.
  const groupUuid = groupId ?? decId(group?.id);

  const fetchAudits = useCallback(_debounce(
    (params) => dispatch(fetchPaymentAudits(params)), CASE_DEBOUNCE_TIME,
  ), []);
  const fetchDeacts = useCallback(_debounce(
    (params) => dispatch(fetchDeactivations(params)), CASE_DEBOUNCE_TIME,
  ), []);

  useEffect(() => {
    if (prevSubmitting.current && !submitting) {
      dispatch(journalize(state?.mutation));
      const parsed = parseCaseError(state?.mutation);
      setError(parsed);
      if (!parsed) { setDialog(null); setReset((k) => k + 1); }
    }
  }, [submitting]);
  useEffect(() => { prevSubmitting.current = submitting; });

  const openDeactivation = (state?.deactivations ?? []).find((d) => d.isOpen);
  const account = group?.paymentAccount ?? null;

  const button = (right, icon, labelKey, onClick) => (rights.includes(right) ? (
    <Grid item>
      <Button startIcon={icon} onClick={onClick}>{t(labelKey)}</Button>
    </Grid>
  ) : null);

  const auditHeaders = () => [
    'audit.date', 'audit.changeType', 'audit.material', 'audit.reason', 'audit.channel', 'audit.by',
  ];
  const auditFormatters = () => [
    (a) => formatDateFromISO(modulesManager, intl, a.dateCreated),
    (a) => t(`changeType.${a.changeType}`),
    (a) => (a.isMaterial ? t('yes') : t('no')),
    (a) => a.reasonCode ?? '',
    (a) => a.channel,
    (a) => a.userCreated?.username ?? '',
  ];

  // [field, sortable] per column; length must match headers()
  const auditSorts = () => [
    ['dateCreated', true], ['changeType', true], ['isMaterial', true],
    ['reasonCode', true], ['channel', true], null,
  ];

  const deactHeaders = () => [
    'deactivation.mode', 'deactivation.reason', 'deactivation.effectiveDate',
    'deactivation.previousStatus', 'deactivation.open',
  ];
  const deactFormatters = () => [
    (d) => t(`mode.${d.mode}`),
    (d) => [d.reasonCode, d.reasonText].filter(Boolean).join(' — '),
    (d) => d.effectiveDate,
    (d) => d.previousStatus,
    (d) => (d.isOpen ? t('yes') : t('no')),
  ];

  const deactSorts = () => [
    ['mode', true], ['reasonCode', true], ['effectiveDate', true], null, null,
  ];

  return (
    <PublishedComponent
      pubRef="policyHolder.TabPanel"
      module={MODULE_NAME}
      index={CASE_TAB_VALUE}
      value={value}
    >
      <div className={classes.tables}>
      <Grid container alignItems="center" justifyContent="space-between" className={classes.bar}>
        <Grid item className={classes.state}>
          {openDeactivation
            ? `${t('state.deactivated')} — ${openDeactivation.reasonCode} (${openDeactivation.effectiveDate})`
            : t('state.active')}
        </Grid>
        <Grid item>
          <Grid container spacing={1} justifyContent="flex-end">
            {button(RIGHT_PAYMENT_CHANGE_UPDATE, <EditIcon />, 'action.editPayment',
              () => { setError(null); setDialog('payment'); })}
            {button(RIGHT_PAYMENT_PHONE_UPDATE, <PhoneIcon />, 'action.editPhone',
              () => { setError(null); setDialog('phone'); })}
          </Grid>
        </Grid>
      </Grid>
      <Divider />

      <Searcher
        key={`audits-${reset}`}
        module={MODULE_NAME}
        fetch={fetchAudits}
        items={state?.audits ?? []}
        itemsPageInfo={{ ...(state?.auditsPageInfo ?? {}), totalCount: state?.auditsTotalCount ?? 0 }}
        fetchingItems={state?.fetchingAudits}
        fetchedItems={state?.fetchedAudits}
        errorItems={state?.errorAudits}
        tableTitle={tv('audit.searcherTitle', { count: state?.auditsTotalCount ?? 0 })}
        headers={auditHeaders}
        sorts={auditSorts}
        itemFormatters={auditFormatters}
        filtersToQueryParams={(s) => pageArgs(
          [`groupBeneficiary_Group_Id: "${groupUuid}"`, 'orderBy: ["-dateCreated"]'], s,
        )}
        rowsPerPageOptions={CASE_ROWS_PER_PAGE_OPTIONS}
        defaultPageSize={CASE_DEFAULT_PAGE_SIZE}
        rowIdentifier={(r) => r.id}
      />

      <Searcher
        key={`deacts-${reset}`}
        module={MODULE_NAME}
        fetch={fetchDeacts}
        items={state?.deactivations ?? []}
        itemsPageInfo={{
          ...(state?.deactivationsPageInfo ?? {}), totalCount: state?.deactivationsTotalCount ?? 0,
        }}
        fetchingItems={state?.fetchingDeactivations}
        fetchedItems={state?.fetchedDeactivations}
        errorItems={state?.errorDeactivations}
        tableTitle={tv('deactivation.searcherTitle', {
          count: state?.deactivationsTotalCount ?? 0,
        })}
        headers={deactHeaders}
        sorts={deactSorts}
        itemFormatters={deactFormatters}
        filtersToQueryParams={(s) => pageArgs(
          [`group_Id: "${groupUuid}"`, 'orderBy: ["-dateCreated"]'], s,
        )}
        rowsPerPageOptions={CASE_ROWS_PER_PAGE_OPTIONS}
        defaultPageSize={CASE_DEFAULT_PAGE_SIZE}
        rowIdentifier={(r) => r.id}
      />

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
      </div>
    </PublishedComponent>
  );
}

export default CaseGroupTabPanel;
