export const MODULE_NAME = 'caseManagement';

export const ROUTE_CASE_DASHBOARD = 'caseManagement/dashboard';
export const ROUTE_CASE_FOLLOW_UPS = 'caseManagement/followUps';
export const ROUTE_CASE_PENDING = 'caseManagement/pendingUpdates';
export const ROUTE_CASE_ACCOUNT_CORRECTIONS = 'caseManagement/accountCorrections';
export const ROUTE_CASE_ACCOUNT_CORRECTION = 'caseManagement/accountCorrection';

export const CASE_MAIN_MENU_CONTRIBUTION_KEY = 'caseManagement.MainMenu';
export const GROUP_TAB_LABEL_CONTRIBUTION_KEY = 'group.TabPanel.label';
export const GROUP_TAB_PANEL_CONTRIBUTION_KEY = 'group.TabPanel.panel';

export const CASE_TAB_VALUE = 'caseManagementTab';

export const RIGHT_PAYMENT_CHANGE_SEARCH = 290201;
export const RIGHT_PAYMENT_CHANGE_UPDATE = 290203;
export const RIGHT_PAYMENT_PHONE_UPDATE = 290204;
export const RIGHT_DEACTIVATION_CREATE = 290302;
export const RIGHT_REACTIVATION = 290303;
export const RIGHT_FOLLOWUP_SEARCH = 290401;
export const RIGHT_FOLLOWUP_CREATE = 290402;
export const RIGHT_FOLLOWUP_UPDATE = 290403;
export const RIGHT_PENDING_SEARCH = 290501;
export const RIGHT_CASE_SEARCH = 290101;
export const RIGHT_ACCOUNT_CORRECTION_SEARCH = 290205;
export const RIGHT_PENDING_DECIDE = 290502;

export const CASE_DEFAULT_PAGE_SIZE = 10;
export const CASE_ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
export const CASE_DEBOUNCE_TIME = 500;

// Mirrors case_management.apps.MATERIAL_PAYMENT_FIELDS. The server is authoritative; this only
// decides whether the reason field is shown before submitting.
export const MATERIAL_PAYMENT_FIELDS = ['accountNumber', 'fspType', 'fspName', 'accountName'];

export const DEACTIVATION_MODES = ['TEMPORARY', 'PERMANENT'];
export const FOLLOW_UP_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'CANCELLED'];
export const FOLLOW_UP_CATEGORIES = [
  'PAYMENT_FAILURE', 'ACCOUNT_VERIFICATION', 'DATA_QUALITY', 'BENEFICIARY_CONTACT', 'OTHER',
];
export const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

export const FSP_TYPES = ['BANK', 'MOBILE'];

// Default width for every dialog in this module. Kept in one place so the module
// stays visually consistent and the size is a single edit, not six.
export const CASE_DIALOG_MAX_WIDTH = 'md';
