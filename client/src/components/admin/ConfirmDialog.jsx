import { useLang } from '../../i18n.jsx';

export default function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel }) {
  const { t } = useLang();
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p style={{ marginTop: 0 }}>{body}</p>
        <div className="modal-actions">
          <button className="btn" onClick={onCancel}>{t('cancel')}</button>
          <button className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
