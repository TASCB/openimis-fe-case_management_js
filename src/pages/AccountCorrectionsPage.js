import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { Chip, Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  formatMessage, formatMessageWithValues, Helmet, Searcher,
} from '@openimis/fe-core';

import { fetchAccountCorrections } from '../actions';
import AccountCorrectionFilter from '../components/AccountCorrectionFilter';
import {
  CASE_DEFAULT_PAGE_SIZE, CASE_ROWS_PER_PAGE_OPTIONS, MODULE_NAME,
  RIGHT_ACCOUNT_CORRECTION_SEARCH, ROUTE_CASE_ACCOUNT_CORRECTION,
} from '../constants';

const useStyles = makeStyles((theme) => ({
  page: { padding: theme.spacing(2) },
  // 6 columns, so equal-width applies;
  tables: {
    '& table': { tableLayout: 'fixed' },
    '& table th': { whiteSpace: 'nowrap' },
  },
  reason: { color: theme.palette.error.main },
  mono: { fontVariantNumeric: 'tabular-nums' },
  channel: { fontSize: '0.7rem', height: 20 },
}));

function AccountCorrectionsPage({ history }) {
  const classes = useStyles();
  const intl = useIntl();
  const dispatch = useDispatch();
  const state = useSelector((s) => s.caseManagement);
  const rights = useSelector((s) => s.core?.user?.i_user?.rights ?? []);

  const fetch = useCallback((params) => dispatch(fetchAccountCorrections(params)), [dispatch]);
  useEffect(() => { fetch([]); }, []);

  if (!rights.includes(RIGHT_ACCOUNT_CORRECTION_SEARCH)) return null;

  const t = (key) => formatMessage(intl, MODULE_NAME, key);

  const headers = () => [
    t('accountCorrections.hhid'),
    t('accountCorrections.recipient'),
    t('accountCorrections.fsp'),
    t('accountCorrections.accountNumber'),
    t('accountCorrections.reason'),
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
    (row) => <span className={classes.reason}>{row.failureReason ?? t('accountCorrections.noReason')}</span>,
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
          items={state.accountCorrections}
          itemsPageInfo={state.accountCorrectionsPageInfo}
          fetchingItems={state.fetchingAccountCorrections}
          fetchedItems={state.fetchedAccountCorrections}
          errorItems={state.errorAccountCorrections}
          tableTitle={formatMessageWithValues(
            intl, MODULE_NAME, 'accountCorrections.results',
            { count: state.accountCorrectionsTotalCount ?? 0 },
          )}
          headers={headers}
          itemFormatters={itemFormatters}
          rowIdentifier={(row) => row.uuid}
          onDoubleClick={openCorrection}
          defaultPageSize={CASE_DEFAULT_PAGE_SIZE}
          rowsPerPageOptions={CASE_ROWS_PER_PAGE_OPTIONS}
        />
      </Paper>
    </div>
  );
}

export default AccountCorrectionsPage;
