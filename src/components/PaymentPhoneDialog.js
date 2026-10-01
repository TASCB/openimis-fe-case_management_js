import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { formatMessage, TextInput } from '@openimis/fe-core';
import { CASE_DIALOG_MAX_WIDTH, MODULE_NAME } from '../constants';
import { isValidMsisdn, normaliseMsisdn } from '../utils/msisdn';

// Deliberately separate from PaymentChangeDialog and gated on its own right: this form has no
// reason field at all, which is what keeps the reason rule enforceable on the other one.
function PaymentPhoneDialog({
  open, account, onClose, onSubmit, error,
}) {
  const intl = useIntl();
  const t = (id) => formatMessage(intl, MODULE_NAME, id);
  const [phone, setPhone] = useState(account?.contactPhone ?? '');
  const normalised = normaliseMsisdn(phone);
  const valid = isValidMsisdn(normalised);
  const unchanged = normalised === normaliseMsisdn(account?.contactPhone ?? '');
  let helper = t('paymentPhone.format');
  if (phone && !valid) helper = t('paymentPhone.invalid');
  else if (valid && normalised !== phone.trim()) helper = `${t('paymentPhone.savedAs')} ${normalised}`;

  const submit = () => onSubmit({
    paymentAccountId: account?.id,
    version: account?.version,
    contactPhone: normalised,
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={CASE_DIALOG_MAX_WIDTH}>
      <DialogTitle>{t('paymentPhone.title')}</DialogTitle>
      <DialogContent>
        <Alert severity="info">{t('paymentPhone.info')}</Alert>
        <TextInput
          module={MODULE_NAME}
          label="paymentPhone.contactPhone"
          value={phone}
          onChange={setPhone}
          required
          error={phone && !valid ? helper : null}
          helperText={helper}
          inputProps={{ inputMode: 'tel', maxLength: 20 }}
        />
        {!!error && <Alert severity="error">{error.detail || error.message}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('dialog.cancel')}</Button>
        <Button onClick={submit} color="primary" disabled={!valid || unchanged}>
          {t('dialog.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PaymentPhoneDialog;
