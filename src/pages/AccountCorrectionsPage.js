import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { Chip, Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  formatDateTimeFromISO, formatMessage, formatMessageWithValues, Helmet, historyPush, Searcher, useModulesManager,
} from '@openimis/fe-core';

import { fetchAccountCorrections, fetchHouseholdsWithoutAccount } from '../actions';
import AccountCorrectionFilter from '../components/AccountCorrectionFilter';
import {
  CASE_DEFAULT_PAGE_SIZE, CASE_ROWS_PER_PAGE_OPTIONS, MODULE_NAME, REASON_NO_ACCOUNT,
  RIGHT_ACCOUNT_CORRECTION_SEARCH, ROUTE_CASE_ACCOUNT_CORRECTION, ROUTE_REF_GROUP,
} from '../constants';

const useStyles = makeStyles((theme) => ({
  page: { padding: theme.spacing(2) },
  tables: {},
  reason: { color: theme.palette.error.main },
  mono: { fontVariantNumeric: 'tabular-nums' },
  channel: { fontSize: '0.7rem', height: 20 },
}));

const FILTERS_KEY = 'caseManagementAccountCorrections';

function AccountCorrectionsPage({ history }) {
  const classes = useStyles();
  const intl = useIntl();
  const dispatch = useDispatch();
  const state = useSelector((s) => s.caseManagement);
  const rights = useSelector((s) => s.core?.user?.i_user?.rights ?? []);
  const modulesManager = useModulesManager();
  const [noAccount, setNoAccount] = useState(false);
  const linkedReason = new URLSearchParams(history?.location?.search ?? '').get('reason');
  const [ready, setReady] = useState(!linkedReason);
  useEffect(() => {
    if (!linkedReason) return;
    dispatch({
      type: 'CORE_CACHE_FILTER',
      payload: { [FILTERS_KEY]: { reason: { value: linkedReason, filter: `reason: "${linkedReason}"` } } },
    });
    history.replace(history.location.pathname);
    setReady(true);
  }, []);

  const fetch = useCallback((params) => {
    const wantsNoAccount = params.some((p) => p === `reason: "${REASON_NO_ACCOUNT}"`);
    setNoAccount(wantsNoAccount);
    return dispatch(wantsNoAccount ? fetchHouseholdsWithoutAccount(params) : fetchAccountCorrections(params));
  }, [dispatch]);

  if (!rights.includes(RIGHT_ACCOUNT_CORRECTION_SEARCH) || !ready) return null;

  const t = (key) => formatMessage(intl, MODULE_NAME, key);

  const noAccountHeaders = () => [
    t('accountCorrections.hhid'),
    t('accountCorrections.recipient'),
    t('accountCorrections.benefitPlan'),
    t('accountCorrections.location'),
    t('accountCorrections.status'),
  ];

  const noAccountFormatters = () => [
    (row) => row.hhid ?? '-',
    (row) => row.recipientName ?? '-',
    (row) => row.benefitPlanName ?? '-',
    (row) => row.locationName ?? '-',
    (row) => (row.waitingForApproval ? t('accountCorrections.waitingForApproval') : '-'),
  ];

  const openHousehold = (row) => historyPush(modulesManager, history, ROUTE_REF_GROUP, [row.groupId]);

  const headers = () => [
    t('accountCorrections.hhid'),
    t('accountCorrections.recipient'),
    t('accountCorrections.fsp'),
    t('accountCorrections.accountNumber'),
    t('accountCorrections.reason'),
    t('accountCorrections.failedOn'),
    t('accountCorrections.location'),
  ];

  // Drill in to the correction workspace, where the edit actions live.
  const openCorrection = (row) => history.push(`/${ROUTE_CASE_ACCOUNT_CORRECTION}/${row.uuid}`);

  const itemFormatters = () => [
    (row) => row.hhid ?? '-',
    (row) => row.recipientName ?? '-',
    (row) => (
      <>
        {row.fspName ?? '-'}
        {row.fspType && (
          <Chip
            size="small"
            className={classes.channel}
            label={t(`accountCorrections.fspType.${row.fspType}`)}
            style={{ marginLeft: 8 }}
          />
        )}
      </>
    ),
    (row) => <span className={classes.mono}>{row.accountNumber ?? '-'}</span>,
    (row) => (
      <>
        {row.waitingForApproval && <Chip size="small" color="primary" className={classes.channel} label={t('accountCorrections.changeWaiting')} style={{ marginRight: 8 }} />}
        {row.withdrawn && <Chip size="small" className={classes.channel} label={t('accountCorrections.notSent')} style={{ marginRight: 8 }} />}
        <span className={classes.reason}>{row.failureReason ?? t('accountCorrections.noReason')}</span>
      </>
    ),
    (row) => (row.failedOn ? formatDateTimeFromISO(modulesManager, intl, row.failedOn) : '-'),
    (row) => row.locationName ?? '-',
  ];

  return (
    <div className={classes.page}>
      <Helmet title={t('accountCorrections.page.title')} />
      <Paper className={classes.tables}>
        <Searcher
          module={MODULE_NAME}
          FilterPane={AccountCorrectionFilter}
          fetch={fetch}
          items={noAccount ? state.noAccount : state.accountCorrections}
          itemsPageInfo={noAccount ? state.noAccountPageInfo : state.accountCorrectionsPageInfo}
          fetchingItems={noAccount ? state.fetchingNoAccount : state.fetchingAccountCorrections}
          fetchedItems={noAccount ? state.fetchedNoAccount : state.fetchedAccountCorrections}
          errorItems={noAccount ? state.errorNoAccount : state.errorAccountCorrections}
          tableTitle={noAccount
            ? formatMessageWithValues(intl, MODULE_NAME, 'accountCorrections.noAccount.results', { count: state.noAccountTotalCount ?? 0 })
            : formatMessageWithValues(intl, MODULE_NAME, 'accountCorrections.results', { count: state.accountCorrectionsTotalCount ?? 0 })}
          headers={noAccount ? noAccountHeaders : headers}
          itemFormatters={noAccount ? noAccountFormatters : itemFormatters}
          cacheFiltersKey={FILTERS_KEY}
          rowIdentifier={(row) => (noAccount ? row.id : row.uuid)}
          onDoubleClick={noAccount ? openHousehold : openCorrection}
          defaultPageSize={CASE_DEFAULT_PAGE_SIZE}
          rowsPerPageOptions={CASE_ROWS_PER_PAGE_OPTIONS}
        />
      </Paper>
    </div>
  );
}

export default AccountCorrectionsPage;
