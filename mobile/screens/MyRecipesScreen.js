import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { getUserRecipesAsync, deleteRecipeAsync } from '../services/api';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import InlineLink from '../components/ui/InlineLink';
import { theme } from '../theme';

function dedupe(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const key = (item?.title || '').trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export default function MyRecipesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getUserRecipesAsync();
        setRecipes(dedupe(res.recipes || []));
      } catch (e) {
        console.error('[MyRecipes] load error', e);
        Alert.alert('Errore', 'Impossibile caricare le tue ricette');
      } finally {
        setLoading(false);
      }
    };
    const unsub = navigation.addListener('focus', load);
    load();
    return unsub;
  }, [navigation]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}><ActivityIndicator /></View>
      </Screen>
    );
  }

  if (!recipes.length) {
    return (
      <Screen>
        <EmptyState
          title="Nessuna ricetta salvata"
          subtitle="Quando salvi una ricetta, la troverai qui per consultarla al volo."
          ctaTitle="Scansiona ingredienti"
          onCtaPress={() => navigation.navigate('Camera')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.h1}>Le mie ricette</Text>
        <Text style={styles.h2}>Le ricette che hai salvato.</Text>
      </View>
      <FlatList
        data={recipes}
        keyExtractor={(item, idx) => `${idx}-${item.title}`}
        contentContainerStyle={{ paddingBottom: theme.spacing(2) }}
        renderItem={({ item, index }) => (
          <Card>
            <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('RecipeDetail', { details: item })}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {(item.ingredients || []).slice(0, 4).join(', ')}
                {(item.ingredients || []).length > 4 ? '…' : ''}
              </Text>
            </TouchableOpacity>

            <View style={styles.actionsRow}>
              <InlineLink
                title="Rimuovi"
                variant="danger"
                onPress={() => {
                  Alert.alert('Conferma', 'Vuoi rimuovere questa ricetta?', [
                    { text: 'Annulla', style: 'cancel' },
                    {
                      text: 'Rimuovi',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await deleteRecipeAsync(index);
                          const newList = await getUserRecipesAsync();
                          setRecipes(dedupe(newList.recipes || []));
                        } catch (e) {
                          console.error('[MyRecipes] delete error', e);
                          Alert.alert('Errore', 'Impossibile rimuovere la ricetta');
                        }
                      },
                    },
                  ]);
                }}
              />
            </View>
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={{height:12}}/>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: theme.spacing(3), paddingBottom: theme.spacing(2) },
  h1: { color: theme.colors.text, fontSize: 22, fontWeight: '900' },
  h2: { color: theme.colors.muted, fontSize: 14, fontWeight: '600', marginTop: 6 },
  title: { color: theme.colors.text, fontSize: 16, fontWeight: '900' },
  subtitle: { color: theme.colors.muted, marginTop: 8, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  actionsRow: { marginTop: theme.spacing(1.5), flexDirection: 'row', justifyContent: 'flex-end' },
});
