import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid,
  List, ListItem, ListItemText,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { formatMessage, PublishedComponent, SelectInput, TextInput } from '@openimis/fe-core';
import { CASE_DIALOG_MAX_WIDTH, DEACTIVATION_MODES, MODULE_NAME } from '../constants';

// Programme vocabulary; mirrors case_management.apps.DEFAULT_HOUSEHOLD_DEACTIVATION_REASONS.
// DECEASED is only valid for a household with a single member -- the server enforces it.
const HOUSEHOLD_REASONS = [
  'SHIFTED', 'GRADUATED', 'COMMITTEE_MEMBER', 'NOT_ATTENDED_2_CS', 'DECEASED',
];

function DeactivationDialog({
  open, household, onClose, onSubmit, error,
}) {
  const intl = useIntl();
  const t = (id) => formatMessage(intl, MODULE_NAME, id);
  const [mode, setMode] = useState('TEMPORARY');
  const [reasonCode, setReasonCode] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));

  const blockingMembers = error?.code === 'CM_ACTIVE_MEMBERS_EXIST'
    ? (error.payload?.members ?? [])
    : [];
  const textMissing = reasonCode === 'OTHER' && (reasonText || '').trim().length < 10;

  const submit = () => onSubmit({
    groupId: household?.id,
    version: household?.version,
    mode,
    reasonCode,
    reasonText: reasonText || undefined,
    effectiveDate,
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={CASE_DIALOG_MAX_WIDTH}>
      <DialogTitle>{t('deactivation.title')}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <SelectInput
              module={MODULE_NAME}
              label="deactivation.mode"
              options={DEACTIVATION_MODES.map((m) => ({ value: m, label: t(`mode.${m}`) }))}
              value={mode}
              onChange={setMode}
              required
            />
          </Grid>
          <Grid item xs={6}>
            <PublishedComponent
              pubRef="core.DatePicker"
              module={MODULE_NAME}
              label={t('deactivation.effectiveDate')}
              value={effectiveDate}
              onChange={setEffectiveDate}
              required
            />
          </Grid>
          <Grid item xs={6}>
            {/* Reason is required for every deactivation, both modes. */}
            <SelectInput
              module={MODULE_NAME}
              label="deactivation.reasonCode"
              options={HOUSEHOLD_REASONS.map((r) => ({ value: r, label: t(`reasonCode.${r}`) }))}
              value={reasonCode}
              onChange={setReasonCode}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextInput
              module={MODULE_NAME}
              label="deactivation.reasonText"
              value={reasonText}
              onChange={setReasonText}
              required={reasonCode === 'OTHER'}
            />
          </Grid>
        </Grid>

        {mode === 'PERMANENT' && (
          <Alert severity="warning">{t('deactivation.permanentWarning')}</Alert>
        )}

        {!!blockingMembers.length && (
          <>
            <Alert severity="error">{t('deactivation.blockedByMembers')}</Alert>
            <List dense>
              {blockingMembers.map((m) => (
                <ListItem key={m.group_individual_id}>
                  <ListItemText primary={m.name} secondary={m.role} />
                </ListItem>
              ))}
            </List>
          </>
        )}
        {reasonCode === 'DECEASED' && (
          <Alert severity="info">{t('deactivation.deceasedSingleMember')}</Alert>
        )}
        {!reasonCode && <Alert severity="info">{t('deactivation.needReason')}</Alert>}
        {!!error && !blockingMembers.length && (
          <Alert severity="error">{error.detail || error.message}</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('dialog.cancel')}</Button>
        <Button onClick={submit} color="primary" disabled={!reasonCode || textMissing}>
          {t('deactivation.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeactivationDialog;
