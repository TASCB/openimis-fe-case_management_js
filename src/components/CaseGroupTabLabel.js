import React from 'react';
import { Tab } from '@material-ui/core';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { CASE_TAB_VALUE, MODULE_NAME } from '../constants';

// Injected into fe-individual's existing GroupPage through group.TabPanel.label — that module
// publishes the key, so nothing in fe-individual changes.
function CaseGroupTabLabel({ onChange, tabStyle, isSelected }) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  return (
    <Tab
      onChange={onChange}
      className={tabStyle(CASE_TAB_VALUE)}
      selected={isSelected(CASE_TAB_VALUE)}
      value={CASE_TAB_VALUE}
      label={formatMessage('tab.caseManagement')}
    />
  );
}

export default CaseGroupTabLabel;
