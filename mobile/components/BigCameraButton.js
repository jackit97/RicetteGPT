import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { theme } from '../theme';

export default function BigCameraButton({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
    >
      <View style={styles.circle}>
        <View style={styles.circleInner} />
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={styles.title}>Scatta una foto</Text>
        <Text style={styles.label}>Inquadra frigo o ingredienti</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 90, 95, 0.12)',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 95, 0.35)',
  },
  circleInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: '900' },
  label: { marginTop: 6, fontSize: 13, fontWeight: '600', color: theme.colors.muted },
  pressed: { transform: [{ scale: 0.99 }], opacity: 0.92 },
});
