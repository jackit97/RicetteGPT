import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme, shadow } from '../../theme';

export default function Card({ style, children }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(2),
    ...shadow(1),
  },
});
