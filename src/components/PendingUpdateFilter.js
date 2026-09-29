import React from 'react';
import { Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ConstantBasedPicker, ControlledField } from '@openimis/fe-core';

import {
  CHANNELS, MODULE_NAME, PENDING_KINDS, PENDING_STATUSES, SEVERITIES,
} from '../constants';

const useStyles = makeStyles((theme) => ({
  form: { padding: '0 0 10px 0', width: '100%' },
  item: { padding: theme.spacing(1) },
}));

// status / channel / severity are graphene enums, so their values go unquoted.
const enumFilter = (arg) => (value) => (value ? `${arg}: ${value}` : '');
const FILTERS = [
  ['status', 'pending.status', PENDING_STATUSES, enumFilter('status')],
  ['isProposal', 'pending.kind', PENDING_KINDS,
    (value) => (value ? `isProposal: ${value === 'PROPOSAL'}` : '')],
  ['channel', 'pending.channel', CHANNELS, enumFilter('channel')],
  ['severity', 'pending.severity', SEVERITIES, enumFilter('severity')],
];

function PendingUpdateFilter({ filters, onChangeFilters }) {
  const classes = useStyles();

  return (
    <Grid container className={classes.form}>
      {FILTERS.map(([id, label, constants, toFilter]) => (
        <ControlledField
          key={id}
          module={MODULE_NAME}
          id={`PendingUpdateFilter.${id}`}
          field={(
            <Grid item xs={12} sm={6} md={3} className={classes.item}>
              <ConstantBasedPicker
                module={MODULE_NAME}
                label={label}
                constants={constants}
                value={filters?.[id]?.value ?? null}
                onChange={(value) => onChangeFilters([{ id, value, filter: toFilter(value) }])}
              />
            </Grid>
          )}
        />
      ))}
    </Grid>
  );
}

export default PendingUpdateFilter;
