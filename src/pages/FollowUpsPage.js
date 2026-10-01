import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { Button, Chip, Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import _debounce from 'lodash/debounce';
import {
  formatMessage, formatMessageWithValues, Helmet, journalize, Searcher,
} from '@openimis/fe-core';
import { fetchFollowUps, updateFollowUpRemark } from '../actions';
import FollowUpDialog from '../components/FollowUpDialog';
import FollowUpFilter from '../components/FollowUpFilter';
import { parseCaseError } from '../utils/errors';
import {
  CASE_DEBOUNCE_TIME, CASE_DEFAULT_PAGE_SIZE, CASE_ROWS_PER_PAGE_OPTIONS, MODULE_NAME,
  RIGHT_FOLLOWUP_UPDATE,
} from '../constants';

const CLOSED = ['RESOLVED', 'CANCELLED'];

const useStyles = makeStyles((theme) => ({
  page: theme.page,
  paper: theme.paper.paper,
  overdue: { color: theme.palette.error.main },
}));

const PRIORITY_COLOR = { URGENT: 'secondary', HIGH: 'secondary', NORMAL: 'primary', LOW: 'default' };

function FollowUpsPage() {
  const intl = useIntl();
  const classes = useStyles();
  const dispatch = useDispatch();
  const state = useSelector((s) => s.caseManagement);
  const rights = useSelector((s) => s.core?.user?.i_user?.rights ?? []);
  const submitting = state?.submittingMutation;
  const prevSubmitting = useRef();
  const [reset, setReset] = useState(0);
  const [selected, setSelected] = useState(null);
  const [dialogError, setDialogError] = useState(null);
  const t = (id) => formatMessage(intl, MODULE_NAME, id);
  const canUpdate = rights.includes(RIGHT_FOLLOWUP_UPDATE);

  const fetch = useCallback(_debounce(
    (params) => dispatch(fetchFollowUps(params)), CASE_DEBOUNCE_TIME,
  ), []);

  useEffect(() => {
    if (prevSubmitting.current && !submitting) {
      dispatch(journalize(state?.mutation));
      const error = parseCaseError(state?.mutation);
      setDialogError(error && (error.detail || error.message));
      if (!error) {
        setSelected(null);
        setReset((k) => k + 1);
      }
    }
  }, [submitting]);
  useEffect(() => { prevSubmitting.current = submitting; });

  const open = (row) => { setDialogError(null); setSelected(row); };

  const save = (row, status, resolutionNote) => dispatch(updateFollowUpRemark(
    {
      remarkId: row.uuid, status, resolutionNote, version: row.version,
    },
    t('mutation.updateFollowUp'),
  ));

  const headers = () => [
    'followUp.household', 'followUp.category', 'followUp.status', 'followUp.priority',
    'followUp.dueDate', 'followUp.assignedTo', 'followUp.remark', 'emptyLabel',
  ];

  const sorts = () => [
    null, ['category', true], ['status', true], ['priority', true],
    ['dueDate', true], null, null, null,
  ];

  const itemFormatters = () => [
    (r) => r.group?.code,
    (r) => t(`category.${r.category}`),
    (r) => t(`followUpStatus.${r.status}`),
    (r) => r.priority && (
      <Chip size="small" label={t(`followUpFilter.priority.${r.priority}`)} color={PRIORITY_COLOR[r.priority]} />
    ),
    (r) => (r.isOverdue
      ? <span className={classes.overdue}>{`${r.dueDate} (${t('followUp.overdue')})`}</span>
      : (r.dueDate ?? '')),
    (r) => r.assignedTo?.username,
    (r) => r.remark,
    (r) => (
      <Button size="small" color="primary" onClick={() => open(r)}>
        {t(canUpdate && !CLOSED.includes(r.status) ? 'followUp.update' : 'followUp.view')}
      </Button>
    ),
  ];

  return (
    <div className={classes.page}>
      <Helmet title={t('followUps.pageTitle')} />
      <Paper className={classes.paper}>
        <Searcher
          key={reset}
          module={MODULE_NAME}
          FilterPane={FollowUpFilter}
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
          sorts={sorts}
          itemFormatters={itemFormatters}
          onDoubleClick={open}
          rowsPerPageOptions={CASE_ROWS_PER_PAGE_OPTIONS}
          defaultPageSize={CASE_DEFAULT_PAGE_SIZE}
          defaultOrderBy="-dueDate"
          rowIdentifier={(r) => r.id}
        />
      </Paper>
      <FollowUpDialog
        open={!!selected}
        row={selected}
        canUpdate={canUpdate}
        submitting={submitting}
        error={dialogError}
        onClose={() => setSelected(null)}
        onSave={save}
      />
    </div>
  );
}

export default FollowUpsPage;
