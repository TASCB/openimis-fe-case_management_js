import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import _debounce from 'lodash/debounce';
import { formatMessage, formatMessageWithValues, Helmet, Searcher } from '@openimis/fe-core';
import { fetchFollowUps } from '../actions';
import {
  CASE_DEBOUNCE_TIME, CASE_DEFAULT_PAGE_SIZE, CASE_ROWS_PER_PAGE_OPTIONS, MODULE_NAME,
} from '../constants';

const useStyles = makeStyles((theme) => ({
  page: {
    ...theme.page,
    // Equal-width searcher columns;
    '& table': { tableLayout: 'fixed' },
    '& table th': { whiteSpace: 'nowrap' },
  },
  paper: theme.paper.paper,
}));

function FollowUpsPage() {
  const intl = useIntl();
  const classes = useStyles();
  const dispatch = useDispatch();
  const state = useSelector((s) => s.caseManagement);
  const t = (id) => formatMessage(intl, MODULE_NAME, id);

  const fetch = useCallback(_debounce(
    (params) => dispatch(fetchFollowUps(params)), CASE_DEBOUNCE_TIME,
  ), []);

  const headers = () => [
    'followUp.household', 'followUp.category', 'followUp.status', 'followUp.priority',
    'followUp.dueDate', 'followUp.assignedTo', 'followUp.remark', 'emptyLabel',
  ];

  const itemFormatters = () => [
    (r) => r.group?.code,
    (r) => t(`category.${r.category}`),
    (r) => t(`followUpStatus.${r.status}`),
    (r) => r.priority,
    (r) => (r.isOverdue ? `${r.dueDate} (${t('followUp.overdue')})` : (r.dueDate ?? '')),
    (r) => r.assignedTo?.username,
    (r) => r.remark,
    () => '',
  ];

  return (
    <div className={classes.page}>
      <Helmet title={t('followUps.pageTitle')} />
      <Paper className={classes.paper}>
        <Searcher
          module={MODULE_NAME}
          fetch={fetch}
          items={state?.followUps ?? []}
          itemsPageInfo={state?.followUpsPageInfo}
          fetchingItems={state?.fetchingFollowUps}
          fetchedItems={state?.fetchedFollowUps}
          errorItems={state?.errorFollowUps}
          tableTitle={formatMessageWithValues(intl, MODULE_NAME, 'followUps.searcherTitle', {
              count: state?.followUpsTotalCount ?? 0,
            })}
          headers={headers}
          itemFormatters={itemFormatters}
          rowsPerPageOptions={CASE_ROWS_PER_PAGE_OPTIONS}
          defaultPageSize={CASE_DEFAULT_PAGE_SIZE}
          rowIdentifier={(r) => r.id}
        />
      </Paper>
    </div>
  );
}

export default FollowUpsPage;
