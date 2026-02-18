import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import InlineLink from '../components/ui/InlineLink';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const auth = useAuth();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <InlineLink
          title="Esci"
          variant="danger"
          onPress={() => auth.signOut()}
          style={{ paddingVertical: 6, paddingHorizontal: 6 }}
        />
      ),
    });
  }, [navigation, auth]);

  return (
    <Screen>
      <View style={styles.wrap}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Cosa cuciniamo oggi?</Text>
          <Text style={styles.heroTitle}>Scansiona gli ingredienti e scegli una ricetta.</Text>
          <Text style={styles.heroSubtitle}>
            Scatta una foto del frigo o del piano cucina: ti proponiamo idee pronte.
          </Text>
        </View>

        <Card style={styles.primaryCard}>
          <Text style={styles.cardTitle}>Inizia subito</Text>
          <Text style={styles.cardSubtitle}>Fotocamera → suggerimenti → dettagli → salva</Text>
          <View style={{ marginTop: theme.spacing(2) }}>
            <Button title="Scatta una foto" onPress={() => navigation.navigate('Camera')} />
          </View>
          <View style={{ marginTop: theme.spacing(1) }}>
            <Button
              title="Le mie ricette"
              variant="secondary"
              onPress={() => navigation.navigate('MyRecipes')}
            />
          </View>
        </Card>

        <View style={styles.footerHint}>
          <Text style={styles.hintTitle}>Tip</Text>
          <Text style={styles.hintText}>Con buona luce e ingredienti ben visibili, i risultati migliorano.</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingTop: theme.spacing(3), paddingBottom: theme.spacing(2) },
  hero: { paddingHorizontal: theme.spacing(1), marginBottom: theme.spacing(2) },
  kicker: { color: theme.colors.primary, fontSize: 13, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  heroTitle: { marginTop: 10, color: theme.colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.3 },
  heroSubtitle: { marginTop: 8, color: theme.colors.muted, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  primaryCard: { marginTop: theme.spacing(2) },
  cardTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '900' },
  cardSubtitle: { color: theme.colors.muted, marginTop: 6, fontSize: 13, fontWeight: '600' },
  footerHint: { marginTop: theme.spacing(3), paddingHorizontal: theme.spacing(1) },
  hintTitle: { color: theme.colors.text, fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6 },
  hintText: { marginTop: 6, color: theme.colors.muted, fontSize: 13, fontWeight: '600', lineHeight: 18 },
});
