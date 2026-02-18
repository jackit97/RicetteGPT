import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image, Alert } from 'react-native';
import { saveRecipeAsync } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { theme } from '../theme';

export default function RecipeDetailScreen({ route }) {
  const { details } = route.params || {};
  if (!details) return <View style={styles.center}><Text>Nessun dettaglio</Text></View>;

  const saveHandler = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return Alert.alert('Devi essere autenticato', 'Accedi o registrati per salvare');
      await saveRecipeAsync(details);
      Alert.alert('Salvato', 'Ricetta salvata nel tuo profilo');
    } catch (e) {
      console.error('[RecipeDetail] save error', e);
      Alert.alert('Errore', 'Impossibile salvare la ricetta: ' + (e.message || ''));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Screen edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {details.image_url ? (
            <Image source={{ uri: details.image_url }} style={styles.image} />
          ) : null}

          <Text style={styles.title}>{details.title}</Text>
          <Text style={styles.meta}>Ingredienti e passaggi pronti da seguire.</Text>

          <Text style={styles.section}>Ingredienti</Text>
          <Card style={styles.sectionCard}>
            {(details.ingredients || []).length ? (
              (details.ingredients || []).map((ing, i) => (
                <Text key={`ing-${i}`} style={styles.item}>• {ing}</Text>
              ))
            ) : (
              <Text style={styles.empty}>Nessun ingrediente disponibile</Text>
            )}
          </Card>

          <Text style={styles.section}>Passaggi</Text>
          <Card style={styles.sectionCard}>
            {(details.steps || []).length ? (
              (details.steps || []).map((step, i) => (
                <Text key={`step-${i}`} style={styles.step}><Text style={styles.stepNum}>{i + 1}.</Text> {step}</Text>
              ))
            ) : (
              <Text style={styles.empty}>Nessun passaggio disponibile</Text>
            )}
          </Card>

          <View style={{ height: 110 }} />
        </ScrollView>
      </Screen>

      <View style={styles.sticky}>
        <Button title="Salva ricetta" onPress={saveHandler} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { paddingTop: theme.spacing(3), paddingBottom: theme.spacing(2) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: 220, borderRadius: theme.radius.lg, marginBottom: theme.spacing(2) },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.2 },
  meta: { marginTop: 8, color: theme.colors.muted, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  section: { color: theme.colors.text, fontSize: 16, fontWeight: '900', marginTop: theme.spacing(3), marginBottom: theme.spacing(1) },
  sectionCard: { paddingVertical: theme.spacing(2) },
  item: { color: theme.colors.text, fontSize: 15, fontWeight: '600', lineHeight: 22, marginBottom: 8 },
  step: { color: theme.colors.text, fontSize: 15, fontWeight: '600', lineHeight: 22, marginBottom: 10 },
  stepNum: { color: theme.colors.primary, fontWeight: '900' },
  empty: { color: theme.colors.muted, fontSize: 14, fontWeight: '600' },
  sticky: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: theme.spacing(2),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(2),
    backgroundColor: 'rgba(246, 247, 251, 0.96)',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
