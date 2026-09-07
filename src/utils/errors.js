// The backend puts a machine-readable code and payload as JSON in the mutation error `detail`.
export function parseCaseError(mutation) {
  const raw = mutation?.error;
  if (!raw) return null;
  let entries = raw;
  if (typeof raw === 'string') {
    try { entries = JSON.parse(raw); } catch (e) { return { code: 'CM_ERROR', message: raw }; }
  }
  const first = Array.isArray(entries) ? entries[0] : entries;
  if (!first) return null;
  let detail = first.detail;
  if (typeof detail === 'string') {
    try { detail = JSON.parse(detail); } catch (e) { detail = { code: 'CM_ERROR', detail }; }
  }
  return {
    code: detail?.code || 'CM_ERROR',
    message: first.message,
    detail: detail?.detail,
    payload: detail?.payload || {},
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function decId(value) {
  if (!value) return null;
  const s = String(value);
  if (UUID_RE.test(s) || /^\d+$/.test(s)) return s;
  try {
    const decoded = atob(s);
    const parts = decoded.split(':');
    return parts.length > 1 ? parts[parts.length - 1] : decoded;
  } catch (e) {
    return s;
  }
}
