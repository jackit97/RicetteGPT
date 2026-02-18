import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { loginAsync } from '../services/api';
import Screen from '../components/ui/Screen';
import TextField from '../components/ui/TextField';
import Button from '../components/ui/Button';
import InlineLink from '../components/ui/InlineLink';
import { theme } from '../theme';

export default function LoginScreen({ navigation, route }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  const signIn = async () => {
    try {
      setLoading(true);
      if (!email || !password) return Alert.alert('Errore', 'Inserisci email e password');
      const res = await loginAsync(email, password);
      const token = res.token;
      if (!token) return Alert.alert('Errore', 'Login fallito');
      // use auth context to sign in
      await auth.signIn(token, email);
    } catch (e) {
      console.error('[Login] error', e);
      Alert.alert('Errore', 'Login fallito: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'center' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.hero}>
          <Text style={styles.brand}>RicetteGPT</Text>
          <Text style={styles.subtitle}>Scansiona gli ingredienti, scegli la ricetta, cucina.</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.title}>Accedi</Text>
          <TextField
            label="Email"
            placeholder="nome@dominio.it"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
            autoComplete="email"
            inputMode="email"
            style={{ marginTop: theme.spacing(2) }}
          />
          <TextField
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            autoComplete="password"
            style={{ marginTop: theme.spacing(2) }}
          />
          <View style={{ marginTop: theme.spacing(3) }}>
            <Button title="Accedi" onPress={signIn} loading={loading} />
          </View>

          <View style={styles.row}>
            <Text style={styles.rowText}>Non hai un account?</Text>
            <InlineLink title="Registrati" onPress={() => navigation.navigate('Register')} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginBottom: theme.spacing(3),
    paddingHorizontal: theme.spacing(1),
  },
  brand: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 6,
    color: theme.colors.muted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(3),
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: theme.spacing(2),
  },
  rowText: { color: theme.colors.muted, fontSize: 14, fontWeight: '600' },
});
