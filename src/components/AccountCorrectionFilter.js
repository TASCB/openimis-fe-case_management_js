import React from 'react';
import _debounce from 'lodash/debounce';
import { Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  ConstantBasedPicker, ControlledField, TextInput, useModulesManager, useTranslations,
} from '@openimis/fe-core';

import { CASE_DEBOUNCE_TIME, FSP_TYPES, MODULE_NAME } from '../constants';

const useStyles = makeStyles((theme) => ({
  form: { padding: '0 0 10px 0', width: '100%' },
  item: { padding: theme.spacing(1) },
}));

function AccountCorrectionFilter({ filters, onChangeFilters }) {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);

  const debouncedOnChangeFilters = _debounce(onChangeFilters, CASE_DEBOUNCE_TIME);

  const filterValue = (name) => filters?.[name]?.value ?? null;
  const filterTextFieldValue = (name) => filters?.[name]?.value ?? '';

  // `lookup` appends the django-filter suffix, e.g. fspName -> fspName_Icontains.
  const onChangeStringFilter = (name, lookup = null) => (value) => {
    const arg = lookup ? `${name}_${lookup}` : name;
    debouncedOnChangeFilters([
      { id: name, value, filter: value ? `${arg}: "${value}"` : '' },
    ]);
  };

  const textField = (id, label, lookup = null) => (
    <ControlledField
      module={MODULE_NAME}
      id={`AccountCorrectionFilter.${id}`}
      field={(
        <Grid item xs={12} sm={6} md={2} className={classes.item}>
          <TextInput
            module={MODULE_NAME}
            label={formatMessage(label)}
            value={filterTextFieldValue(id)}
            onChange={onChangeStringFilter(id, lookup)}
          />
        </Grid>
      )}
    />
  );

  return (
    <Grid container className={classes.form}>
      {textField('hhid', 'accountCorrections.filter.hhid')}
      {textField('recipientName', 'accountCorrections.filter.recipient')}
      {textField('fspName', 'accountCorrections.filter.fsp', 'Icontains')}
      {textField('accountNumber', 'accountCorrections.filter.accountNumber', 'Icontains')}
      <ControlledField
        module={MODULE_NAME}
        id="AccountCorrectionFilter.fspType"
        field={(
          <Grid item xs={12} sm={6} md={2} className={classes.item}>
            <ConstantBasedPicker
              module={MODULE_NAME}
              label="accountCorrections.fspType"
              constants={FSP_TYPES}
              value={filterValue('fspType')}
              // fspType is a plain CharField, so the argument is a quoted String, not an enum.
              onChange={(value) => onChangeFilters([
                { id: 'fspType', value, filter: value ? `fspType: "${value}"` : '' },
              ])}
            />
          </Grid>
        )}
      />
    </Grid>
  );
}

export default AccountCorrectionFilter;
