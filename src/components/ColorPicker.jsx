import Icon from './Icon.jsx';

/**
 * Colour palette for Map Coloring. Colours are never the only signal: each one also has a
 * symbol (● ▲ ■ ◆) and a name, and number keys 1–4 select them.
 */
export default function ColorPicker({ colors, value, onChange, disabled, onClear, counts = {} }) {
  return (
    <div className="picker" role="radiogroup" aria-label="Paint colour">
      {colors.map((c, i) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={value === c.id}
          className="picker-btn"
          style={{ '--swatch': c.hex }}
          onClick={() => onChange(c.id)}
          disabled={disabled}
          title={`${c.name} (press ${i + 1})`}
        >
          <span className="picker-swatch" aria-hidden="true">
            {c.symbol}
          </span>
          <span className="picker-name">{c.name}</span>
          <kbd>{i + 1}</kbd>
          {counts[c.id] > 0 && <span className="picker-count">{counts[c.id]}</span>}
        </button>
      ))}
      <button type="button" className="picker-btn picker-erase" onClick={onClear} disabled={disabled} title="Clear a region (press 0 or Backspace)">
        <Icon name="undo" size={16} />
        <span className="picker-name">Erase</span>
        <kbd>0</kbd>
      </button>
    </div>
  );
}
