import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

export default function InlineLink({ title, onPress, variant = 'primary', style }) {
  return (
    <Pressable onPress={onPress} style={style} accessibilityRole="button">
      <Text style={[styles.base, variant === 'danger' ? styles.danger : styles.primary]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { fontSize: 14, fontWeight: '800' },
  primary: { color: theme.colors.primary },
  danger: { color: theme.colors.danger },
});
