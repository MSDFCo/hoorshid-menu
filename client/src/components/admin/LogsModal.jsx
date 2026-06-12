import { useEffect, useState } from 'react';
import { useLang } from '../../i18n.jsx';
import { api } from '../../lib/api.js';

/** Manager-only: recent admin activity, newest first, filterable by user. */
export default function LogsModal({ onClose }) {
  const { t, lang } = useLang();
  const [logs, setLogs] = useState(null);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  const load = (user = filter) => {
    setError('');
    api
      .get(`/api/logs?limit=300${user ? `&user=${encodeURIComponent(user)}` : ''}`)
      .then((d) => setLogs(d.logs))
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load('');
    api.get('/api/users').then((d) => setUsers(d.users)).catch(() => {});
  }, []);

  const actionLabel = (action) => {
    const key = `log_${action.replaceAll('.', '_')}`;
    const label = t(key);
    return label === key ? action : label;
  };

  const formatTime = (utc) =>
    new Date(utc.replace(' ', 'T') + 'Z').toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>{t('activityLog')}</h2>

        <div className="log-toolbar">
          <select className="select" value={filter}
            onChange={(e) => { setFilter(e.target.value); load(e.target.value); }}>
            <option value="">{t('allUsers')}</option>
            {users.map((u) => (
              <option key={u.id} value={u.username}>{u.username}</option>
            ))}
          </select>
          <button className="btn btn-sm" onClick={() => load()}>{t('refresh')}</button>
        </div>

        {error && <p className="form-error">{error}</p>}
        {logs && logs.length === 0 && <p className="muted">{t('noLogs')}</p>}
        {logs && logs.length > 0 && (
          <div className="log-table">
            <div className="log-row log-head">
              <span>{t('colTime')}</span>
              <span>{t('colUser')}</span>
              <span>{t('colAction')}</span>
              <span>{t('colDetail')}</span>
            </div>
            {logs.map((l) => (
              <div className="log-row" key={l.id}>
                <span className="log-time">{formatTime(l.created_at)}</span>
                <span className="log-user" dir="ltr">{l.username || '—'}</span>
                <span className="log-action">{actionLabel(l.action)}</span>
                <span className="log-detail">{l.detail}</span>
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>{t('close')}</button>
        </div>
      </div>
    </div>
  );
}
