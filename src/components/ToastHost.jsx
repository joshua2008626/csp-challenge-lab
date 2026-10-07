import { useProgress } from '../hooks/useProgress.jsx';

export default function ToastHost() {
  const { toasts, dismissToast } = useProgress();
  return (
    <div className="toast-host" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast" onClick={() => dismissToast(t.id)}>
          <span className="toast-emoji" aria-hidden="true">
            {t.emoji}
          </span>
          <div>
            <div className="toast-title">Achievement unlocked</div>
            <div className="toast-name">{t.name}</div>
            <div className="toast-desc">{t.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
