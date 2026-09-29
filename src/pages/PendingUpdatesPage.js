import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import {
  Button, Chip, Paper,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import _debounce from 'lodash/debounce';
import {
  formatMessage, formatMessageWithValues, Helmet, journalize, Searcher,
} from '@openimis/fe-core';
import { decidePendingUpdate, fetchPendingUpdates } from '../actions';
import PendingReviewDialog, { fieldLabel, parseJson } from '../components/PendingReviewDialog';
import PendingUpdateFilter from '../components/PendingUpdateFilter';
import { parseCaseError } from '../utils/errors';
import {
  CASE_DEBOUNCE_TIME, CASE_DEFAULT_PAGE_SIZE, CASE_ROWS_PER_PAGE_OPTIONS, MODULE_NAME,
  RIGHT_PENDING_DECIDE,
} from '../constants';

const useStyles = makeStyles((theme) => ({
  page: { ...theme.page },
  paper: theme.paper.paper,
  failed: { color: theme.palette.error.main },
}));

const SEVERITY_COLOR = { CRITICAL: 'secondary', WARNING: 'primary', INFO: 'default' };

// The decider (TMO) works the PENDING queue; everyone else can clear the filter to follow the
// whole cycle, e.g. a PAAF checking what happened to a submission.
const DEFAULT_FILTERS = { status: { value: 'PENDING', filter: 'status: PENDING' } };

function PendingUpdatesPage() {
  const intl = useIntl();
  const classes = useStyles();
  const dispatch = useDispatch();
  const state = useSelector((s) => s.caseManagement);
  const rights = useSelector((s) => s.core?.user?.i_user?.rights ?? []);
  const canDecide = rights.includes(RIGHT_PENDING_DECIDE);
  const submitting = state?.submittingMutation;
  const prevSubmitting = useRef();
  const [reset, setReset] = useState(0);
  const [reviewing, setReviewing] = useState(null);
  const [dialogError, setDialogError] = useState(null);
  const t = (id) => formatMessage(intl, MODULE_NAME, id);

  const summaryText = (row) => {
    const s = parseJson(row.summary) ?? {};
    const parts = [];
    if (s.fields?.length) parts.push(s.fields.map(fieldLabel).join(', '));
    if (s.change_type) parts.push(t(`changeType.${s.change_type}`));
    if (s.reason_code) parts.push(t(`reasonCode.${s.reason_code}`));
    if (s.decision_note) parts.push(s.decision_note);
    return parts.join(' — ');
  };

  useEffect(() => {
    if (prevSubmitting.current && !submitting) {
      dispatch(journalize(state?.mutation));
      const error = parseCaseError(state?.mutation);
      setDialogError(error);
      if (!error) {
        setReviewing(null);
        setReset((k) => k + 1);
      }
    }
  }, [submitting]);
  useEffect(() => { prevSubmitting.current = submitting; });

  const fetch = useCallback(_debounce(
    (params) => dispatch(fetchPendingUpdates(params)), CASE_DEBOUNCE_TIME,
  ), []);

  const open = (row) => { setDialogError(null); setReviewing(row); };

  const decide = (row, approve, note) => dispatch(decidePendingUpdate(
    { pendingId: row.id, approve, note },
    t(approve ? 'mutation.approve' : 'mutation.reject'),
  ));

  const headers = () => [
    'pending.household', 'pending.type', 'pending.kind', 'pending.severity', 'pending.channel',
    'pending.status', 'pending.submittedBy', 'pending.date', 'pending.summary', 'emptyLabel',
  ];

  const itemFormatters = () => [
    (r) => r.group?.code ?? '—',
    (r) => t(`updateType.${r.updateType}`),
    (r) => t(`pending.kind.${r.isProposal ? 'PROPOSAL' : 'APPLIED'}`),
    (r) => <Chip size="small" label={t(`pending.severity.${r.severity}`)} color={SEVERITY_COLOR[r.severity]} />,
    (r) => t(`pending.channel.${r.channel ?? 'null'}`),
    (r) => t(`pending.status.${r.status}`),
    (r) => r.submittedBy?.username,
    (r) => r.dateCreated?.slice(0, 10),
    (r) => (parseJson(r.summary)?.apply_failed
      ? <span className={classes.failed}>{`${t('pending.notApplied')} — ${summaryText(r)}`}</span>
      : summaryText(r)),
    (r) => (
      <Button size="small" color="primary" onClick={() => open(r)}>
        {t(canDecide && r.status === 'PENDING' ? 'pending.review' : 'pending.view')}
      </Button>
    ),
  ];

  return (
    <div className={classes.page}>
      <Helmet title={t('pending.pageTitle')} />
      <Paper className={classes.paper}>
        <Searcher
          key={reset}
          module={MODULE_NAME}
          FilterPane={PendingUpdateFilter}
          defaultFilters={DEFAULT_FILTERS}
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
          onDoubleClick={open}
          rowsPerPageOptions={CASE_ROWS_PER_PAGE_OPTIONS}
          defaultPageSize={CASE_DEFAULT_PAGE_SIZE}
          rowIdentifier={(r) => r.id}
        />
      </Paper>
      <PendingReviewDialog
        open={!!reviewing}
        row={reviewing}
        canDecide={canDecide}
        onClose={() => setReviewing(null)}
        onDecide={decide}
        error={dialogError}
      />
    </div>
  );
}

export default PendingUpdatesPage;
