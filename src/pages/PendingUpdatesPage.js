import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { IconButton, Paper, Tooltip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';
import _debounce from 'lodash/debounce';
import {
  formatMessage, formatMessageWithValues, Helmet, journalize, Searcher,
} from '@openimis/fe-core';
import { decidePendingUpdate, fetchPendingUpdates } from '../actions';
import { parseCaseError } from '../utils/errors';
import {
  CASE_DEBOUNCE_TIME, CASE_DEFAULT_PAGE_SIZE, CASE_ROWS_PER_PAGE_OPTIONS, MODULE_NAME,
  RIGHT_PENDING_DECIDE,
} from '../constants';

// The summary jsonb is a machine payload; render it as a sentence rather than dumping JSON.
const parseSummary = (raw) => {
  if (!raw) return {};
  if (typeof raw !== 'string') return raw;
  try { return JSON.parse(raw); } catch (e) { return {}; }
};

const useStyles = makeStyles((theme) => ({
  page: { ...theme.page },
  paper: theme.paper.paper,
}));

function PendingUpdatesPage() {
  const intl = useIntl();
  const classes = useStyles();
  const dispatch = useDispatch();
  const state = useSelector((s) => s.caseManagement);
  const rights = useSelector((s) => s.core?.user?.i_user?.rights ?? []);
  const submitting = state?.submittingMutation;
  const prevSubmitting = useRef();
  const [reset, setReset] = useState(0);
  const t = (id) => formatMessage(intl, MODULE_NAME, id);

  const summaryText = (row) => {
    const s = parseSummary(row.summary);
    const parts = [];
    if (s.change_type) parts.push(t(`changeType.${s.change_type}`));
    if (s.reason_code) parts.push(t(`reasonCode.${s.reason_code}`));
    if (s.decision_note) parts.push(s.decision_note);
    return parts.join(' — ') || '';
  };

  useEffect(() => {
    if (prevSubmitting.current && !submitting) {
      dispatch(journalize(state?.mutation));
      if (!parseCaseError(state?.mutation)) setReset((k) => k + 1);
    }
  }, [submitting]);
  useEffect(() => { prevSubmitting.current = submitting; });

  const fetch = useCallback(_debounce(
    (params) => dispatch(fetchPendingUpdates(params)), CASE_DEBOUNCE_TIME,
  ), []);

  const decide = (row, approve) => dispatch(decidePendingUpdate(
    { pendingId: row.id, approve }, t(approve ? 'mutation.approve' : 'mutation.reject'),
  ));

  const headers = () => {
    const h = ['pending.household', 'pending.type', 'pending.severity', 'pending.submittedBy',
      'pending.date', 'pending.summary'];
    if (rights.includes(RIGHT_PENDING_DECIDE)) { h.push('emptyLabel'); h.push('emptyLabel'); }
    h.push('emptyLabel');
    return h;
  };

  const itemFormatters = () => {
    const f = [
      (r) => r.group?.code,
      (r) => t(`updateType.${r.updateType}`),
      (r) => r.severity,
      (r) => r.submittedBy?.username,
      (r) => r.dateCreated?.slice(0, 10),
      (r) => summaryText(r),
    ];
    if (rights.includes(RIGHT_PENDING_DECIDE)) {
      f.push((r) => (
        <Tooltip title={t('action.approve')}>
          <IconButton onClick={() => decide(r, true)}><CheckIcon /></IconButton>
        </Tooltip>
      ));
      f.push((r) => (
        <Tooltip title={t('action.reject')}>
          <IconButton onClick={() => decide(r, false)}><ClearIcon /></IconButton>
        </Tooltip>
      ));
    }
    f.push(() => '');
    return f;
  };

  return (
    <div className={classes.page}>
      <Helmet title={t('pending.pageTitle')} />
      <Paper className={classes.paper}>
        <Searcher
          key={reset}
          module={MODULE_NAME}
          fetch={fetch}
          items={state?.pending ?? []}
          itemsPageInfo={state?.pendingPageInfo}
          fetchingItems={state?.fetchingPending}
          fetchedItems={state?.fetchedPending}
          errorItems={state?.errorPending}
          tableTitle={formatMessageWithValues(intl, MODULE_NAME, 'pending.searcherTitle', {
              count: state?.pendingTotalCount ?? 0,
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

export default PendingUpdatesPage;
