import React from 'react';
import _debounce from 'lodash/debounce';
import { Checkbox, FormControlLabel, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  ConstantBasedPicker, ControlledField, TextInput, useModulesManager, useTranslations,
} from '@openimis/fe-core';

import {
  CASE_DEBOUNCE_TIME, FOLLOW_UP_CATEGORIES, FOLLOW_UP_STATUSES, MODULE_NAME, PRIORITIES,
} from '../constants';

const useStyles = makeStyles((theme) => ({
  form: { padding: '0 0 10px 0', width: '100%' },
  item: { padding: theme.spacing(1) },
}));

// status / category / priority are graphene enums, so their values go unquoted.
const PICKERS = [
  ['status', FOLLOW_UP_STATUSES],
  ['category', FOLLOW_UP_CATEGORIES],
  ['priority', PRIORITIES],
];

function FollowUpFilter({ filters, onChangeFilters }) {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const debouncedOnChangeFilters = _debounce(onChangeFilters, CASE_DEBOUNCE_TIME);

  return (
    <Grid container className={classes.form}>
      <ControlledField
        module={MODULE_NAME}
        id="FollowUpFilter.household"
        field={(
          <Grid item xs={12} sm={6} md={2} className={classes.item}>
            <TextInput
              module={MODULE_NAME}
              label={formatMessage('followUpFilter.household')}
              value={filters?.household?.value ?? ''}
              onChange={(value) => debouncedOnChangeFilters([{
                id: 'household', value, filter: value ? `group_Code_Icontains: "${value}"` : '',
              }])}
            />
          </Grid>
        )}
      />
      {PICKERS.map(([id, constants]) => (
        <ControlledField
          key={id}
          module={MODULE_NAME}
          id={`FollowUpFilter.${id}`}
          field={(
            <Grid item xs={12} sm={6} md={2} className={classes.item}>
              <ConstantBasedPicker
                module={MODULE_NAME}
                label={`followUpFilter.${id}`}
                constants={constants}
                value={filters?.[id]?.value ?? null}
                onChange={(value) => onChangeFilters([{ id, value, filter: value ? `${id}: ${value}` : '' }])}
              />
            </Grid>
          )}
        />
      ))}
      <ControlledField
        module={MODULE_NAME}
        id="FollowUpFilter.overdueOnly"
        field={(
          <Grid item xs={12} sm={6} md={2} className={classes.item}>
            <FormControlLabel
              label={formatMessage('followUpFilter.overdueOnly')}
              control={(
                <Checkbox
                  color="primary"
                  checked={!!filters?.overdueOnly?.value}
                  onChange={(e) => onChangeFilters([{
                    id: 'overdueOnly', value: e.target.checked, filter: e.target.checked ? 'overdueOnly: true' : '',
                  }])}
                />
              )}
            />
          </Grid>
        )}
      />
    </Grid>
  );
}

export default FollowUpFilter;
