const paths = {
  book: '<path d="M3 5.5c3.5-.8 6.5-.5 9 1.1 2.5-1.6 5.5-1.9 9-1.1v13c-3.5-.8-6.5-.5-9 1.1-2.5-1.6-5.5-1.9-9-1.1zM12 7v12"/>',
  'play-fill':'<path d="m6.5 4 13 8-13 8z" fill="currentColor" stroke="none"/>',
  pause:'<path d="M8 5v14M16 5v14" stroke-width="3.3"/>',
  cube:'<path d="m12 3 8.5 4.8v8.4L12 21l-8.5-4.8V7.8zM3.8 8 12 13l8.2-5M12 13v8"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M7.5 3v4M16.5 3v4M4 10h16M8 14h3M8 17h5"/>',
  pin:'<path d="M19.5 9.5C19.5 15 12 21 12 21S4.5 15 4.5 9.5a7.5 7.5 0 1 1 15 0Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  timer:'<circle cx="12" cy="14" r="7.5"/><path d="M12 10v4l2.5 1.5M9 2.5h6M12 3v3M19 6l1.2-1.2"/>',
  layers:'<path d="m2.5 8 9.5-5 9.5 5-9.5 5zM3 12.5l9 4.8 9-4.8M3 17l9 4.8 9-4.8"/>',
  drag:'<ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-24 12 12)"/><circle cx="12" cy="12" r="2"/>',
  reset:'<path d="M4 5v5h5M4.6 9A8 8 0 1 1 5 17"/>',
  'arrow-right':'<path d="M4 12h15m-6-6 6 6-6 6"/>',
  'arrow-up-right':'<path d="M5 19 18.5 5.5M6 5.5h12.5V18"/>',
  external:'<path d="M14 4h6v6M20 4l-9 9M10 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-4"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',minus:'<path d="M5 12h14"/>',plus:'<path d="M5 12h14M12 5v14"/>',
  orbit:'<ellipse cx="12" cy="12" rx="11" ry="5" transform="rotate(-35 12 12)"/><circle cx="12" cy="12" r="2"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>'
}
export const icon = key => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[key] || '') + '</svg>'
