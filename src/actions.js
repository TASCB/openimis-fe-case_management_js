import {
  graphql, formatMutation, formatPageQuery, formatPageQueryWithCount, formatGQLString,
} from '@openimis/fe-core';
import { ACTION_TYPE } from './reducer';

const AUDIT_PROJECTION = () => [
  'id', 'uuid', 'changeType', 'isMaterial', 'changedFields', 'reasonCode', 'reasonText',
  'channel', 'dateCreated', 'previousVerificationStatus',
  'userCreated { id username }', 'paymentAccount { id accountNumber fspName }',
];

const FOLLOW_UP_PROJECTION = () => [
  'id', 'uuid', 'category', 'remark', 'status', 'priority', 'dueDate', 'isOverdue',
  'resolvedAt', 'resolutionNote', 'escalatedAt', 'dateCreated',
  'assignedTo { id username }', 'group { id code }', 'userCreated { id username }',
];

const PENDING_PROJECTION = () => [
  'id', 'uuid', 'updateType', 'status', 'severity', 'summary', 'objectId', 'dateCreated',
  'submittedBy { id username }', 'group { id code }',
];

const DEACTIVATION_PROJECTION = () => [
  'id', 'uuid', 'mode', 'reasonCode', 'reasonText', 'effectiveDate', 'previousStatus',
  'reactivatedAt', 'isOpen', 'dateCreated', 'group { id code }',
];

const q = (v) => `"${formatGQLString(v ?? '')}"`;

export function fetchPaymentAudits(params) {
  return graphql(
    formatPageQueryWithCount('casePaymentChangeAudit', params, AUDIT_PROJECTION()),
    ACTION_TYPE.SEARCH_AUDITS,
  );
}

export function fetchFollowUps(params) {
  return graphql(
    formatPageQueryWithCount('caseFollowUpRemark', params, FOLLOW_UP_PROJECTION()),
    ACTION_TYPE.SEARCH_FOLLOW_UPS,
  );
}

export function fetchPendingUpdates(params) {
  return graphql(
    formatPageQueryWithCount('casePendingDataUpdate', params, PENDING_PROJECTION()),
    ACTION_TYPE.SEARCH_PENDING,
  );
}

export function fetchDeactivations(params) {
  return graphql(
    formatPageQueryWithCount('caseHouseholdDeactivation', params, DEACTIVATION_PROJECTION()),
    ACTION_TYPE.SEARCH_DEACTIVATIONS,
  );
}

const MEMBER_PROJECTION = () => [
  'id', 'uuid', 'role', 'recipientType', 'version', 'isDeleted',
  'individual { id firstName lastName dob }',
];

export function fetchGroupMembers(params) {
  return graphql(
    formatPageQueryWithCount('groupIndividual', params, MEMBER_PROJECTION()),
    ACTION_TYPE.SEARCH_MEMBERS,
  );
}

const MEMBER_DEACT_PROJECTION = () => [
  'id', 'uuid', 'reasonCode', 'reasonText', 'effectiveDate', 'isOpen', 'wasRepresentative',
  'propagationId', 'isPersonLevel', 'dateCreated',
  'groupIndividual { id }', 'individual { id firstName lastName }',
];

export function fetchMemberDeactivations(params) {
  return graphql(
    formatPageQueryWithCount('caseMemberDeactivation', params, MEMBER_DEACT_PROJECTION()),
    ACTION_TYPE.SEARCH_MEMBER_DEACTIVATIONS,
  );
}

export function reactivateMember(values, label) {
  const parts = [`groupIndividualId: "${values.groupIndividualId}"`];
  if (values.reasonText) parts.push(`reasonText: ${q(values.reasonText)}`);
  return runMutation('reactivateMember', parts.join('\n'), label);
}

const MUTATION_TYPES = ['CASE_MUTATION_REQ', 'CASE_MUTATION_RESP', 'CASE_MUTATION_ERR'];

function runMutation(name, input, label) {
  const mutation = formatMutation(name, input, label);
  return graphql(mutation.payload, MUTATION_TYPES, {
    actionType: ACTION_TYPE.MUTATION,
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel: label,
    requestedDateTime: new Date(),
  });
}

export function updatePaymentDetails(values, label) {
  const parts = [`paymentAccountId: "${values.paymentAccountId}"`];
  if (values.version != null) parts.push(`version: ${values.version}`);
  ['accountNumber', 'accountName', 'fspType', 'fspName', 'reasonCode', 'reasonText']
    .forEach((k) => { if (values[k]) parts.push(`${k}: ${q(values[k])}`); });
  if (values.isPrimary != null) parts.push(`isPrimary: ${values.isPrimary}`);
  return runMutation('updatePaymentDetails', parts.join('\n'), label);
}

export function updatePaymentPhone(values, label) {
  const parts = [
    `paymentAccountId: "${values.paymentAccountId}"`,
    `contactPhone: ${q(values.contactPhone)}`,
  ];
  if (values.version != null) parts.push(`version: ${values.version}`);
  return runMutation('updatePaymentPhone', parts.join('\n'), label);
}

export function deactivateHousehold(values, label) {
  const parts = [
    `groupId: "${values.groupId}"`,
    `mode: ${q(values.mode)}`,
    `reasonCode: ${q(values.reasonCode)}`,
    `effectiveDate: "${values.effectiveDate}"`,
  ];
  if (values.reasonText) parts.push(`reasonText: ${q(values.reasonText)}`);
  if (values.version != null) parts.push(`version: ${values.version}`);
  return runMutation('deactivateHousehold', parts.join('\n'), label);
}

export function reactivateHousehold(values, label) {
  const parts = [`groupId: "${values.groupId}"`];
  if (values.reasonText) parts.push(`reasonText: ${q(values.reasonText)}`);
  return runMutation('reactivateHousehold', parts.join('\n'), label);
}

export function deactivateMember(values, label) {
  const parts = [
    `groupIndividualId: "${values.groupIndividualId}"`,
    `reasonCode: ${q(values.reasonCode)}`,
    `effectiveDate: "${values.effectiveDate}"`,
  ];
  if (values.reasonText) parts.push(`reasonText: ${q(values.reasonText)}`);
  if (values.dateOfDeath) parts.push(`dateOfDeath: "${values.dateOfDeath}"`);
  if (values.successors?.length) {
    const list = values.successors
      .map((s) => `{ groupId: "${s.groupId}", groupIndividualId: "${s.groupIndividualId}" }`)
      .join(', ');
    parts.push(`successors: [${list}]`);
  }
  if (values.personLevel) parts.push('personLevel: true');
  if (values.version != null) parts.push(`version: ${values.version}`);
  return runMutation('deactivateMember', parts.join('\n'), label);
}

export function addFollowUpRemark(values, label) {
  const parts = [
    `groupId: "${values.groupId}"`,
    `category: ${q(values.category)}`,
    `remark: ${q(values.remark)}`,
  ];
  if (values.priority) parts.push(`priority: ${q(values.priority)}`);
  if (values.dueDate) parts.push(`dueDate: "${values.dueDate}"`);
  if (values.assignedToId) parts.push(`assignedToId: ${values.assignedToId}`);
  if (values.paymentChangeAuditId) parts.push(`paymentChangeAuditId: "${values.paymentChangeAuditId}"`);
  return runMutation('addFollowUpRemark', parts.join('\n'), label);
}

export function updateFollowUpRemark(values, label) {
  const parts = [`remarkId: "${values.remarkId}"`];
  if (values.status) parts.push(`status: ${q(values.status)}`);
  if (values.resolutionNote) parts.push(`resolutionNote: ${q(values.resolutionNote)}`);
  if (values.assignedToId) parts.push(`assignedToId: ${values.assignedToId}`);
  if (values.version != null) parts.push(`version: ${values.version}`);
  return runMutation('updateFollowUpRemark', parts.join('\n'), label);
}

export function decidePendingUpdate(values, label) {
  const parts = [`pendingId: "${values.pendingId}"`, `approve: ${!!values.approve}`];
  if (values.note) parts.push(`note: ${q(values.note)}`);
  return runMutation('decidePendingUpdate', parts.join('\n'), label);
}

// Accounts that failed verification. Status-driven, so nothing has to be pushed here.
export const ACCOUNT_CORRECTION_PROJECTION = () => [
  'id', 'uuid', 'hhid', 'recipientName', 'accountNumber', 'accountName',
  'fspName', 'fspType', 'failureReason', 'locationName',
];

// The drill-in only: verificationAttempts is a per-row subquery, so it is deliberately kept
// out of the list projection.
export const ACCOUNT_CORRECTION_DETAIL_PROJECTION = () => [
  'id', 'uuid', 'hhid', 'recipientName', 'accountNumber', 'accountName',
  'fspName', 'fspType', 'failureReason', 'locationName',
  'contactPhone', 'isPrimary', 'preAuditStatus', 'version',
  'verificationAttempts { museReference verificationType result failureReason receivedAt }',
];

export function fetchAccountCorrection(uuid) {
  return graphql(
    formatPageQuery('accountCorrection', [`id: "${uuid}"`], ACCOUNT_CORRECTION_DETAIL_PROJECTION()),
    ACTION_TYPE.GET_ACCOUNT_CORRECTION,
  );
}

export function fetchAccountCorrections(params) {
  return graphql(
    formatPageQueryWithCount('accountCorrection', params, ACCOUNT_CORRECTION_PROJECTION()),
    ACTION_TYPE.SEARCH_ACCOUNT_CORRECTIONS,
  );
}
