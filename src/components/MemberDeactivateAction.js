import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { IconButton, Tooltip } from '@material-ui/core';
import PersonAddDisabledIcon from '@material-ui/icons/PersonAddDisabled';
import ReplayIcon from '@material-ui/icons/Replay';
import {
  coreConfirm, formatMessage, formatMessageWithValues, journalize, useModulesManager,
} from '@openimis/fe-core';
import {
  deactivateMember, fetchGroupMembers, fetchMemberDeactivations, reactivateMember,
} from '../actions';
import { decId, parseCaseError } from '../utils/errors';
import MemberDeactivationDialog from './MemberDeactivationDialog';
import { MODULE_NAME, RIGHT_DEACTIVATION_CREATE, RIGHT_REACTIVATION } from '../constants';

function MemberDeactivateAction({
  groupIndividual, groupId, rights = [], setConfirmedAction, disabled, deactivated,
}) {
  const intl = useIntl();
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const t = (id) => formatMessage(intl, MODULE_NAME, id);
  const tv = (id, values) => formatMessageWithValues(intl, MODULE_NAME, id, values);
  const state = useSelector((s) => s.caseManagement);
  const submitting = state?.submittingMutation;
  const prevSubmitting = useRef();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);

  const selfId = decId(groupIndividual?.id);
  // is_active on the membership is authoritative; the MemberDeactivation is only read for the
  // reason shown in the tooltip and confirmation.
  const openDeactivation = (state?.memberDeactivations ?? []).find(
    (d) => d.isOpen && decId(d.groupIndividual?.id) === selfId,
  );
  const isDeactivated = deactivated ?? !!openDeactivation;
  const deactivatedIds = new Set((state?.memberDeactivations ?? [])
    .filter((d) => d.isOpen).map((d) => decId(d.groupIndividual?.id)));

  // successor candidates: active siblings that are not themselves deactivated
  const siblings = (state?.members ?? [])
    .map((m) => ({ ...m, uuid: decId(m.id) }))
    .filter((m) => m.uuid !== selfId && !deactivatedIds.has(m.uuid))
    .map((m) => ({
      id: m.uuid,
      name: `${m.individual?.firstName ?? ''} ${m.individual?.lastName ?? ''}`.trim(),
    }));

  const loadContext = () => {
    if (!groupId) return;
    dispatch(fetchGroupMembers([`group_Id: "${groupId}"`, 'isDeleted: false', 'first: 50']));
    dispatch(fetchMemberDeactivations([`group_Id: "${groupId}"`, 'first: 100']));
  };

  useEffect(() => { if (groupId) loadContext(); }, [groupId]);
  useEffect(() => { if (open) loadContext(); }, [open]);

  useEffect(() => {
    if (prevSubmitting.current && !submitting) {
      dispatch(journalize(state?.mutation));
      const parsed = parseCaseError(state?.mutation);
      setError(parsed);
      if (!parsed) {
        setOpen(false);
        loadContext();
        // the members table is fe-individual's own redux slice; nothing else refreshes it
        const refetch = modulesManager.getRef('individual.actions.fetchGroupIndividuals');
        if (refetch) dispatch(refetch([`group_Id: "${groupId}"`, 'first: 10']));
      }
    }
  }, [submitting]);
  useEffect(() => { prevSubmitting.current = submitting; });

  const name = `${groupIndividual?.individual?.firstName ?? ''} `
    + `${groupIndividual?.individual?.lastName ?? ''}`.trim();

  if (isDeactivated) {
    if (!rights.includes(RIGHT_REACTIVATION)) return null;
    const reactivate = () => {
      const reason = openDeactivation?.reasonCode ?? '';
      const run = () => dispatch(reactivateMember(
        { groupIndividualId: selfId }, t('mutation.reactivateMember'),
      ));
      if (!setConfirmedAction) return run();
      setConfirmedAction(() => run);
      return dispatch(coreConfirm(
        t('confirm.reactivateMember.title'),
        tv(openDeactivation?.propagationId
          ? 'confirm.reactivateMember.cascadeMessage'
          : 'confirm.reactivateMember.message',
        { name, reason }),
      ));
    };
    return (
      <Tooltip title={tv('action.reactivateMember', { reason })}>
        <span>
          <IconButton onClick={reactivate}><ReplayIcon /></IconButton>
        </span>
      </Tooltip>
    );
  }

  if (!rights.includes(RIGHT_DEACTIVATION_CREATE)) return null;

  const submit = (values) => {
    const run = () => dispatch(deactivateMember(values, t('mutation.deactivateMember')));
    if (!setConfirmedAction) return run();
    setConfirmedAction(() => run);
    return dispatch(coreConfirm(
      t('confirm.deactivateMember.title'),
      tv(values.reasonCode === 'DECEASED'
        ? 'confirm.deactivateMember.deceasedMessage'
        : 'confirm.deactivateMember.message', { name }),
    ));
  };

  return (
    <>
      <Tooltip title={t('action.deactivateMember')}>
        <span>
          <IconButton disabled={disabled} onClick={() => { setError(null); setOpen(true); }}>
            <PersonAddDisabledIcon />
          </IconButton>
        </span>
      </Tooltip>
      {open && (
        <MemberDeactivationDialog
          open
          member={{
            id: selfId,
            version: groupIndividual?.version,
            role: groupIndividual?.role,
            recipientType: groupIndividual?.recipientType,
            name,
            groupId,
          }}
          siblings={siblings}
          error={error}
          onClose={() => setOpen(false)}
          onSubmit={submit}
        />
      )}
    </>
  );
}

export default MemberDeactivateAction;
