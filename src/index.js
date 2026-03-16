import { FormattedMessage } from '@openimis/fe-core';
import React from 'react';
import FolderIcon from '@material-ui/icons/Folder';
import flatten from 'flat';
import messages_en from "./translations/en.json";
import CaseManagementPage from './pages/CaseManagementPage';

const ROUTE_CASE_MANAGEMENT = 'case-management';

const DEFAULT_CONFIG = {
  "translations": [{ key: "en", messages: flatten(messages_en) }],
  "core.Router": [
    { path: ROUTE_CASE_MANAGEMENT, component: CaseManagementPage },
  ],
  "socialProtection.MainMenu": [
    {
      text: React.createElement(FormattedMessage, { module: 'caseManagement', id: 'menu.caseManagement' }),
      icon: React.createElement(FolderIcon),
      route: `/${ROUTE_CASE_MANAGEMENT}`,
      filter: () => true,
      id: 'caseManagement.caseManagement',
    },
  ],
  "refs": [
    { key: 'caseManagement.route.caseManagement', ref: ROUTE_CASE_MANAGEMENT },
  ],
}

export const CaseManagementModule = (cfg) => {
  return { ...DEFAULT_CONFIG, ...cfg };
}