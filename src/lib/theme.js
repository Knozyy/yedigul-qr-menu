export const ACCENTS = [
  { id: 'gold', label: 'Gold', value: '#C8902F' },
  { id: 'terracotta', label: 'Terracotta', value: '#B0623A' },
  { id: 'teal', label: 'Teal', value: '#1F6F6B' },
];

// QR menü ("Boğaz'da Akşam" editoryal tasarım) token'ları.
// Admin sayfaları aşağıdaki eski getThemeVars'ı kullanmaya devam eder.
const ACCENT_ON_CREAM = { '#C8902F': '#8F6318', '#B0653A': '#8A4A28', '#2F7E6D': '#1F5A4C' };
const ACCENT_ON_NAVY = { '#C8902F': '#E2B45C', '#B0653A': '#E09B72', '#2F7E6D': '#7FC5B2' };

export function getMenuThemeVars(dark, accent) {
  if (dark) {
    return {
      '--bg': '#0A1F35',
      '--text': '#F2E9D6',
      '--muted': '#A7B4C3',
      '--muted2': '#7E8FA3',
      '--faint': 'rgba(242,233,214,0.14)',
      '--faint-strong': 'rgba(242,233,214,0.32)',
      '--accent': accent,
      '--accent-text': ACCENT_ON_NAVY[accent] || accent,
      '--on-accent': '#081726',
      '--search-bg': 'rgba(255,255,255,0.06)',
      '--search-border': 'rgba(242,233,214,0.22)',
      '--sticky-bg': 'rgba(10,31,53,0.86)',
      '--ann-bg': 'rgba(200,144,47,0.13)',
      '--ann-border': 'rgba(226,180,92,0.40)',
      '--chef-bg': 'rgba(242,233,214,0.12)',
      '--chef-ink': '#F2E9D6',
      '--diet': '#93C4AE',
      '--diet-border': 'rgba(147,196,174,0.40)',
      '--chip-soft': 'rgba(242,233,214,0.09)',
      '--scrim-btn': 'rgba(10,31,53,0.72)',
      '--sheet-bg': '#0F2A46',
    };
  }
  return {
    '--bg': '#FBF7ED',
    '--text': '#16293D',
    '--muted': '#5D6C7B',
    '--muted2': '#8A94A0',
    '--faint': 'rgba(22,41,61,0.14)',
    '--faint-strong': 'rgba(22,41,61,0.30)',
    '--accent': accent,
    '--accent-text': ACCENT_ON_CREAM[accent] || accent,
    '--on-accent': '#081726',
    '--search-bg': 'rgba(255,255,255,0.65)',
    '--search-border': 'rgba(22,41,61,0.20)',
    '--sticky-bg': 'rgba(251,247,237,0.88)',
    '--ann-bg': `${accent}14`,
    '--ann-border': `${accent}55`,
    '--chef-bg': '#16324F',
    '--chef-ink': '#F5EDDA',
    '--diet': '#3E6B5B',
    '--diet-border': 'rgba(62,107,91,0.45)',
    '--chip-soft': 'rgba(22,41,61,0.07)',
    '--scrim-btn': 'rgba(251,247,237,0.9)',
    '--sheet-bg': '#FDFAF2',
  };
}

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
