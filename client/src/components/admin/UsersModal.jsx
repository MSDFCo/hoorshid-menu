import { useEffect, useState } from 'react';
import { useLang } from '../../i18n.jsx';
import { api } from '../../lib/api.js';
import ConfirmDialog from './ConfirmDialog.jsx';

/** Manager-only: list/add/delete users, reset passwords. */
export default function UsersModal({ me, onClose }) {
  const { t } = useLang();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', password: '', role: 'staff' });
  const [pwFor, setPwFor] = useState(null); // user id with the reset-password input open
  const [pwValue, setPwValue] = useState('');
  const [deleting, setDeleting] = useState(null);

  const load = () => api.get('/api/users').then((d) => setUsers(d.users)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const run = async (fn) => {
    setError('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const addUser = () =>
    run(async () => {
      await api.post('/api/users', form);
      setForm({ username: '', password: '', role: 'staff' });
    });

  const resetPassword = (id) =>
    run(async () => {
      await api.patch(`/api/users/${id}/password`, { password: pwValue });
      setPwFor(null);
      setPwValue('');
    });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t('users')}</h2>

        {users.map((u) => (
          <div className="catman-row" key={u.id}>
            <strong style={{ minWidth: 90 }} dir="ltr">{u.username}</strong>
            <span className={`role-badge ${u.role}`}>
              {u.role === 'manager' ? t('roleManager') : t('roleStaff')}
            </span>
            {pwFor === u.id ? (
              <>
                <input className="input" dir="ltr" type="password" placeholder={t('newPassword')}
                  value={pwValue} autoFocus onChange={(e) => setPwValue(e.target.value)} />
                <button className="btn btn-sm btn-primary" disabled={pwValue.length < 6}
                  onClick={() => resetPassword(u.id)}>{t('save')}</button>
                <button className="btn btn-sm" onClick={() => { setPwFor(null); setPwValue(''); }}>
                  {t('cancel')}
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-sm" onClick={() => { setPwFor(u.id); setPwValue(''); }}>
                  {t('resetPassword')}
                </button>
                {u.id !== me?.id && (
                  <button className="btn btn-sm btn-danger" onClick={() => setDeleting(u)}>×</button>
                )}
              </>
            )}
          </div>
        ))}

        <div className="catman-row" style={{ borderBlockEnd: 'none' }}>
          <input className="input" dir="ltr" placeholder={t('username')} value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
          <input className="input" dir="ltr" type="password" placeholder={t('password')} value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          <select className="select" style={{ width: 'auto' }} value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            <option value="staff">{t('roleStaff')}</option>
            <option value="manager">{t('roleManager')}</option>
          </select>
          <button className="btn btn-sm btn-primary" onClick={addUser}
            disabled={form.username.trim().length < 3 || form.password.length < 6}>
            + {t('addUser')}
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>{t('close')}</button>
        </div>
      </div>

      {deleting && (
        <ConfirmDialog
          title={t('delete')}
          body={`${t('confirmDeleteUser')} (${deleting.username})`}
          confirmLabel={t('delete')}
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            const u = deleting;
            setDeleting(null);
            run(() => api.delete(`/api/users/${u.id}`));
          }}
        />
      )}
    </div>
  );
}
