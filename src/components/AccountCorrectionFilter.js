import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import _debounce from 'lodash/debounce';
import { Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  ConstantBasedPicker, ControlledField, SelectInput, TextInput, useModulesManager, useTranslations,
} from '@openimis/fe-core';

import { fetchPaymentProviders } from '../actions';
import {
  ACCOUNT_CORRECTION_REASONS, CASE_DEBOUNCE_TIME, FSP_TYPES, MODULE_NAME,
} from '../constants';

const useStyles = makeStyles((theme) => ({
  form: { padding: '0 0 10px 0', width: '100%' },
  item: { padding: theme.spacing(1) },
}));

function AccountCorrectionFilter({ filters, onChangeFilters }) {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const dispatch = useDispatch();
  const providers = useSelector((s) => s.caseManagement?.paymentProviders ?? []);
  useEffect(() => { if (!providers.length) dispatch(fetchPaymentProviders()); }, []);

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
      <ControlledField
        module={MODULE_NAME}
        id="AccountCorrectionFilter.reason"
        field={(
          <Grid item xs={12} sm={6} md={2} className={classes.item}>
            <ConstantBasedPicker
              module={MODULE_NAME}
              label="accountCorrections.reason"
              constants={ACCOUNT_CORRECTION_REASONS}
              value={filterValue('reason')}
              onChange={(value) => onChangeFilters([
                { id: 'reason', value, filter: value ? `reason: "${value}"` : '' },
              ])}
            />
          </Grid>
        )}
      />
      {textField('hhid', 'accountCorrections.filter.hhid')}
      <ControlledField
        module={MODULE_NAME}
        id="AccountCorrectionFilter.fspCode"
        field={(
          <Grid item xs={12} sm={6} md={2} className={classes.item}>
            <SelectInput
              module={MODULE_NAME}
              label="accountCorrections.filter.fsp"
              options={[
                { value: null, label: formatMessage('accountCorrections.filter.anyFsp') },
                ...providers
                  .filter((p) => !filterValue('fspType') || p.fspType === filterValue('fspType'))
                  .map((p) => ({ value: p.fspCode, label: p.name })),
              ]}
              value={filterValue('fspCode')}
              onChange={(value) => onChangeFilters([
                { id: 'fspCode', value, filter: value ? `fspCode: "${value}"` : '' },
              ])}
            />
          </Grid>
        )}
      />
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
