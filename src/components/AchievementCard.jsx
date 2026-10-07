import Icon from './Icon.jsx';

export default function AchievementCard({ achievement, unlockedAt }) {
  const unlocked = !!unlockedAt;
  return (
    <article className={`ach ${unlocked ? 'ach-on' : 'ach-off'}`} aria-label={`${achievement.name}: ${unlocked ? 'unlocked' : 'locked'}`}>
      <div className="ach-emoji" aria-hidden="true">
        {unlocked ? achievement.emoji : <Icon name="lock" size={22} />}
      </div>
      <div className="ach-text">
        <div className="ach-name">{achievement.name}</div>
        <div className="ach-desc">{achievement.desc}</div>
        {unlocked && <div className="ach-date">Unlocked {new Date(unlockedAt).toLocaleDateString()}</div>}
      </div>
      {unlocked && (
        <span className="badge badge-good ach-badge">
          <Icon name="check" size={12} strokeWidth={3} /> Earned
        </span>
      )}
    </article>
  );
}
