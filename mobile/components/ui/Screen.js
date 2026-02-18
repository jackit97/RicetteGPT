import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { theme } from '../../theme';

export default function Screen({ children, style, edges = ['top', 'bottom'] }) {
  return (
    <SafeAreaView edges={edges} style={[styles.safe, style]}>
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  inner: { flex: 1, paddingHorizontal: theme.spacing(2) },
});
