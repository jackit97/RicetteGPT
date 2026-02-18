import { Platform } from 'react-native';

export const theme = {
  colors: {
    bg: '#F6F7FB',
    card: '#FFFFFF',
    text: '#0F172A',
    muted: '#6B7280',
    border: '#E5E7EB',
    primary: '#FF5A5F',
    primaryDark: '#E6464B',
    danger: '#EF4444',
    success: '#10B981',
    overlay: 'rgba(15, 23, 42, 0.55)',
  },
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    pill: 999,
  },
  spacing: (n) => n * 8,
  typography: {
    title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.2 },
    h1: { fontSize: 22, fontWeight: '800', letterSpacing: -0.2 },
    h2: { fontSize: 18, fontWeight: '700' },
    body: { fontSize: 16, fontWeight: '500' },
    caption: { fontSize: 13, fontWeight: '500' },
  },
};

export function shadow(level = 1) {
  if (Platform.OS === 'android') {
    return { elevation: level * 2 };
  }
  const map = {
    1: { shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
    2: { shadowColor: '#0F172A', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  };
  return map[level] || map[1];
}
