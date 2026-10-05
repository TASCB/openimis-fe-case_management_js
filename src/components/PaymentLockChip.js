import React from 'react';
import { useIntl } from 'react-intl';
import { Chip, Tooltip } from '@material-ui/core';
import LockOutlined from '@material-ui/icons/LockOutlined';
import HourglassEmpty from '@material-ui/icons/HourglassEmpty';
import { formatMessage, formatMessageWithValues } from '@openimis/fe-core';
import { MODULE_NAME } from '../constants';

function PaymentLockChip({ account }) {
  const intl = useIntl();
  if (!account) return null;
  if (account.paymentInFlight) {
    return (
      <Tooltip title={formatMessage(intl, MODULE_NAME, 'lock.inFlight.help')}>
        <Chip size="small" color="secondary" icon={<HourglassEmpty />} label={formatMessage(intl, MODULE_NAME, 'lock.inFlight')} />
      </Tooltip>
    );
  }
  if (!account.paidAt) return null;
  return (
    <Tooltip title={formatMessage(intl, MODULE_NAME, 'lock.paid.help')}>
      <Chip
        size="small"
        variant="outlined"
        color="primary"
        icon={<LockOutlined />}
        label={formatMessageWithValues(intl, MODULE_NAME, 'lock.paid', { date: account.paidAt.slice(0, 10) })}
      />
    </Tooltip>
  );
}

export default PaymentLockChip;
