import React from 'react';
import _debounce from 'lodash/debounce';
import { Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  ConstantBasedPicker, ControlledField, PublishedComponent, TextInput,
} from '@openimis/fe-core';

import {
  CASE_DEBOUNCE_TIME, CHANNELS, MODULE_NAME, PENDING_KINDS, PENDING_STATUSES, SEVERITIES,
} from '../constants';

const useStyles = makeStyles((theme) => ({
  form: { padding: '0 0 10px 0', width: '100%' },
  item: { padding: theme.spacing(1) },
}));

// status / channel / severity are graphene enums, so their values go unquoted.
const enumFilter = (arg) => (value) => (value ? `${arg}: ${value}` : '');
const PICKERS = [
  ['status', 'pending.status', PENDING_STATUSES, enumFilter('status')],
  ['isProposal', 'pending.kind', PENDING_KINDS,
    (value) => (value ? `isProposal: ${value === 'PROPOSAL'}` : '')],
  ['channel', 'pending.channel', CHANNELS, enumFilter('channel')],
  ['severity', 'pending.severity', SEVERITIES, enumFilter('severity')],
];
const DATES = [
  ['dateFrom', 'pending.filter.dateFrom', (v) => `dateCreated_Gte: "${v}T00:00:00"`],
  ['dateTo', 'pending.filter.dateTo', (v) => `dateCreated_Lte: "${v}T23:59:59"`],
];

function PendingUpdateFilter({ filters, onChangeFilters }) {
  const classes = useStyles();
  const debounced = _debounce(onChangeFilters, CASE_DEBOUNCE_TIME);
  const field = (id, children) => (
    <ControlledField
      key={id}
      module={MODULE_NAME}
      id={`PendingUpdateFilter.${id}`}
      field={<Grid item xs={12} sm={6} md className={classes.item}>{children}</Grid>}
    />
  );

  return (
    <Grid container className={classes.form}>
      {field('hhid', (
        <TextInput
          module={MODULE_NAME}
          label="pending.filter.hhid"
          value={filters?.hhid?.value ?? ''}
          onChange={(value) => debounced([
            { id: 'hhid', value, filter: value ? `group_Code_Icontains: "${value.trim()}"` : '' },
          ])}
        />
      ))}
      {PICKERS.map(([id, label, constants, toFilter]) => field(id, (
        <ConstantBasedPicker
          module={MODULE_NAME}
          label={label}
          constants={constants}
          value={filters?.[id]?.value ?? null}
          onChange={(value) => onChangeFilters([{ id, value, filter: toFilter(value) }])}
        />
      )))}
      {DATES.map(([id, label, toFilter]) => field(id, (
        <PublishedComponent
          pubRef="core.DatePicker"
          module={MODULE_NAME}
          label={label}
          value={filters?.[id]?.value ?? null}
          onChange={(value) => onChangeFilters([{ id, value, filter: value ? toFilter(value) : '' }])}
        />
      )))}
      <Grid item xs={12} className={classes.item}>
        <PublishedComponent
          pubRef="location.DetailedLocationFilter"
          withNull
          anchor="parentLocation"
          filters={filters}
          onChangeFilters={onChangeFilters}
        />
      </Grid>
    </Grid>
  );
}

export default PendingUpdateFilter;
