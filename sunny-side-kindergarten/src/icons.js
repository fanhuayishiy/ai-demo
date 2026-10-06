const paths = {
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  ball:'<circle cx="12" cy="12" r="9"/><path d="m12 7 4 3-1.5 4.5h-5L8 10zM12 7V3M16 10l4.5-1.5M14.5 14.5l2.5 5M9.5 14.5l-2.5 5M8 10 3.5 8.5"/>',
  palette:'<path d="M12 3a9 9 0 1 0 0 18h1.5a2.5 2.5 0 0 0 1-4.8c-1.5-.7-.4-2.8 1.5-2.8h2A3 3 0 0 0 21 10c0-4-4-7-9-7Z"/><circle cx="7.5" cy="10" r=".6"/><circle cx="11" cy="6.5" r=".6"/><circle cx="16" cy="8" r=".6"/><circle cx="7.5" cy="15" r=".6"/>',
  sprout:'<path d="M12 21v-9M12 16C5 16 3 12 3 7c6 0 9 3 9 9ZM12 12c0-6 4-9 9-9 0 6-4 9-9 9Z"/>',
  playground:'<path d="m3 21 4-14h6l4 14M5 14h10M2 7h14M10 7v8M8 15h4M16 9c4 1 1 9 6 10M5 3h8v4"/>',
  book:'<path d="M12 6C9 3 5 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-3-1-7-1-10 2Zm0 0v15M5 8h3M5 12h3M16 8h3M16 12h3"/>',
  moon:'<path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z"/><path d="M18 3v4M16 5h4"/>',
  play:'<path d="m8 4 12 8-12 8Z"/>',
  pause:'<path d="M8 4v16M16 4v16"/>',
  mouse:'<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 6v4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  minus:'<path d="M5 12h14"/>',
  home:'<path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-8h6v8"/>',
  fullscreen:'<path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5"/>',
  sound:'<path d="m11 4-5 4H2v8h4l5 4ZM15 8c3 2 3 6 0 8M18 4c6 4 6 12 0 16"/>',
  mute:'<path d="m11 4-5 4H2v8h4l5 4ZM16 9l6 6M16 15l6-6"/>',
};
export function icon(name){return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.grid}</svg>`;}
export function hydrateIcons(){document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
