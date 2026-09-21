export const icon = (name, cls = "") => {
  const paths = {
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    home: '<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/>',
    building:
      '<path d="m3 8 9-5 9 5H3Zm2 3v8m5-8v8m4-8v8m5-8v8M3 22h18M2 19h20"/>',
    route:
      '<circle cx="6" cy="5" r="2"/><circle cx="18" cy="19" r="2"/><path d="M6 7v9a3 3 0 0 0 3 3h4M18 17V8a3 3 0 0 0-3-3h-4"/>',
    layers:
      '<path d="m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    moon: '<path d="M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
    compass:
      '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z"/>',
    reset: '<path d="M3 10a9 9 0 1 1 1 7M3 4v6h6"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    mouse:
      '<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 6v4"/>',
    move: '<path d="M12 2v20M2 12h20m-14-6 4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4m12-8 4 4-4 4"/>',
    play: '<path d="m8 4 12 8-12 8V4Z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    leaf: '<path d="M20 3C9 1 1 9 6 16s16 2 14-13ZM5 20l10-11"/>',
    book: '<path d="M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1Zm0 0v15"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  };
  return `<svg class="icon ${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.pin}</svg>`;
};

export function courtyardArt(index = 0) {
  const greens = [
    "#8ca894",
    "#91a496",
    "#a4ad94",
    "#7f9c91",
    "#9baf9c",
    "#89a3a1",
  ];
  return `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="180" height="120" fill="#dce4dc"/><circle cx="145" cy="25" r="15" fill="#f2edda"/><path d="M0 77 42 54 109 72 180 53v67H0" fill="#c3d0be"/><path d="m14 86 67-34 81 34-64 34Z" fill="#b6bca8"/><path d="m29 70 54-27 64 28v28l-62 27-56-27Z" fill="#f0eee0"/><path d="m83 44 64 27v28l-62 27V69Z" fill="#d4d9cc"/><path d="m23 70 57-36 76 34-17 8-56-26-45 28Z" fill="#455650"/><path d="m79 34 6-2 77 33-6 3Z" fill="#718079"/><path d="m33 85 17-8v20l-17 8Zm25-12 15-7v21l-15 8Zm38 7 14 6v20l-14-6Zm24 10 15-6v16l-15 7Z" fill="#6b7970"/><path d="m28 68 55-29 69 30M39 65l47-24m-32 30 45-22m-26 29 43-21m-17 28 34-17" stroke="#aab2a4" stroke-width="1" opacity=".45"/><path d="M151 76v29M16 86v22" stroke="#7e8572" stroke-width="4"/><g fill="${greens[index % greens.length]}"><circle cx="151" cy="65" r="17"/><circle cx="165" cy="72" r="12"/><circle cx="140" cy="77" r="14"/><circle cx="16" cy="78" r="17"/><circle cx="5" cy="86" r="13"/></g><g fill="#b0bba4"><circle cx="146" cy="59" r="10"/><circle cx="12" cy="70" r="11"/></g></svg>`;
}
