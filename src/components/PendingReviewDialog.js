import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid,
  Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { formatMessage, formatMessageWithValues, TextInput } from '@openimis/fe-core';
import { CASE_DIALOG_MAX_WIDTH, MODULE_NAME } from '../constants';

export const parseJson = (raw) => {
  if (!raw) return null;
  if (typeof raw !== 'string') return raw;
  try { return JSON.parse(raw); } catch (e) { return null; }
};

export const fieldLabel = (name) => name.replace(/^json_ext\./, '').replace(/_/g, ' ');

const TRANSLATED_ERRORS = ['CM_SELF_APPROVAL', 'CM_ALREADY_DECIDED', 'CM_NOT_FOUND'];

const show = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
};

// One dialog for both kinds of row. A proposal is decided (Approve / Reject drive the task, and
// only then does the record change). An applied edit is reviewed after the fact
// (Acknowledge / Flag; Flag opens a data-quality follow-up, it does not revert).
function PendingReviewDialog({
  open, row, canDecide, onClose, onDecide, error,
}) {
  const intl = useIntl();
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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={CASE_DIALOG_MAX_WIDTH}>
      <DialogTitle>
        {t(`updateType.${row.updateType}`)}
        {row.group?.code ? ` — ${row.group.code}` : ''}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={1} alignItems="center">
          <Grid item><Chip size="small" label={t(`pending.kind.${kind}`)} color={row.isProposal ? 'primary' : 'default'} /></Grid>
          <Grid item><Chip size="small" label={t(`pending.status.${row.status}`)} /></Grid>
          <Grid item><Chip size="small" label={t(`pending.severity.${row.severity}`)} /></Grid>
          <Grid item><Chip size="small" label={t(`pending.channel.${row.channel ?? 'null'}`)} variant="outlined" /></Grid>
          <Grid item>
            <Typography variant="body2" color="textSecondary">
              {formatMessageWithValues(intl, MODULE_NAME, 'pendingReview.submitted', {
                user: row.submittedBy?.username ?? '—', date: row.dateCreated?.slice(0, 10) ?? '—',
              })}
            </Typography>
          </Grid>
        </Grid>

        <Alert severity="info" style={{ marginTop: 12 }}>
          {t(`pendingReview.explain.${kind}`)}
        </Alert>
        {summary.apply_failed && (
          <Alert severity="error" style={{ marginTop: 8 }}>
            {formatMessageWithValues(intl, MODULE_NAME, 'pendingReview.applyFailed', {
              fields: (summary.unapplied_fields ?? []).map(fieldLabel).join(', '),
            })}
          </Alert>
        )}

        {Object.keys(changes).length ? (
          <Table size="small" style={{ marginTop: 12 }}>
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
                  <TableCell>{fieldLabel(name)}</TableCell>
                  <TableCell>{show(before)}</TableCell>
                  <TableCell><strong>{show(after)}</strong></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography variant="body2" style={{ marginTop: 12 }}>{t('pendingReview.noChanges')}</Typography>
        )}

        {summary.decision_note && (
          <Typography variant="body2" style={{ marginTop: 12 }}>
            {`${t('pendingReview.decisionNote')}: ${summary.decision_note}`}
          </Typography>
        )}
        {decidable && (
          <TextInput
            module={MODULE_NAME}
            label="pendingReview.note"
            value={note}
            onChange={setNote}
            multiline
          />
        )}
        {!!errorText && <Alert severity="error" style={{ marginTop: 8 }}>{errorText}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('dialog.cancel')}</Button>
        {decidable && (
          <>
            {/* A negative decision must say why: the PAAF reads it on the phone. */}
            <Button onClick={() => decide(false)} disabled={!note.trim()}>
              {t(`pendingReview.negative.${kind}`)}
            </Button>
            <Button onClick={() => decide(true)} color="primary" variant="contained">
              {t(`pendingReview.positive.${kind}`)}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default PendingReviewDialog;
