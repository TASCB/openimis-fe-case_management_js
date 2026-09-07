import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { IconButton, Tooltip } from '@material-ui/core';
import BlockIcon from '@material-ui/icons/Block';
import ReplayIcon from '@material-ui/icons/Replay';
import {
  coreConfirm, formatMessage, formatMessageWithValues, journalize,
} from '@openimis/fe-core';
import {
  deactivateHousehold, fetchDeactivations, reactivateHousehold,
} from '../actions';
import { decId, parseCaseError } from '../utils/errors';
import DeactivationDialog from './DeactivationDialog';
import { MODULE_NAME, RIGHT_DEACTIVATION_CREATE, RIGHT_REACTIVATION } from '../constants';

// Contributed into fe-individual's households table via individual.GroupSearcher.rowAction,
// so Targeted Households gets the same action the Case Management tab offers.
function HouseholdDeactivateAction({ group, rights = [], setConfirmedAction }) {
  const intl = useIntl();
  const dispatch = useDispatch();
  const t = (id) => formatMessage(intl, MODULE_NAME, id);
  const tv = (id, values) => formatMessageWithValues(intl, MODULE_NAME, id, values);
  const state = useSelector((s) => s.caseManagement);
  const submitting = state?.submittingMutation;
  const prevSubmitting = useRef();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);

  const groupUuid = decId(group?.id);
  const openDeactivation = (state?.deactivations ?? []).find(
    (d) => d.isOpen && decId(d.group?.id) === groupUuid,
  );

  const load = () => {
    if (groupUuid) dispatch(fetchDeactivations([`group_Id: "${groupUuid}"`, 'first: 5']));
  };
  useEffect(() => { if (groupUuid) load(); }, [groupUuid]);

  useEffect(() => {
    if (prevSubmitting.current && !submitting) {
      dispatch(journalize(state?.mutation));
      const parsed = parseCaseError(state?.mutation);
      setError(parsed);
      if (!parsed) { setOpen(false); load(); }
    }
  }, [submitting]);
  useEffect(() => { prevSubmitting.current = submitting; });

  const confirm = (titleKey, messageKey, values, run) => {
    if (!setConfirmedAction) return run();
    setConfirmedAction(() => run);
    return dispatch(coreConfirm(t(titleKey), tv(messageKey, values)));
  };

  if (openDeactivation) {
    if (!rights.includes(RIGHT_REACTIVATION)) return null;
    return (
      <Tooltip title={tv('action.reactivateHousehold', { reason: openDeactivation.reasonCode })}>
        <span>
          <IconButton
            onClick={() => confirm(
              'confirm.reactivate.title', 'confirm.reactivate.message',
              { reason: openDeactivation.reasonCode },
              () => dispatch(reactivateHousehold(
                { groupId: groupUuid }, t('mutation.reactivate'),
              )),
            )}
          >
            <ReplayIcon />
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  if (!rights.includes(RIGHT_DEACTIVATION_CREATE)) return null;

  return (
    <>
      <Tooltip title={t('action.deactivate')}>
        <span>
          <IconButton onClick={() => { setError(null); setOpen(true); }}>
            <BlockIcon />
          </IconButton>
        </span>
      </Tooltip>
      {open && (
        <DeactivationDialog
          open
          household={{ id: groupUuid }}
          error={error}
          onClose={() => setOpen(false)}
          onSubmit={(values) => confirm(
            'confirm.deactivate.title',
            values.mode === 'PERMANENT'
              ? 'confirm.deactivate.permanentMessage'
              : 'confirm.deactivate.message',
            { reason: values.reasonCode },
            () => dispatch(deactivateHousehold(values, t('mutation.deactivate'))),
          )}
        />
      )}
    </>
  );
}

export default HouseholdDeactivateAction;
