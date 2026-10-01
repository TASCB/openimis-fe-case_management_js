import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { formatMessage, SelectInput, TextInput } from '@openimis/fe-core';
import { fetchPaymentProviders } from '../actions';
import {
  CASE_DIALOG_MAX_WIDTH, FSP_TYPES, MATERIAL_PAYMENT_FIELDS, MODULE_NAME,
} from '../constants';

const FIELDS = ['accountNumber', 'accountName', 'fspType', 'fspName'];

const fieldLabel = (field, fspType) => (
  field === 'accountNumber' && (fspType === 'MOBILE' || fspType === 'BANK')
    ? `paymentChange.accountNumber.${fspType}`
    : `paymentChange.${field}`
);
const REASON_CODES = [
  'ACCOUNT_CLOSED', 'ACCOUNT_INVALID', 'FSP_CHANGED', 'BENEFICIARY_REQUEST',
  'NAME_MISMATCH', 'DATA_CORRECTION', 'OTHER',
];

function PaymentChangeDialog({
  open, account, onClose, onSubmit, error,
}) {
  const intl = useIntl();
  const dispatch = useDispatch();
  const providers = useSelector((s) => s.caseManagement?.paymentProviders ?? []);
  const t = (id) => formatMessage(intl, MODULE_NAME, id);
  useEffect(() => { if (open) dispatch(fetchPaymentProviders()); }, [open]);
  const [values, setValues] = useState(() => FIELDS.reduce(
    (acc, f) => ({ ...acc, [f]: account?.[f] ?? '' }), {},
  ));
  const [reasonCode, setReasonCode] = useState('');
  const [reasonText, setReasonText] = useState('');

  const set = (field) => (v) => setValues((prev) => ({ ...prev, [field]: v }));
  const setChannel = (fspType) => setValues((prev) => ({
    ...prev,
    fspType,
    fspName: providers.some((p) => p.fspType === fspType && p.name === prev.fspName) ? prev.fspName : '',
  }));

  const providerOptions = providers
    .filter((p) => p.fspType === values.fspType)
    .map((p) => ({ value: p.name, label: p.name }));
  if (values.fspName && !providerOptions.some((o) => o.value === values.fspName)) {
    providerOptions.unshift({ value: values.fspName, label: values.fspName });
  }

  const input = (field) => {
    if (field === 'fspType') {
      return (
        <SelectInput
          module={MODULE_NAME}
          label="paymentChange.fspType"
          options={FSP_TYPES.map((c) => ({ value: c, label: t(`paymentChange.fspType.${c}`) }))}
          value={values.fspType}
          onChange={setChannel}
        />
      );
    }
    if (field === 'fspName') {
      return (
        <SelectInput
          module={MODULE_NAME}
          label="paymentChange.fspName"
          options={providerOptions}
          value={values.fspName}
          onChange={set('fspName')}
          disabled={!values.fspType}
        />
      );
    }
    return (
      <TextInput
        module={MODULE_NAME}
        label={fieldLabel(field, values.fspType)}
        value={values[field]}
        onChange={set(field)}
      />
    );
  };

  // Mirrors the server's materiality test so the reason field appears before submitting rather
  // than after a rejection. The server remains authoritative.
  const changed = useMemo(
    () => FIELDS.filter((f) => (values[f] ?? '') !== (account?.[f] ?? '')),
    [values, account],
  );
  const isMaterial = changed.some((f) => MATERIAL_PAYMENT_FIELDS.includes(f));
  const reasonMissing = isMaterial && !reasonCode;
  const textMissing = reasonCode === 'OTHER' && (reasonText || '').trim().length < 10;

  const submit = () => onSubmit({
    paymentAccountId: account?.id,
    version: account?.version,
    ...changed.reduce((acc, f) => ({ ...acc, [f]: values[f] }), {}),
    reasonCode: reasonCode || undefined,
    reasonText: reasonText || undefined,
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={CASE_DIALOG_MAX_WIDTH}>
      <DialogTitle>{t('paymentChange.title')}</DialogTitle>
      <DialogContent>
        {isMaterial && <Alert severity="info">{t('paymentChange.materialWarning')}</Alert>}
        <Grid container spacing={2}>
          {FIELDS.map((field) => (
            <Grid item xs={12} sm={6} key={field}>{input(field)}</Grid>
          ))}
          {isMaterial && (
            <Grid item xs={12} sm={6}>
              <SelectInput
                module={MODULE_NAME}
                label="paymentChange.reasonCode"
                options={REASON_CODES.map((c) => ({
                  value: c, label: t(`reasonCode.${c}`),
                }))}
                value={reasonCode}
                onChange={setReasonCode}
                required
              />
            </Grid>
          )}
          {isMaterial && (
            <Grid item xs={12}>
              <TextInput
                module={MODULE_NAME}
                label="paymentChange.reasonText"
                value={reasonText}
                onChange={setReasonText}
                required={reasonCode === 'OTHER'}
              />
            </Grid>
          )}
        </Grid>
        {!!error && <Alert severity="error">{error.detail || error.message}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('dialog.cancel')}</Button>
        <Button
          onClick={submit}
          color="primary"
          disabled={!changed.length || reasonMissing || textMissing}
        >
          {t('dialog.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PaymentChangeDialog;
