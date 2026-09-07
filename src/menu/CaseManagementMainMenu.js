import React from 'react';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { formatMessage, MainMenuContribution, withModulesManager } from '@openimis/fe-core';
import { CASE_MAIN_MENU_CONTRIBUTION_KEY, MODULE_NAME } from '../constants';

function CaseManagementMainMenu(props) {
  const entries = props.modulesManager
    .getContribs(CASE_MAIN_MENU_CONTRIBUTION_KEY)
    .filter((c) => !c.filter || c.filter(props.rights));

  return (
    <MainMenuContribution
      {...props}
      header={formatMessage(props.intl, MODULE_NAME, 'mainMenu.caseManagement')}
      entries={entries}
      menuId="CaseManagementMainMenu"
    />
  );
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
});

export default injectIntl(withModulesManager(connect(mapStateToProps)(CaseManagementMainMenu)));
