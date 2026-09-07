/* eslint-disable default-param-last */
import {
  dispatchMutationErr, dispatchMutationReq, dispatchMutationResp,
  formatGraphQLError, formatServerError, pageInfo, parseData,
} from '@openimis/fe-core';
import { CLEAR, ERROR, REQUEST, SUCCESS } from './utils/action-type';
import { decId } from './utils/errors';

const withUuid = (items) => (items ?? []).map((item) => (
  item?.id ? { ...item, id: decId(item.id) } : item
));

export const ACTION_TYPE = {
  MUTATION: 'CASE_MUTATION',
  SEARCH_AUDITS: 'CASE_AUDITS',
  SEARCH_FOLLOW_UPS: 'CASE_FOLLOW_UPS',
  SEARCH_ACCOUNT_CORRECTIONS: 'CASE_MANAGEMENT_ACCOUNT_CORRECTIONS',
  GET_ACCOUNT_CORRECTION: 'CASE_MANAGEMENT_ACCOUNT_CORRECTION',
  SEARCH_PENDING: 'CASE_PENDING',
  SEARCH_DEACTIVATIONS: 'CASE_DEACTIVATIONS',
  SEARCH_MEMBERS: 'CASE_MEMBERS',
  SEARCH_MEMBER_DEACTIVATIONS: 'CASE_MEMBER_DEACTIVATIONS',
  FETCH_SUMMARY: 'CASE_SUMMARY',
};

const initial = {
  fetchingAudits: false, fetchedAudits: false, audits: [],
  auditsPageInfo: {}, auditsTotalCount: 0, errorAudits: null,

  fetchingFollowUps: false, fetchedFollowUps: false, followUps: [],
  followUpsPageInfo: {}, followUpsTotalCount: 0, errorFollowUps: null,

  fetchingPending: false, fetchedPending: false, pending: [],
  fetchingAccountCorrections: false,
  fetchedAccountCorrections: false,
  accountCorrections: [],
  accountCorrectionsPageInfo: {},
  accountCorrectionsTotalCount: 0,
  errorAccountCorrections: null,

  fetchingAccountCorrection: false,
  fetchedAccountCorrection: false,
  accountCorrection: null,
  errorAccountCorrection: null,
  pendingPageInfo: {}, pendingTotalCount: 0, errorPending: null,

  fetchingDeactivations: false, fetchedDeactivations: false, deactivations: [],
  deactivationsPageInfo: {}, deactivationsTotalCount: 0, errorDeactivations: null,

  fetchingMembers: false, fetchedMembers: false, members: [],
  membersPageInfo: {}, membersTotalCount: 0, errorMembers: null,

  fetchingMemberDeactivations: false, fetchedMemberDeactivations: false, memberDeactivations: [],
  memberDeactivationsPageInfo: {}, memberDeactivationsTotalCount: 0, errorMemberDeactivations: null,

  submittingMutation: false, mutation: {},
};

function connection(state, key, plural, action, stage) {
  const cap = plural.charAt(0).toUpperCase() + plural.slice(1);
  if (stage === REQUEST) {
    return { ...state, [`fetching${cap}`]: true, [`fetched${cap}`]: false, [`error${cap}`]: null };
  }
  if (stage === ERROR) {
    return { ...state, [`fetching${cap}`]: false, [`error${cap}`]: formatServerError(action.payload) };
  }
  const data = action.payload.data[key];
  return {
    ...state,
    [`fetching${cap}`]: false,
    [`fetched${cap}`]: true,
    [plural]: withUuid(parseData(data)),
    [`${plural}PageInfo`]: pageInfo(data),
    [`${plural}TotalCount`]: data?.totalCount ?? 0,
    [`error${cap}`]: formatGraphQLError(action.payload),
  };
}

function reducer(state = initial, action) {
  switch (action.type) {
    case REQUEST(ACTION_TYPE.SEARCH_AUDITS):
      return connection(state, 'casePaymentChangeAudit', 'audits', action, REQUEST);
    case SUCCESS(ACTION_TYPE.SEARCH_AUDITS):
      return connection(state, 'casePaymentChangeAudit', 'audits', action, SUCCESS);
    case ERROR(ACTION_TYPE.SEARCH_AUDITS):
      return connection(state, 'casePaymentChangeAudit', 'audits', action, ERROR);

    case REQUEST(ACTION_TYPE.SEARCH_FOLLOW_UPS):
      return connection(state, 'caseFollowUpRemark', 'followUps', action, REQUEST);
    case SUCCESS(ACTION_TYPE.SEARCH_FOLLOW_UPS):
      return connection(state, 'caseFollowUpRemark', 'followUps', action, SUCCESS);
    case ERROR(ACTION_TYPE.SEARCH_FOLLOW_UPS):
      return connection(state, 'caseFollowUpRemark', 'followUps', action, ERROR);

    case REQUEST(ACTION_TYPE.FETCH_SUMMARY):
      return { ...state, fetchingSummary: true, fetchedSummary: false, errorSummary: null };
    case SUCCESS(ACTION_TYPE.FETCH_SUMMARY):
      return {
        ...state,
        fetchingSummary: false,
        fetchedSummary: true,
        summary: action.payload.data.caseManagementSummary,
      };
    case ERROR(ACTION_TYPE.FETCH_SUMMARY):
      return { ...state, fetchingSummary: false, errorSummary: formatServerError(action.payload) };

    case REQUEST(ACTION_TYPE.SEARCH_ACCOUNT_CORRECTIONS):

      return {

        ...state, fetchingAccountCorrections: true, fetchedAccountCorrections: false,

        accountCorrections: [], errorAccountCorrections: null,

      };

    case SUCCESS(ACTION_TYPE.SEARCH_ACCOUNT_CORRECTIONS):

      return {

        ...state,

        fetchingAccountCorrections: false,

        fetchedAccountCorrections: true,

        accountCorrections: withUuid(parseData(action.payload.data.accountCorrection)),

        accountCorrectionsPageInfo: pageInfo(action.payload.data.accountCorrection),

        accountCorrectionsTotalCount: action.payload.data.accountCorrection?.totalCount ?? 0,

        errorAccountCorrections: formatGraphQLError(action.payload),

      };

    case REQUEST(ACTION_TYPE.GET_ACCOUNT_CORRECTION):
      return {
        ...state, fetchingAccountCorrection: true, fetchedAccountCorrection: false,
        accountCorrection: null, errorAccountCorrection: null,
      };

    case SUCCESS(ACTION_TYPE.GET_ACCOUNT_CORRECTION):
      return {
        ...state,
        fetchingAccountCorrection: false,
        fetchedAccountCorrection: true,
        // Filtered by id, so the connection holds at most one row.
        accountCorrection: withUuid(parseData(action.payload.data.accountCorrection))[0] ?? null,
        errorAccountCorrection: formatGraphQLError(action.payload),
      };

    case ERROR(ACTION_TYPE.GET_ACCOUNT_CORRECTION):
      return {
        ...state, fetchingAccountCorrection: false,
        errorAccountCorrection: formatServerError(action.payload),
      };

    case ERROR(ACTION_TYPE.SEARCH_ACCOUNT_CORRECTIONS):

      return {

        ...state, fetchingAccountCorrections: false,

        errorAccountCorrections: formatServerError(action.payload),

      };


    case REQUEST(ACTION_TYPE.SEARCH_PENDING):
      return connection(state, 'casePendingDataUpdate', 'pending', action, REQUEST);
    case SUCCESS(ACTION_TYPE.SEARCH_PENDING):
      return connection(state, 'casePendingDataUpdate', 'pending', action, SUCCESS);
    case ERROR(ACTION_TYPE.SEARCH_PENDING):
      return connection(state, 'casePendingDataUpdate', 'pending', action, ERROR);

    case REQUEST(ACTION_TYPE.SEARCH_DEACTIVATIONS):
      return connection(state, 'caseHouseholdDeactivation', 'deactivations', action, REQUEST);
    case SUCCESS(ACTION_TYPE.SEARCH_DEACTIVATIONS):
      return connection(state, 'caseHouseholdDeactivation', 'deactivations', action, SUCCESS);
    case ERROR(ACTION_TYPE.SEARCH_DEACTIVATIONS):
      return connection(state, 'caseHouseholdDeactivation', 'deactivations', action, ERROR);

    case REQUEST(ACTION_TYPE.SEARCH_MEMBERS):
      return connection(state, 'groupIndividual', 'members', action, REQUEST);
    case SUCCESS(ACTION_TYPE.SEARCH_MEMBERS):
      return connection(state, 'groupIndividual', 'members', action, SUCCESS);
    case ERROR(ACTION_TYPE.SEARCH_MEMBERS):
      return connection(state, 'groupIndividual', 'members', action, ERROR);

    case REQUEST(ACTION_TYPE.SEARCH_MEMBER_DEACTIVATIONS):
      return connection(state, 'caseMemberDeactivation', 'memberDeactivations', action, REQUEST);
    case SUCCESS(ACTION_TYPE.SEARCH_MEMBER_DEACTIVATIONS):
      return connection(state, 'caseMemberDeactivation', 'memberDeactivations', action, SUCCESS);
    case ERROR(ACTION_TYPE.SEARCH_MEMBER_DEACTIVATIONS):
      return connection(state, 'caseMemberDeactivation', 'memberDeactivations', action, ERROR);

    case REQUEST(ACTION_TYPE.MUTATION):
      return dispatchMutationReq(state, action);
    case ERROR(ACTION_TYPE.MUTATION):
      return dispatchMutationErr(state, action);
    case SUCCESS(ACTION_TYPE.MUTATION):
      return dispatchMutationResp(state, action.meta.clientMutationId, action);
    case CLEAR(ACTION_TYPE.MUTATION):
      return { ...state, submittingMutation: false, mutation: {} };
    default:
      return state;
  }
}

export default reducer;
