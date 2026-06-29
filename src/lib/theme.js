export const ACCENTS = [
  { id: 'gold', label: 'Gold', value: '#C8902F' },
  { id: 'terracotta', label: 'Terracotta', value: '#B0623A' },
  { id: 'teal', label: 'Teal', value: '#1F6F6B' },
];

export function getThemeVars(dark, accent) {
  if (dark) {
    return {
      '--bg': '#0A192F',
      '--surface': '#0F2240',
      '--surface-2': '#13294B',
      '--text': '#E9EFF8',
      '--muted': '#92A3C0',
      '--navy-2': '#9DB7E8',
      '--gold': `color-mix(in srgb, ${accent} 76%, #ffffff)`,
      '--gold-soft': `color-mix(in srgb, ${accent} 45%, transparent)`,
      '--gold-tint': `color-mix(in srgb, ${accent} 16%, transparent)`,
      '--border': 'rgba(255,255,255,.10)',
      '--border-strong': 'rgba(255,255,255,.22)',
      '--shadow': 'rgba(0,0,0,.45)',
      '--chip': 'rgba(255,255,255,.07)',
      '--thumb-a': 'rgba(255,255,255,.07)',
      '--thumb-b': 'rgba(255,255,255,.02)',
      '--thumb-ink': 'rgba(233,239,248,.55)',
    };
  }
  return {
    '--bg': '#F4F2EC',
    '--surface': '#FFFFFF',
    '--surface-2': '#FBFAF6',
    '--text': '#15294D',
    '--muted': '#6E7787',
    '--navy-2': '#1E3A8A',
    '--gold': accent,
    '--gold-soft': `color-mix(in srgb, ${accent} 42%, #ffffff)`,
    '--gold-tint': `color-mix(in srgb, ${accent} 9%, transparent)`,
    '--border': 'rgba(21,41,77,.10)',
    '--border-strong': 'rgba(21,41,77,.18)',
    '--shadow': 'rgba(21,41,77,.05)',
    '--chip': 'rgba(21,41,77,.05)',
    '--thumb-a': 'rgba(21,41,77,.07)',
    '--thumb-b': 'rgba(21,41,77,.025)',
    '--thumb-ink': 'rgba(21,41,77,.5)',
  };
}
