import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { getRecipeDetailsAsync } from '../services/api';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { theme } from '../theme';

export default function RecipeListScreen({ navigation, route }) {
  const { recipes = [] } = route.params || {};
  const [loadingTitle, setLoadingTitle] = useState(null);

  const selectRecipe = async (title) => {
    if (loadingTitle) return;
    try {
      setLoadingTitle(title);
      const details = await getRecipeDetailsAsync(title);
      navigation.navigate('RecipeDetail', { details });
    } catch (e) {
      console.error('[RecipeList] details error', e);
      Alert.alert('Errore', 'Impossibile caricare i dettagli della ricetta');
    } finally {
      setLoadingTitle(null);
    }
  };

  if (!recipes.length) {
    return (
      <Screen>
        <EmptyState
          title="Nessun suggerimento"
          subtitle="Riprova con una foto più nitida o con più ingredienti visibili."
          ctaTitle="Torna alla fotocamera"
          onCtaPress={() => navigation.navigate('Camera')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.h1}>Suggerimenti</Text>
        <Text style={styles.h2}>Scegli una ricetta per vedere ingredienti e passaggi.</Text>
      </View>

      <FlatList
        data={recipes}
        keyExtractor={(item, idx) => `${idx}-${item}`}
        contentContainerStyle={{ paddingBottom: theme.spacing(2) }}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.9} onPress={() => selectRecipe(item)} disabled={!!loadingTitle}>
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item}</Text>
                  <Text style={styles.subtitle}>Tocca per i dettagli</Text>
                </View>
                {loadingTitle === item ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={styles.chevron}>›</Text>
                )}
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing(1.5) }} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: theme.spacing(3), paddingBottom: theme.spacing(2) },
  h1: { color: theme.colors.text, fontSize: 22, fontWeight: '900' },
  h2: { color: theme.colors.muted, fontSize: 14, fontWeight: '600', marginTop: 6, lineHeight: 20 },
  card: { paddingVertical: theme.spacing(2), paddingHorizontal: theme.spacing(2) },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
  subtitle: { color: theme.colors.muted, marginTop: 6, fontSize: 13, fontWeight: '600' },
  chevron: { color: theme.colors.muted, fontSize: 28, fontWeight: '600', marginLeft: 6 },
});
