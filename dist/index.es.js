import { withModulesManager, formatMessage, FormattedMessage } from '@openimis/fe-core';
import React from 'react';
import FolderIcon from '@material-ui/icons/Folder';
import flatten from 'flat';
import { Box, Paper, Typography } from '@material-ui/core';
import { withTheme, withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';

function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[r] = t, e;
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function (r) {
      return Object.getOwnPropertyDescriptor(e, r).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
      _defineProperty(e, r, t[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
    });
  }
  return e;
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}

var messages_en = {
	"menu.caseManagement": "Case Management",
	"page.title": "Case Management",
	"placeholder.text": "Case Management module - coming soon"
};

var styles = function styles(theme) {
  return {
    root: {
      padding: theme.spacing(3)
    },
    paper: {
      padding: theme.spacing(3),
      textAlign: 'center',
      marginTop: theme.spacing(3)
    }
  };
};
function CaseManagementPage(_ref) {
  var classes = _ref.classes,
    intl = _ref.intl;
    _ref.modulesManager;
  return /*#__PURE__*/React.createElement(Box, {
    className: classes.root
  }, /*#__PURE__*/React.createElement(Paper, {
    className: classes.paper
  }, /*#__PURE__*/React.createElement(Typography, {
    variant: "h4",
    gutterBottom: true
  }, formatMessage(intl, 'caseManagement', 'page.title')), /*#__PURE__*/React.createElement(Typography, {
    variant: "body1",
    color: "textSecondary"
  }, formatMessage(intl, 'caseManagement', 'placeholder.text'))));
}
var CaseManagementPage$1 = withModulesManager(injectIntl(withTheme(withStyles(styles)(CaseManagementPage))));

var ROUTE_CASE_MANAGEMENT = 'case-management';
var DEFAULT_CONFIG = {
  "translations": [{
    key: "en",
    messages: flatten(messages_en)
  }],
  "core.Router": [{
    path: ROUTE_CASE_MANAGEMENT,
    component: CaseManagementPage$1
  }],
  "socialProtection.MainMenu": [{
    text: /*#__PURE__*/React.createElement(FormattedMessage, {
      module: 'caseManagement',
      id: 'menu.caseManagement'
    }),
    icon: /*#__PURE__*/React.createElement(FolderIcon),
    route: "/".concat(ROUTE_CASE_MANAGEMENT),
    filter: function filter() {
      return true;
    },
    id: 'caseManagement.caseManagement'
  }],
  "refs": [{
    key: 'caseManagement.route.caseManagement',
    ref: ROUTE_CASE_MANAGEMENT
  }]
};
var CaseManagementModule = function CaseManagementModule(cfg) {
  return _objectSpread2(_objectSpread2({}, DEFAULT_CONFIG), cfg);
};

export { CaseManagementModule };
//# sourceMappingURL=index.es.js.map
