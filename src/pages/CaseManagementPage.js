import React from 'react';
import { Box, Typography, Paper } from '@material-ui/core';
import { withTheme, withStyles } from '@material-ui/core/styles';
import { withModulesManager, formatMessage } from '@openimis/fe-core';
import { injectIntl } from 'react-intl';

const styles = (theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(3),
    textAlign: 'center',
    marginTop: theme.spacing(3),
  },
});

function CaseManagementPage({ classes, intl, modulesManager }) {
  return (
    <Box className={classes.root}>
      <Paper className={classes.paper}>
        <Typography variant="h4" gutterBottom>
          {formatMessage(intl, 'caseManagement', 'page.title')}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {formatMessage(intl, 'caseManagement', 'placeholder.text')}
        </Typography>
      </Paper>
    </Box>
  );
}

export default injectIntl(withModulesManager(withTheme(withStyles(styles)(CaseManagementPage))));
