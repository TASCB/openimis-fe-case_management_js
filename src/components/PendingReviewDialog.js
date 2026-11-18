import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Button, Table, TableBody, TableCell, TableHead, TableRow,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import AccountBalanceWalletOutlined from '@material-ui/icons/AccountBalanceWalletOutlined';
import CheckIcon from '@material-ui/icons/Check';
import EventOutlined from '@material-ui/icons/EventOutlined';
import HomeOutlined from '@material-ui/icons/HomeOutlined';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import PersonOutline from '@material-ui/icons/PersonOutline';
import PeopleOutline from '@material-ui/icons/PeopleOutline';
import PersonAddDisabledOutlined from '@material-ui/icons/PersonAddDisabledOutlined';
import PhoneAndroidOutlined from '@material-ui/icons/PhoneAndroidOutlined';
import UpdateOutlined from '@material-ui/icons/UpdateOutlined';
import {
  formatDateTimeFromISO, formatMessage, formatMessageWithValues, historyPush, TextInput, useHistory,
  useModulesManager,
} from '@openimis/fe-core';
import {
  PreviewDialog, PreviewSection, usePreviewStyles, PREVIEW_INK, PREVIEW_PANEL,
} from '@openimis/fe-tasaf_common';
import { MODULE_NAME } from '../constants';

export const parseJson = (raw) => {
  if (!raw) return null;
  if (typeof raw !== 'string') return raw;
  try { return JSON.parse(raw); } catch (e) { return null; }
};

const known = (intl, id) => !!intl.messages?.[`${MODULE_NAME}.${id}`];

export const fieldLabel = (intl, name) => {
  const key = name.replace(/^json_ext\./, '');
  if (known(intl, `field.${key}`)) return formatMessage(intl, MODULE_NAME, `field.${key}`);
  const words = key.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export const userName = (user) => {
  const full = [user?.iUser?.otherNames, user?.iUser?.lastName].filter(Boolean).join(' ');
  return full || user?.username || '';
};

const TRANSLATED_ERRORS = ['CM_SELF_APPROVAL', 'CM_ALREADY_DECIDED', 'CM_NOT_FOUND'];

const show = (intl, value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') {
    return Object.entries(value).map(([k, v]) => `${fieldLabel(intl, k)}: ${show(intl, v)}`).join(', ');
  }
  if (known(intl, `value.${value}`)) return formatMessage(intl, MODULE_NAME, `value.${value}`);
  return String(value);
};

const TYPE_ICONS = {
  PAYMENT_CHANGE: AccountBalanceWalletOutlined,
  HOUSEHOLD_UPDATE: HomeOutlined,
  MEMBER_UPDATE: PeopleOutline,
  DEACTIVATION: PersonAddDisabledOutlined,
  REPRESENTATIVE_CHANGE: PersonOutline,
};

const useStyles = makeStyles((theme) => {
  const teal = theme.palette.primary.main;
  return {
    identity: { display: 'flex', flexDirection: 'column', gap: 10 },
    tile: {
      width: 46, height: 46, borderRadius: 12, background: teal, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    criticalTag: {
      color: theme.palette.error.main, border: `1px solid ${theme.palette.error.main}`,
      borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 700,
    },
    facts: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 },
    fact: {
      display: 'flex', gap: 10, alignItems: 'flex-start',
      '& > svg': { fontSize: 18, color: teal, marginTop: 2, flex: '0 0 auto' },
    },
    factValue: { fontSize: 14, color: PREVIEW_INK, fontWeight: 600, wordBreak: 'break-word' },
    factSub: { fontSize: 12.5, opacity: 0.75 },
    quote: {
      padding: '12px 16px', borderLeft: `3px solid ${teal}`, background: PREVIEW_PANEL,
      borderRadius: '0 10px 10px 0', whiteSpace: 'pre-wrap',
    },
    after: { fontWeight: 700 },
    alert: { marginTop: 12 },
  };
});

function Fact({
  classes, icon, value, sub,
}) {
  if (!value) return null;
  return (
    <div className={classes.fact}>
      {icon}
      <div>
        <div className={classes.factValue}>{value}</div>
        {!!sub && <div className={classes.factSub}>{sub}</div>}
      </div>
    </div>
  );
}

// One dialog for both kinds of row. A proposal is decided (Approve / Reject drive the task, and
// only then does the record change). An applied edit is reviewed after the fact
// (Acknowledge / Flag; Flag opens a data-quality follow-up, it does not revert).
function PendingReviewDialog({
  open, row, canDecide, onClose, onDecide, error,
}) {
  const intl = useIntl();
  const history = useHistory();
  const modulesManager = useModulesManager();
  const p = usePreviewStyles();
  const classes = useStyles();
  const t = (id) => formatMessage(intl, MODULE_NAME, id);
  const [note, setNote] = useState('');
  useEffect(() => { setNote(''); }, [row?.id]);

  if (!row) return null;
  const summary = parseJson(row.summary) ?? {};
  const changes = parseJson(row.changes) ?? {};
  const kind = row.isProposal ? 'PROPOSAL' : 'APPLIED';
  const decidable = canDecide && row.status === 'PENDING';
  const decide = (approve) => onDecide(row, approve, note);
  const errorText = error && (TRANSLATED_ERRORS.includes(error.code)
    ? t(`error.${error.code}`) : (error.detail || error.message));
  const Icon = TYPE_ICONS[row.updateType] || UpdateOutlined;
  const openHousehold = row.group?.uuid ? () => {
    onClose();
    historyPush(modulesManager, history, 'individual.route.group', [row.group.uuid]);
  } : null;

  const aside = (
    <div className={classes.identity}>
      <div className={classes.tile}><Icon /></div>
      <h2 className={p.heading}>{t(`updateType.${row.updateType}`)}</h2>
      {!!row.group?.code && <span className={p.code}>{row.group.code}</span>}
      <div className={p.tags}>
        <span className={p.statusTag}>{t(`pending.status.${row.status}`)}</span>
        <span className={p.tag}>{t(`pending.kind.${kind}`)}</span>
        {row.severity === 'CRITICAL' && <span className={classes.criticalTag}>{t('pending.severity.CRITICAL')}</span>}
      </div>
      <div className={classes.facts}>
        <Fact classes={classes} icon={<PersonOutline />} value={userName(row.submittedBy)} sub={t('pending.submittedBy')} />
        <Fact
          classes={classes}
          icon={<EventOutlined />}
          value={row.dateCreated ? formatDateTimeFromISO(modulesManager, intl, row.dateCreated) : null}
          sub={t('pending.date')}
        />
        <Fact
          classes={classes}
          icon={<PhoneAndroidOutlined />}
          value={t(`pending.channel.${row.channel ?? 'null'}`)}
          sub={t('pending.channel')}
        />
      </div>
    </div>
  );

  return (
    <PreviewDialog
      open={open}
      onClose={onClose}
      title={t('pending.type')}
      closeLabel={t('followUpDialog.close')}
      aside={aside}
      actions={(
        <>
          <Button onClick={onClose} color="primary">{t('followUpDialog.close')}</Button>
          {!!openHousehold && (
            <Button onClick={openHousehold} color="primary" startIcon={<OpenInNewIcon />}>
              {t('followUpDialog.openHousehold')}
            </Button>
          )}
          {decidable && (
            <>
              {/* A negative decision must say why: the PAAF reads it on the phone. */}
              <Button onClick={() => decide(false)} color="primary" disabled={!note.trim()}>
                {t(`pendingReview.negative.${kind}`)}
              </Button>
              <Button
                onClick={() => decide(true)}
                color="primary"
                variant="contained"
                disableElevation
                startIcon={<CheckIcon />}
              >
                {t(`pendingReview.positive.${kind}`)}
              </Button>
            </>
          )}
        </>
      )}
    >
      <Alert severity="info">{t(`pendingReview.explain.${kind}`)}</Alert>
      {summary.apply_failed && (
        <Alert severity="error" className={classes.alert}>
          {formatMessageWithValues(intl, MODULE_NAME, 'pendingReview.applyFailed', {
            fields: (summary.unapplied_fields ?? []).map((f) => fieldLabel(intl, f)).join(', '),
          })}
        </Alert>
      )}

      <PreviewSection label={t('pending.summary')}>
        {Object.keys(changes).length ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('pendingReview.field')}</TableCell>
                <TableCell>{t('pendingReview.before')}</TableCell>
                <TableCell>{t('pendingReview.after')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(changes).map(([name, { before, after }]) => (
                <TableRow key={name}>
                  <TableCell>{fieldLabel(intl, name)}</TableCell>
                  <TableCell>{show(intl, before)}</TableCell>
                  <TableCell className={classes.after}>{show(intl, after)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <span className={p.empty}>{t('pendingReview.noChanges')}</span>
        )}
      </PreviewSection>

      {!!summary.decision_note && (
        <PreviewSection label={t('pendingReview.decisionNote')}>
          <div className={classes.quote}>{summary.decision_note}</div>
        </PreviewSection>
      )}
      {decidable && (
        <PreviewSection label={t('pendingReview.note')}>
          <TextInput module={MODULE_NAME} label="pendingReview.note" value={note} onChange={setNote} multiline rows={3} />
        </PreviewSection>
      )}
      {!!errorText && <Alert severity="error" className={classes.alert}>{errorText}</Alert>}
    </PreviewDialog>
  );
}

export default PendingReviewDialog;
