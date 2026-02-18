import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';

export default function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  accessibilityLabel,
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        (pressed && !isDisabled) ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : theme.colors.text} />
      ) : (
        <Text style={[styles.baseText, styles[variant + 'Text'], textStyle]} numberOfLines={1}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing(2),
    borderWidth: 1,
  },
  baseText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  primaryText: { color: '#fff' },

  secondary: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
  },
  secondaryText: { color: theme.colors.text },

  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  ghostText: { color: theme.colors.primary },

  dangerGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  dangerGhostText: { color: theme.colors.danger },

  pressed: { transform: [{ scale: 0.99 }], opacity: 0.92 },
  disabled: { opacity: 0.55 },
});
