import MapGame from './MapGame.jsx';
import CryptGame from './CryptGame.jsx';
import QueensGame from './QueensGame.jsx';

/** key={type-level} gives every level a clean state (timer, score, hints, solver). */
export default function Play({ type, level }) {
  const key = `${type}-${level}`;
  if (type === 'map') return <MapGame key={key} level={level} />;
  if (type === 'crypt') return <CryptGame key={key} level={level} />;
  return <QueensGame key={key} level={level} />;
}
