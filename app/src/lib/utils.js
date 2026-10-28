export const $ = (id) => document.getElementById(id);
export const DAY = 86400000;

export function el(tag, text, cls) {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  if (cls) node.className = cls;
  return node;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

// Yükleniyor animasyonu (Uiverse · dexter-st). Harfler ekran okuyuculardan gizlenir.
export function loaderNode() {
  const wrap = el('div', null, 'loader-wrapper sm');
  wrap.setAttribute('role', 'status');
  wrap.setAttribute('aria-label', 'Loading');
  for (const ch of 'Loading') {
    const s = el('span', ch, 'loader-letter');
    s.setAttribute('aria-hidden', 'true');
    wrap.append(s);
  }
  wrap.append(el('div', null, 'loader'));
  return wrap;
}
