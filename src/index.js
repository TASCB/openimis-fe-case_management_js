/* eslint-disable import/prefer-default-export */
import React from 'react';
import {
  Assignment, NotificationImportant, AccountBalanceWallet, Dashboard as DashboardIcon,
} from '@material-ui/icons';
import { FormattedMessage } from '@openimis/fe-core';
import flatten from 'flat';

import messages_en from './translations/en.json';
import reducer from './reducer';
import CaseManagementMainMenu from './menu/CaseManagementMainMenu';
import CaseDashboardPage from './pages/CaseDashboardPage';
import FollowUpsPage from './pages/FollowUpsPage';
import PendingUpdatesPage from './pages/PendingUpdatesPage';
import AccountCorrectionsPage from './pages/AccountCorrectionsPage';
import AccountCorrectionDetailPage from './pages/AccountCorrectionDetailPage';
import CaseGroupTabLabel from './components/CaseGroupTabLabel';
import CaseGroupTabPanel from './components/CaseGroupTabPanel';
import HouseholdDeactivateAction from './components/HouseholdDeactivateAction';
import IndividualDeactivateAction from './components/IndividualDeactivateAction';
import MemberDeactivateAction from './components/MemberDeactivateAction';
import {
  GROUP_TAB_LABEL_CONTRIBUTION_KEY, GROUP_TAB_PANEL_CONTRIBUTION_KEY, MODULE_NAME,
  RIGHT_FOLLOWUP_SEARCH, RIGHT_PENDING_SEARCH, RIGHT_ACCOUNT_CORRECTION_SEARCH,
  RIGHT_CASE_SEARCH,
  ROUTE_CASE_DASHBOARD, ROUTE_CASE_FOLLOW_UPS, ROUTE_CASE_PENDING, ROUTE_CASE_ACCOUNT_CORRECTIONS,
  ROUTE_CASE_ACCOUNT_CORRECTION,
} from './constants';

const DEFAULT_CONFIG = {
  translations: [{ key: 'en', messages: flatten(messages_en) }],
  reducers: [{ key: MODULE_NAME, reducer }],
  refs: [
    { key: 'caseManagement.route.followUps', ref: ROUTE_CASE_FOLLOW_UPS },
    { key: 'caseManagement.route.pendingUpdates', ref: ROUTE_CASE_PENDING },
    { key: 'caseManagement.route.dashboard', ref: ROUTE_CASE_DASHBOARD },
    { key: 'caseManagement.route.accountCorrections', ref: ROUTE_CASE_ACCOUNT_CORRECTIONS },
    { key: 'caseManagement.route.accountCorrection', ref: ROUTE_CASE_ACCOUNT_CORRECTION },
  ],
  'core.Router': [
    { path: ROUTE_CASE_FOLLOW_UPS, component: FollowUpsPage },
    { path: ROUTE_CASE_PENDING, component: PendingUpdatesPage },
    { path: ROUTE_CASE_DASHBOARD, component: CaseDashboardPage },
    { path: ROUTE_CASE_ACCOUNT_CORRECTIONS, component: AccountCorrectionsPage },
    { path: `${ROUTE_CASE_ACCOUNT_CORRECTION}/:account_uuid`,
      component: AccountCorrectionDetailPage },
  ],
  // Registers the top-level sidebar menu. `name` must match the fe-core menus config id.
  'core.MainMenu': [
    { name: 'CaseManagementMainMenu', component: CaseManagementMainMenu },
  ],
  // Each entry appears only if its `id` is listed as a submenu of CaseManagementMainMenu in the
  // fe-core `menus` config — otherwise fe-core filters it out silently.
  'caseManagement.MainMenu': [
    {
      text: <FormattedMessage module={MODULE_NAME} id="menu.dashboard" />,
      icon: <DashboardIcon />,
      route: `/${ROUTE_CASE_DASHBOARD}`,
      filter: (rights) => rights.includes(RIGHT_CASE_SEARCH),
      id: 'caseManagement.dashboard',
    },
    {
      text: <FormattedMessage module={MODULE_NAME} id="menu.followUps" />,
      icon: <Assignment />,
      route: `/${ROUTE_CASE_FOLLOW_UPS}`,
      filter: (rights) => rights.includes(RIGHT_FOLLOWUP_SEARCH),
      id: 'caseManagement.followUps',
    },
    {
      text: <FormattedMessage module={MODULE_NAME} id="menu.pendingUpdates" />,
      icon: <NotificationImportant />,
      route: `/${ROUTE_CASE_PENDING}`,
      filter: (rights) => rights.includes(RIGHT_PENDING_SEARCH),
      id: 'caseManagement.pendingUpdates',
    },
    {
      text: <FormattedMessage module={MODULE_NAME} id="menu.accountCorrections" />,
      icon: <AccountBalanceWallet />,
      route: `/${ROUTE_CASE_ACCOUNT_CORRECTIONS}`,
      filter: (rights) => rights.includes(RIGHT_ACCOUNT_CORRECTION_SEARCH),
      id: 'caseManagement.accountCorrections',
    },
  ],
  // Tabs on fe-individual's existing GroupPage — that module publishes these keys, so nothing
  // in fe-individual changes.
  [GROUP_TAB_LABEL_CONTRIBUTION_KEY]: [CaseGroupTabLabel],
  [GROUP_TAB_PANEL_CONTRIBUTION_KEY]: [CaseGroupTabPanel],
  // Deactivate-with-reason lives on fe-individual's existing members table, not a second list.
  'individual.GroupIndividualSearcher.rowAction': [MemberDeactivateAction],
  // from a PERSON list the action applies across every household they belong to
  'individual.IndividualSearcher.rowAction': [IndividualDeactivateAction],
  'individual.GroupSearcher.rowAction': [HouseholdDeactivateAction],
};

export const CaseManagementModule = (cfg) => ({ ...DEFAULT_CONFIG, ...cfg });
