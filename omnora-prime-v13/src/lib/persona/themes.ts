export interface NoxisTheme {
  id: string;
  name: string;
  colors: {
    onyx: string;
    surface: string;
    electricBlue: string;
    sandstoneGold: string;
    emerald: string;
    criticalRed: string;
    background: string;
    foreground: string;
  };
}

export const THEMES: Record<string, NoxisTheme> = {
  industrial: {
    id: 'industrial',
    name: 'Industrial Dark (Default)',
    colors: {
      onyx: '#121417',
      surface: '#1A1D21',
      electricBlue: '#60A5FA',
      sandstoneGold: '#C5A059',
      emerald: '#10B981',
      criticalRed: '#EF4444',
      background: '#121417',
      foreground: '#F8FAFC',
    }
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Deep',
    colors: {
      onyx: '#020617',
      surface: '#0f172a',
      electricBlue: '#38bdf8',
      sandstoneGold: '#fde047',
      emerald: '#4ade80',
      criticalRed: '#f43f5e',
      background: '#020617',
      foreground: '#f1f5f9',
    }
  },
  emerald: {
    id: 'emerald',
    name: 'Forest Factory',
    colors: {
      onyx: '#064e3b',
      surface: '#065f46',
      electricBlue: '#10b981',
      sandstoneGold: '#fbbf24',
      emerald: '#34d399',
      criticalRed: '#f87171',
      background: '#064e3b',
      foreground: '#ecfdf5',
    }
  },
  classic: {
    id: 'classic',
    name: 'Classic Corporate',
    colors: {
      onyx: '#1e293b',
      surface: '#334155',
      electricBlue: '#3b82f6',
      sandstoneGold: '#a855f7',
      emerald: '#22c55e',
      criticalRed: '#ef4444',
      background: '#0f172a',
      foreground: '#ffffff',
    }
  }
};

export const applyTheme = (themeId: string) => {
  const theme = THEMES[themeId] || THEMES.industrial;
  const root = document.documentElement;
  
  Object.entries(theme.colors).forEach(([key, value]) => {
    // Convert camelCase to kebab-case
    const cssKey = `--color-${key.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}`;
    root.style.setProperty(cssKey, value);
  });

  // Also set the root background/foreground
  root.style.setProperty('--background', theme.colors.background);
  root.style.setProperty('--foreground', theme.colors.foreground);
  
  // Custom specific overrides if needed
  root.style.setProperty('--color-primary', theme.colors.electricBlue);
};
