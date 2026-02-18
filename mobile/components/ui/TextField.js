import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { theme } from '../../theme';

export default function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  textContentType,
  autoComplete,
  inputMode,
  style,
}) {
  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        textContentType={textContentType}
        autoComplete={autoComplete}
        inputMode={inputMode}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  label: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing(2),
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
