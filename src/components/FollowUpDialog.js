import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import Alert from '@material-ui/lab/Alert';
import AssignmentOutlined from '@material-ui/icons/AssignmentOutlined';
import ContactPhoneOutlined from '@material-ui/icons/ContactPhoneOutlined';
import CreateOutlined from '@material-ui/icons/CreateOutlined';
import EventOutlined from '@material-ui/icons/EventOutlined';
import MoneyOffOutlined from '@material-ui/icons/MoneyOffOutlined';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import PersonOutline from '@material-ui/icons/PersonOutline';
import ReportProblemOutlined from '@material-ui/icons/ReportProblemOutlined';
import SaveOutlined from '@material-ui/icons/SaveOutlined';
import VerifiedUserOutlined from '@material-ui/icons/VerifiedUserOutlined';
import {
  ConstantBasedPicker, TextInput, formatMessage, formatMessageWithValues, historyPush, useHistory,
  useModulesManager,
} from '@openimis/fe-core';
import {
  PreviewDialog, PreviewSection, PreviewText, usePreviewStyles, PREVIEW_INK, PREVIEW_PANEL,
} from '@openimis/fe-tasaf_common';
import { FOLLOW_UP_STATUSES, MODULE_NAME } from '../constants';

const CLOSED = ['RESOLVED', 'CANCELLED'];

const CATEGORY_ICONS = {
  PAYMENT_FAILURE: MoneyOffOutlined,
  ACCOUNT_VERIFICATION: VerifiedUserOutlined,
  DATA_QUALITY: ReportProblemOutlined,
  BENEFICIARY_CONTACT: ContactPhoneOutlined,
};

const useStyles = makeStyles((theme) => {
  const teal = theme.palette.primary.main;
  return {
    identity: { display: 'flex', flexDirection: 'column', gap: 10 },
    tile: {
      width: 46, height: 46, borderRadius: 12, background: teal, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    overdueTag: {
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
      padding: '12px 16px', borderLeft: `3px solid ${teal}`, background: PREVIEW_PANEL, borderRadius: '0 10px 10px 0',
      whiteSpace: 'pre-wrap',
    },
    form: { display: 'flex', flexDirection: 'column', gap: 16 },
    statusField: { maxWidth: 280 },
    alert: { marginTop: 16 },
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

function FollowUpDialog({
  open, row, canUpdate, submitting, error, onClose, onSave,
}) {
  const intl = useIntl();
  const history = useHistory();
  const modulesManager = useModulesManager();
  const p = usePreviewStyles();
  const classes = useStyles();
  const t = (id) => formatMessage(intl, MODULE_NAME, id);
  const tv = (id, values) => formatMessageWithValues(intl, MODULE_NAME, id, values);
  const [status, setStatus] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    setStatus(row?.status ?? null);
    setResolutionNote(row?.resolutionNote ?? '');
  }, [row?.id]);

  if (!row) return null;
  const editable = canUpdate && !CLOSED.includes(row.status);
  const needsNote = CLOSED.includes(status);
  const changed = status !== row.status || resolutionNote !== (row.resolutionNote ?? '');
  const Icon = CATEGORY_ICONS[row.category] || AssignmentOutlined;
  const openHousehold = row.group?.uuid ? () => {
    onClose();
    historyPush(modulesManager, history, 'individual.route.group', [row.group.uuid]);
  } : null;

  const aside = (
    <div className={classes.identity}>
      <div className={classes.tile}><Icon /></div>
      <h2 className={p.heading}>{t(`category.${row.category}`)}</h2>
      {!!row.group?.code && <span className={p.code}>{row.group.code}</span>}
      <div className={p.tags}>
        <span className={p.statusTag}>{t(`followUpStatus.${row.status}`)}</span>
        {!!row.priority && <span className={p.tag}>{t(`followUpFilter.priority.${row.priority}`)}</span>}
        {row.isOverdue && <span className={classes.overdueTag}>{t('followUp.overdue')}</span>}
      </div>
      <div className={classes.facts}>
        <Fact classes={classes} icon={<EventOutlined />} value={row.dueDate} sub={t('followUp.dueDate')} />
        <Fact classes={classes} icon={<PersonOutline />} value={row.assignedTo?.username} sub={t('followUp.assignedTo')} />
        <Fact
          classes={classes}
          icon={<CreateOutlined />}
          value={row.userCreated?.username}
          sub={tv('followUpDialog.createdOn', { date: row.dateCreated?.slice(0, 10) ?? '—' })}
        />
      </div>
    </div>
  );

  return (
    <PreviewDialog
      open={open}
      onClose={onClose}
      title={t('followUpDialog.title')}
      closeLabel={t('followUpDialog.close')}
      aside={aside}
      meta={<span>{tv('followUpDialog.meta', { version: row.version ?? '—' })}</span>}
      actions={(
        <>
          <Button onClick={onClose} color="primary">{t('followUpDialog.close')}</Button>
          {!!openHousehold && (
            <Button
              onClick={openHousehold}
              color="primary"
              variant={editable ? 'text' : 'contained'}
              disableElevation
              startIcon={<OpenInNewIcon />}
            >
              {t('followUpDialog.openHousehold')}
            </Button>
          )}
          {editable && (
            <Button
              color="primary"
              variant="contained"
              disableElevation
              startIcon={<SaveOutlined />}
              disabled={submitting || !changed || (needsNote && !resolutionNote.trim())}
              onClick={() => onSave(row, status, resolutionNote.trim())}
            >
              {t('followUpDialog.save')}
            </Button>
          )}
        </>
      )}
    >
      <PreviewSection label={t('followUp.remark')}>
        <PreviewText moreLabel={t('followUpDialog.readMore')} lessLabel={t('followUpDialog.readLess')}>
          <div className={classes.quote}>{row.remark}</div>
        </PreviewText>
      </PreviewSection>
      {!editable && !!row.resolutionNote && (
        <PreviewSection
          label={row.resolvedAt
            ? tv('followUpDialog.resolvedOn', { date: row.resolvedAt.slice(0, 10) })
            : t('followUpDialog.resolutionNote')}
        >
          <PreviewText moreLabel={t('followUpDialog.readMore')} lessLabel={t('followUpDialog.readLess')}>
            <div className={classes.quote}>{row.resolutionNote}</div>
          </PreviewText>
        </PreviewSection>
      )}
      {editable && (
        <PreviewSection label={t('followUpDialog.update')}>
          <div className={classes.form}>
            <div className={classes.statusField}>
              <ConstantBasedPicker
                module={MODULE_NAME}
                label="followUpFilter.status"
                constants={FOLLOW_UP_STATUSES}
                withNull={false}
                value={status}
                onChange={setStatus}
              />
            </div>
            <TextInput
              module={MODULE_NAME}
              label={t('followUpDialog.resolutionNote')}
              required={needsNote}
              multiline
              rows={3}
              value={resolutionNote}
              onChange={setResolutionNote}
            />
          </div>
        </PreviewSection>
      )}
      {!!error && <Alert severity="error" className={classes.alert}>{error}</Alert>}
    </PreviewDialog>
  );
}

export default FollowUpDialog;
