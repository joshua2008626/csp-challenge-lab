/**
 * Tiny inline icon set (24×24, stroke based, lucide-style) — no icon library needed.
 * Usage: <Icon name="play" size={18} />
 */
const PATHS = {
  home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16" /><path d="M9 8h7" /></>,
  gamepad: <><rect x="2.5" y="7" width="19" height="11" rx="4" /><path d="M7 10.5v4M5 12.5h4" /><circle cx="15.5" cy="11.5" r=".6" /><circle cx="18" cy="13.5" r=".6" /></>,
  flask: <><path d="M9 3h6" /><path d="M10 3v6.2L4.6 18a2 2 0 0 0 1.7 3h11.4a2 2 0 0 0 1.7-3L14 9.2V3" /><path d="M7.5 14h9" /></>,
  trophy: <><path d="M8 4h8v6a4 4 0 0 1-8 0z" /><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4" /><path d="M12 14v4M8.5 21h7M10 18h4" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" /><circle cx="12" cy="7.8" r=".6" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" /></>,
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />,
  play: <path d="M7 4.5v15l12-7.5z" />,
  pause: <><rect x="6" y="4.5" width="4" height="15" rx="1" /><rect x="14" y="4.5" width="4" height="15" rx="1" /></>,
  'skip-forward': <><path d="M5 5v14l10-7z" /><path d="M19 5v14" /></>,
  'skip-back': <><path d="M19 5v14L9 12z" /><path d="M5 5v14" /></>,
  'step-forward': <><path d="M6 5v14l9-7z" /><path d="M19 5v14" /></>,
  'step-back': <><path d="M18 5v14l-9-7z" /><path d="M5 5v14" /></>,
  restart: <><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" /><path d="M3.5 4.5v4.8h4.8" /></>,
  rotate: <><path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" /><path d="M20.5 4.5v4.8h-4.8" /></>,
  bulb: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" /></>,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  'check-circle': <><circle cx="12" cy="12" r="9" /><path d="m8 12.3 2.7 2.7L16 9.5" /></>,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  'x-circle': <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></>,
  alert: <><path d="M12 3.5 2.5 20h19z" /><path d="M12 10v4.5" /><circle cx="12" cy="17.3" r=".6" /></>,
  map: <><path d="M9 4 3 6.5v13.5L9 17.5l6 2.5 6-2.5V4L15 6.5z" /><path d="M9 4v13.5M15 6.5V20" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /><circle cx="12" cy="15.5" r="1" /></>,
  crown: <><path d="M3.5 8.5 7.5 13 12 5.5 16.5 13l4-4.5-1.5 10h-14z" /></>,
  cpu: <><rect x="6" y="6" width="12" height="12" rx="2" /><rect x="9.5" y="9.5" width="5" height="5" rx="1" /><path d="M9 2.5v3.5M15 2.5v3.5M9 18v3.5M15 18v3.5M2.5 9h3.5M2.5 15h3.5M18 9h3.5M18 15h3.5" /></>,
  zap: <path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z" />,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  undo: <><path d="M4 9h10a6 6 0 0 1 0 12H8" /><path d="m8 5-4 4 4 4" /></>,
  shuffle: <><path d="M3 7h3.5c5 0 5 10 10 10H21M3 17h3.5c1.6 0 2.7-.8 3.6-1.9M21 7h-4.5c-1.6 0-2.7.8-3.6 1.9" /><path d="m18.5 4.5 2.5 2.5-2.5 2.5M18.5 14.5 21 17l-2.5 2.5" /></>,
  'chevron-right': <path d="m9 5 7 7-7 7" />,
  'chevron-down': <path d="m5 9 7 7 7-7" />,
  'arrow-right': <path d="M4 12h16m-6-6 6 6-6 6" />,
  'arrow-down': <path d="M12 4v16m-6-6 6 6 6-6" />,
  sparkles: <><path d="M12 3.5 13.8 9l5.5 1.8-5.5 1.8L12 18l-1.8-5.4L4.7 10.8 10.2 9z" /><path d="M19 3v4M17 5h4" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4.5h12l-2 4 2 4H5" /></>,
  brain: <><path d="M9.5 4A3.5 3.5 0 0 0 6 7.5c-1.7.4-3 1.9-3 3.7 0 1.2.6 2.2 1.5 2.9A3.6 3.6 0 0 0 8 19.5 3 3 0 0 0 12 20V5.5A2.5 2.5 0 0 0 9.5 4z" /><path d="M14.5 4A3.5 3.5 0 0 1 18 7.5c1.7.4 3 1.9 3 3.7 0 1.2-.6 2.2-1.5 2.9a3.6 3.6 0 0 1-3.5 5.4 3 3 0 0 1-4-.5V5.5A2.5 2.5 0 0 1 14.5 4z" /></>,
  palette: <><path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-1.8 0-.5-.2-.9-.5-1.3-.3-.3-.5-.8-.5-1.2 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7.5" r="1" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></>,
  trending: <><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  graph: <><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="8" r="2.5" /><circle cx="9" cy="18" r="2.5" /><path d="m8.2 7 7.5.8M7.2 8.2l1.2 7.2M16.8 10.3 10.8 16.2" /></>,
  list: <><path d="M9 6h12M9 12h12M9 18h12" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  link: <><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></>,
  hash: <><path d="M5 9h15M4 15h15M10 3 8 21M16 3l-2 18" /></>,
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  swords: <><path d="m4 4 9 9M4 4h4M4 4v4" /><path d="m20 4-9 9M20 4h-4M20 4v4" /><path d="m7 17-3 3M17 17l3 3" /></>,
  scissors: <><circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><path d="M20 4 8 15.5M20 20 8 8.5" /></>,
  sliders: <><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,
  book2: <><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h11" /></>,
  clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M9 10h6M9 14h6" /></>,
  award: <><circle cx="12" cy="9" r="6" /><path d="m8.5 14 -1.5 7 5-3 5 3-1.5-7" /></>,
};

export default function Icon({ name, size = 18, className = '', strokeWidth = 2, filled = false, ...rest }) {
  const content = PATHS[name];
  if (!content) return null;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {content}
    </svg>
  );
}
