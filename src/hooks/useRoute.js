import { useEffect, useState } from 'react';

/**
 * Tiny hash router (no dependency, works when the built files are opened from any static host).
 *
 *   #/                 home
 *   #/learn            learn mode          (#/learn/<topicId> deep-links a topic)
 *   #/challenges       challenge hub
 *   #/play/map/3       Map Coloring, level 3     (map | crypt | queens)
 *   #/progress         dashboard
 *   #/lab              lab mode (academic reference)
 *   #/about
 */
export function parseHash(hash) {
  const clean = (hash || '').replace(/^#/, '') || '/';
  const parts = clean.split('/').filter(Boolean);
  const [first, a, b] = parts;
  if (!first) return { name: 'home', params: {} };
  if (first === 'learn') return { name: 'learn', params: { topic: a } };
  if (first === 'challenges') return { name: 'challenges', params: {} };
  if (first === 'play' && ['map', 'crypt', 'queens'].includes(a)) {
    const level = Math.min(5, Math.max(1, parseInt(b, 10) || 1));
    return { name: 'play', params: { type: a, level } };
  }
  if (first === 'progress') return { name: 'progress', params: {} };
  if (first === 'lab') return { name: 'lab', params: { topic: a } };
  if (first === 'about') return { name: 'about', params: {} };
  return { name: 'home', params: {} };
}

export function navigate(path) {
  const target = `#${path.startsWith('/') ? path : '/' + path}`;
  if (window.location.hash === target) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = target;
  }
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
