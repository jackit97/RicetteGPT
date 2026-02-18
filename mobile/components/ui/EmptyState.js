import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import Button from './Button';

export default function EmptyState({ title, subtitle, ctaTitle, onCtaPress }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {ctaTitle && onCtaPress ? (
        <View style={{ marginTop: theme.spacing(3), width: '100%' }}>
          <Button title={ctaTitle} onPress={onCtaPress} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing(3),
  },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: theme.colors.muted, fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 8 },
});
