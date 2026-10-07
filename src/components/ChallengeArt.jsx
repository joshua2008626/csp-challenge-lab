import { MAP_COLORS } from '../algorithms/mapColoring.js';

const [R, G, B, Y] = MAP_COLORS.map((c) => c.hex);

export function MapArt() {
  return (
    <svg viewBox="0 0 220 120" aria-hidden="true" className="art">
      <path d="M10 12h86l-14 46H10z" fill={B} /><path d="M96 12h70l-6 40-78 6z" fill={R} /><path d="M166 12h44v48l-50-8z" fill={G} />
      <path d="M10 58h72l26 50H10z" fill={Y} /><path d="M82 58l78-6 50 8v48H108z" fill={B} />
      <g fill="none" stroke="var(--surface-1)" strokeWidth="3"><path d="M96 12 82 58M82 58l26 50M82 58l78-6M166 12l-6 40M160 52l50 8" /></g>
    </svg>
  );
}
export function CryptArt() {
  return (
    <svg viewBox="0 0 220 120" aria-hidden="true" className="art">
      <g fontFamily="var(--font-mono)" fontWeight="700" fontSize="22" fill="var(--text)">
        {['S', 'E', 'N', 'D'].map((c, i) => <text key={c} x={62 + i * 32} y="32" textAnchor="middle">{c}</text>)}
        <text x="30" y="62" fill="var(--accent)">+</text>
        {['M', 'O', 'R', 'E'].map((c, i) => <text key={c} x={62 + i * 32} y="62" textAnchor="middle">{c}</text>)}
        {['M', 'O', 'N', 'E', 'Y'].map((c, i) => <text key={c} x={46 + i * 32} y="100" textAnchor="middle">{c}</text>)}
      </g>
      <line x1="30" x2="200" y1="72" y2="72" stroke="var(--accent)" strokeWidth="2" />
      <g fontFamily="var(--font-mono)" fontSize="11" fill="var(--good)" textAnchor="middle">{[1, 0, 1, 1].map((c, i) => <text key={i} x={46 + i * 32} y="12">{c}</text>)}</g>
    </svg>
  );
}
export function QueensArt() {
  const q = [1, 3, 0, 2];
  return (
    <svg viewBox="0 0 220 120" aria-hidden="true" className="art">
      {Array.from({ length: 16 }, (_, i) => { const r = Math.floor(i / 4), c = i % 4; return <rect key={i} x={60 + c * 25} y={10 + r * 25} width="25" height="25" fill={(r + c) % 2 ? 'var(--board-dark)' : 'var(--board-light)'} />; })}
      {q.map((r, c) => <text key={c} x={72.5 + c * 25} y={30 + r * 25} textAnchor="middle" fontSize="20" fill="var(--accent)">♛</text>)}
      <rect x="60" y="10" width="100" height="100" fill="none" stroke="var(--border-strong)" />
    </svg>
  );
}
