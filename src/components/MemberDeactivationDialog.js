import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import {
  formatMessage, PublishedComponent, SelectInput, TextInput,
} from '@openimis/fe-core';
import { CASE_DIALOG_MAX_WIDTH, MODULE_NAME } from '../constants';

// Programme vocabulary; mirrors case_management.apps.DEFAULT_MEMBER_DEACTIVATION_REASONS.
const MEMBER_REASONS = ['SHIFTED', 'DECEASED'];

const DECEASED = 'DECEASED';

function MemberDeactivationDialog({
  open, member, siblings = [], onClose, onSubmit, error,
}) {
  const intl = useIntl();
  const t = (id) => formatMessage(intl, MODULE_NAME, id);
  const [reasonCode, setReasonCode] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [dateOfDeath, setDateOfDeath] = useState(null);
  const [successorId, setSuccessorId] = useState('');

  const isRepresentative = member?.role === 'HEAD' || member?.recipientType === 'PRIMARY';
  // A sole representative has nobody to hand over to. Requiring a successor there is an
  // unsatisfiable rule, so the field is only shown when a candidate actually exists.
  const needsSuccessor = isRepresentative && siblings.length > 0;
  const isLastMember = isRepresentative && siblings.length === 0;
  const isDeceased = reasonCode === DECEASED;
  const textMissing = reasonCode === 'OTHER' && (reasonText || '').trim().length < 10;
  const successorMissing = needsSuccessor && !successorId;

  const submit = () => onSubmit({
    groupIndividualId: member?.id,
    version: member?.version,
    reasonCode,
    reasonText: reasonText || undefined,
    effectiveDate,
    dateOfDeath: isDeceased ? dateOfDeath : undefined,
    successors: successorId
      ? [{ groupId: member?.groupId, groupIndividualId: successorId }]
      : undefined,
  });

  const blockedGroups = error?.code === 'CM_SUCCESSOR_REQUIRED'
    ? (error.payload?.groups ?? []) : [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={CASE_DIALOG_MAX_WIDTH}>
      <DialogTitle>
        {t('memberDeactivation.title')}
        {member?.name ? ` — ${member.name}` : ''}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            {/* Reason is mandatory for every member deactivation, not only DECEASED. */}
            <SelectInput
              module={MODULE_NAME}
              label="memberDeactivation.reasonCode"
              options={MEMBER_REASONS.map((r) => ({ value: r, label: t(`reasonCode.${r}`) }))}
              value={reasonCode}
              onChange={setReasonCode}
              required
            />
          </Grid>
          <Grid item xs={6}>
            <PublishedComponent
              pubRef="core.DatePicker"
              module={MODULE_NAME}
              label={t('memberDeactivation.effectiveDate')}
              value={effectiveDate}
              onChange={setEffectiveDate}
              required
            />
          </Grid>
          {isDeceased && (
            <Grid item xs={6}>
              <PublishedComponent
                pubRef="core.DatePicker"
                module={MODULE_NAME}
                label={t('memberDeactivation.dateOfDeath')}
                value={dateOfDeath}
                onChange={setDateOfDeath}
              />
            </Grid>
          )}
          {needsSuccessor && (
            <Grid item xs={6}>
              <SelectInput
                module={MODULE_NAME}
                label="memberDeactivation.successor"
                options={siblings.map((s) => ({ value: s.id, label: s.name }))}
                value={successorId}
                onChange={setSuccessorId}
                required
              />
            </Grid>
          )}
          <Grid item xs={12}>
            <TextInput
              module={MODULE_NAME}
              label="memberDeactivation.reasonText"
              value={reasonText}
              onChange={setReasonText}
              required={reasonCode === 'OTHER'}
            />
          </Grid>
        </Grid>

        {isDeceased && <Alert severity="warning">{t('memberDeactivation.deceasedWarning')}</Alert>}
        {needsSuccessor && (
          <Alert severity="info">{t('memberDeactivation.representativeInfo')}</Alert>
        )}
        {isLastMember && (
          <Alert severity="warning">{t('memberDeactivation.lastMemberWarning')}</Alert>
        )}
        {/* never leave the button dead with no explanation */}
        {(!reasonCode || textMissing || successorMissing) && (
          <Alert severity="info">
            {!reasonCode && t('memberDeactivation.needReason')}
            {!!reasonCode && successorMissing && t('memberDeactivation.needSuccessor')}
            {!!reasonCode && !successorMissing && textMissing
              && t('memberDeactivation.needReasonText')}
          </Alert>
        )}
        {!!blockedGroups.length && (
          <Alert severity="error">{t('memberDeactivation.successorRequired')}</Alert>
        )}
        {!!error && !blockedGroups.length && (
          <Alert severity="error">{error.detail || error.message}</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('dialog.cancel')}</Button>
        <Button
          onClick={submit}
          color="primary"
          disabled={!reasonCode || textMissing || successorMissing}
        >
          {t('memberDeactivation.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default MemberDeactivationDialog;
