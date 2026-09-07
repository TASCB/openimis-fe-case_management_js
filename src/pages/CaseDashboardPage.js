import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { Grid, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import DonutLargeIcon from '@material-ui/icons/DonutLarge';
import AssignmentIcon from '@material-ui/icons/Assignment';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline';
import ReportProblemIcon from '@material-ui/icons/ReportProblem';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import BlockIcon from '@material-ui/icons/Block';
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty';
import ThumbUpAltIcon from '@material-ui/icons/ThumbUpAlt';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import LayersIcon from '@material-ui/icons/Layers';
import {
  formatMessage, Helmet, ProgressOrError, useHistory,
} from '@openimis/fe-core';
import {
  DashboardHeader, StatCard, SectionCard, PipelineFlow,
} from '@openimis/fe-tasaf_common';

import { fetchCaseSummary } from '../actions';
import {
  MODULE_NAME, ROUTE_CASE_ACCOUNT_CORRECTIONS, RIGHT_CASE_SEARCH,
} from '../constants';

const FOLLOW_UP_FLOW = [
  ['OPEN', <ErrorOutlineIcon />], ['IN_PROGRESS', <PlayCircleOutlineIcon />],
  ['ESCALATED', <ReportProblemIcon />], ['RESOLVED', <CheckCircleOutlineIcon />],
  ['CANCELLED', <BlockIcon />],
];

const PENDING_FLOW = [
  ['PENDING', <HourglassEmptyIcon />], ['APPROVED', <ThumbUpAltIcon />],
  ['REJECTED', <HighlightOffIcon />], ['CANCELLED', <BlockIcon />],
  ['SUPERSEDED', <LayersIcon />],
];

const useStyles = makeStyles((theme) => ({ page: theme.page }));

function CaseDashboardPage() {
  const classes = useStyles();
  const intl = useIntl();
  const dispatch = useDispatch();
  const history = useHistory();
  const [refreshedAt, setRefreshedAt] = useState(null);

  const rights = useSelector((s) => s.core?.user?.i_user?.rights ?? []);
  const state = useSelector((s) => s.caseManagement);
  const summary = state?.summary;
  const fetching = state?.fetchingSummary;
  const error = state?.errorSummary;

  const t = (id) => formatMessage(intl, MODULE_NAME, id);

  const refresh = useCallback(() => {
    dispatch(fetchCaseSummary());
    setRefreshedAt(new Date());
  }, [dispatch]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!rights.includes(RIGHT_CASE_SEARCH)) return null;

  const goCorrections = () => history.push(`/${ROUTE_CASE_ACCOUNT_CORRECTIONS}`);

  const cards = [
    ['dashboard.openCorrections', summary?.openCorrections, goCorrections],
    ['dashboard.openFollowUps', summary?.openFollowUps, null],
    ['dashboard.overdueFollowUps', summary?.overdueFollowUps, null],
    ['dashboard.pendingUpdates', summary?.pendingUpdates, null],
  ];

  const counts = (rows) => Object.fromEntries((rows ?? []).map((r) => [r.status, r.count]));
  const followUpCounts = counts(summary?.followUpsByStatus);
  const pendingCounts = counts(summary?.pendingByStatus);

  const followUpStages = FOLLOW_UP_FLOW.map(([code, icon]) => ({
    key: code, icon, label: t(`followUpStatus.${code}`), value: followUpCounts[code] ?? 0,
  }));
  const pendingStages = PENDING_FLOW.map(([code, icon]) => ({
    key: code, icon, label: t(`pendingStatus.${code}`), value: pendingCounts[code] ?? 0,
  }));

  const caseloadStages = [
    { key: 'changes', icon: <AssignmentIcon />, label: t('dashboard.paymentChanges'), value: summary?.paymentChanges ?? 0 },
    { key: 'households', icon: <BlockIcon />, label: t('dashboard.householdsDeactivated'), value: summary?.householdsDeactivated ?? 0 },
    { key: 'members', icon: <HighlightOffIcon />, label: t('dashboard.membersDeactivated'), value: summary?.membersDeactivated ?? 0 },
  ];

  return (
    <div className={classes.page}>
      <Helmet title={t('dashboard.pageTitle')} />
      <DashboardHeader
        title={t('dashboard.pageTitle')}
        subtitle={t('dashboard.subtitle')}
        refreshedLabel={refreshedAt
          ? `${t('dashboard.lastRefreshed')} · ${refreshedAt.toLocaleString([], { hour: '2-digit', minute: '2-digit' })}`
          : null}
        onRefresh={refresh}
        refreshing={fetching}
        refreshTooltip={t('dashboard.refresh')}
      />

      <ProgressOrError progress={fetching && !summary} error={error} />

      {!error && (
        <>
          <Grid container spacing={3}>
            {cards.map(([id, value, onClick]) => (
              <Grid item xs={12} sm={6} md={3} key={id}>
                <StatCard
                  label={t(id)}
                  value={value ?? '–'}
                  caption={t(`${id}.caption`)}
                  onClick={onClick}
                />
              </Grid>
            ))}
          </Grid>

          <Box mt={3}>
            <SectionCard title={t('dashboard.followUps')} icon={<DonutLargeIcon />}>
              <PipelineFlow stages={followUpStages} emptyText={t('dashboard.empty')} maxPerRow={5} />
            </SectionCard>
          </Box>

          <Box mt={3}>
            <SectionCard title={t('dashboard.pendingUpdatesFlow')} icon={<HourglassEmptyIcon />}>
              <PipelineFlow stages={pendingStages} emptyText={t('dashboard.empty')} maxPerRow={5} />
            </SectionCard>
          </Box>

          <Box mt={3}>
            <SectionCard title={t('dashboard.caseload')} icon={<AssignmentIcon />}>
              <PipelineFlow stages={caseloadStages} emptyText={t('dashboard.empty')} />
            </SectionCard>
          </Box>
        </>
      )}
    </div>
  );
}

export default CaseDashboardPage;
