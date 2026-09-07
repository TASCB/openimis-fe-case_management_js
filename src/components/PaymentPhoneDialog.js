import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { formatMessage, TextInput } from '@openimis/fe-core';
import { CASE_DIALOG_MAX_WIDTH, MODULE_NAME } from '../constants';

// Deliberately separate from PaymentChangeDialog and gated on its own right: this form has no
// reason field at all, which is what keeps the reason rule enforceable on the other one.
function PaymentPhoneDialog({
  open, account, onClose, onSubmit, error,
}) {
  const intl = useIntl();
  const t = (id) => formatMessage(intl, MODULE_NAME, id);
  const [phone, setPhone] = useState(account?.contactPhone ?? '');

  const submit = () => onSubmit({
    paymentAccountId: account?.id,
    version: account?.version,
    contactPhone: phone,
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={CASE_DIALOG_MAX_WIDTH}>
      <DialogTitle>{t('paymentPhone.title')}</DialogTitle>
      <DialogContent>
        <Alert severity="info">{t('paymentPhone.info')}</Alert>
        <Alert severity="warning">{t('paymentPhone.notPaymentWarning')}</Alert>
        <TextInput
          module={MODULE_NAME}
          label="paymentPhone.contactPhone"
          value={phone}
          onChange={setPhone}
          required
        />
        {!!error && <Alert severity="error">{error.detail || error.message}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('dialog.cancel')}</Button>
        <Button onClick={submit} color="primary" disabled={!phone}>
          {t('dialog.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PaymentPhoneDialog;
