import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { IconButton, Tooltip } from '@material-ui/core';
import PersonAddDisabledIcon from '@material-ui/icons/PersonAddDisabled';
import ReplayIcon from '@material-ui/icons/Replay';
import {
  coreConfirm, formatMessage, formatMessageWithValues, journalize,
} from '@openimis/fe-core';
import {
  deactivateMember, fetchGroupMembers, reactivateMember,
} from '../actions';
import { decId, parseCaseError } from '../utils/errors';
import MemberDeactivationDialog from './MemberDeactivationDialog';
import { MODULE_NAME, RIGHT_DEACTIVATION_CREATE, RIGHT_REACTIVATION } from '../constants';

function IndividualDeactivateAction({ individual, rights = [], setConfirmedAction }) {
  const intl = useIntl();
  const dispatch = useDispatch();
  const t = (id) => formatMessage(intl, MODULE_NAME, id);
  const tv = (id, values) => formatMessageWithValues(intl, MODULE_NAME, id, values);
  const state = useSelector((s) => s.caseManagement);
  const submitting = state?.submittingMutation;
  const prevSubmitting = useRef();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);

  const individualId = decId(individual?.id);
  const memberships = (state?.members ?? [])
    .filter((m) => decId(m.individual?.id) === individualId);
  const active = memberships.filter((m) => m.isActive !== false);
  const deactivated = memberships.length > 0 && active.length === 0;

  useEffect(() => {
    if (open && individualId) {
      dispatch(fetchGroupMembers([`individual_Id: "${individualId}"`, 'isDeleted: false', 'first: 50']));
    }
  }, [open, individualId]);

  useEffect(() => {
    if (prevSubmitting.current && !submitting) {
      dispatch(journalize(state?.mutation));
      const parsed = parseCaseError(state?.mutation);
      setError(parsed);
      if (!parsed) setOpen(false);
    }
  }, [submitting]);
  useEffect(() => { prevSubmitting.current = submitting; });

  const name = `${individual?.firstName ?? ''} ${individual?.lastName ?? ''}`.trim();
  const target = active[0] ?? memberships[0];

  if (deactivated) {
    if (!rights.includes(RIGHT_REACTIVATION)) return null;
    const run = () => dispatch(reactivateMember(
      { groupIndividualId: decId(target?.id) }, t('mutation.reactivateMember'),
    ));
    return (
      <Tooltip title={tv('action.reactivateMember', { reason: '' })}>
        <span>
          <IconButton
            onClick={() => {
              if (!setConfirmedAction) return run();
              setConfirmedAction(() => run);
              return dispatch(coreConfirm(
                t('confirm.reactivateMember.title'),
                tv('confirm.reactivateMember.message', { name, reason: '' }),
              ));
            }}
          >
            <ReplayIcon />
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  if (!rights.includes(RIGHT_DEACTIVATION_CREATE)) return null;

  const submit = (values) => {
    const payload = { ...values, groupIndividualId: decId(target?.id), personLevel: true };
    const run = () => dispatch(deactivateMember(payload, t('mutation.deactivateMember')));
    if (!setConfirmedAction) return run();
    setConfirmedAction(() => run);
    return dispatch(coreConfirm(
      t('confirm.deactivateMember.title'),
      tv('confirm.deactivateMember.personLevelMessage', { name, count: memberships.length || 1 }),
    ));
  };

  return (
    <>
      <Tooltip title={t('action.deactivateMember')}>
        <span>
          <IconButton onClick={() => { setError(null); setOpen(true); }}>
            <PersonAddDisabledIcon />
          </IconButton>
        </span>
      </Tooltip>
      {open && (
        <MemberDeactivationDialog
          open
          member={{ id: decId(target?.id), name, role: null, recipientType: null }}
          siblings={[]}
          error={error}
          onClose={() => setOpen(false)}
          onSubmit={submit}
        />
      )}
    </>
  );
}

export default IndividualDeactivateAction;
