import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const resolvedFromEnv = process.env.EXPO_PUBLIC_API_URL || Constants?.expoConfig?.extra?.expoPublicApiUrl;
let API_URL;
if (Platform.OS === 'web') {
  // Expo may inject the dev server origin (port 8081). Ignore that and use the LAN backend.
  if (resolvedFromEnv && !resolvedFromEnv.includes(':8081')) {
    API_URL = resolvedFromEnv;
  } else {
    API_URL = 'http://192.168.1.61:3000';
  }
} else {
  API_URL = resolvedFromEnv || 'http://192.168.1.61:3000';
}

console.log('[API] base url =', API_URL, ' (Platform:', Platform.OS + ')');

export async function analyzeImageAsync(uri) {
  const form = new FormData();
  // Support web File objects (from <input type="file">)
  if (Platform.OS === 'web' && uri && typeof File !== 'undefined' && uri instanceof File) {
    console.log('[API] analyzeImageAsync, received File object (web):', uri.name);
    form.append('file', uri, uri.name);
  } else {
    const normalizedUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
    console.log('[API] analyzeImageAsync, uri =', normalizedUri);
    form.append('file', {
      uri: normalizedUri,
      name: 'fridge.jpg',
      type: 'image/jpeg',
    });
  }

  const res = await fetch(`${API_URL}/analyze-image`, {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
    body: form,
  });
  console.log('[API] analyzeImageAsync fetch ->', `${API_URL}/analyze-image`);
  console.log('[API] analyzeImageAsync response url=', res.url, 'status=', res.status, 'content-type=', res.headers.get('content-type'));

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch {}
    console.error('[API] analyzeImageAsync error', res.status, detail);
    throw new Error(`Errore analisi immagine: ${res.status} ${detail}`);
  }

  if (contentType.includes('text/html')) {
    const body = await res.text();
    console.error('[API] analyzeImageAsync got HTML response from', res.url, 'snippet:', body.slice(0,200));
    throw new Error('Ricevuta risposta HTML invece di JSON dal backend — probabilmente la richiesta sta andando al server Metro/Expo (porta 8081).');
  }

  return res.json();
}

export async function getRecipeDetailsAsync(title) {
  console.log('[API] getRecipeDetailsAsync ->', `${API_URL}/recipe-details`, 'title=', title);
  const res = await fetch(`${API_URL}/recipe-details`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ title }),
  });
  console.log('[API] getRecipeDetailsAsync response url=', res.url, 'status=', res.status, 'content-type=', res.headers.get('content-type'));
  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch {}
    console.error('[API] getRecipeDetailsAsync error', res.status, detail);
    throw new Error('Errore recupero dettagli ricetta: ' + detail);
  }
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('text/html')) {
    const body = await res.text();
    console.error('[API] getRecipeDetailsAsync got HTML response snippet:', body.slice(0,200));
    throw new Error('Ricevuta risposta HTML invece di JSON dal backend');
  }
  return res.json();
}

export async function registerAsync(email, password) {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch {}
    throw new Error('Register failed: ' + detail);
  }
  return res.json();
}

export async function loginAsync(email, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch {}
    throw new Error('Login failed: ' + detail);
  }
  return res.json();
}

export async function saveRecipeAsync(details) {
  const token = await AsyncStorage.getItem('userToken');
  if (!token) throw new Error('No token');
  const res = await fetch(`${API_URL}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(details),
  });
  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch {}
    throw new Error('Save recipe failed: ' + detail);
  }
  return res.json();
}

export async function getUserRecipesAsync() {
  const token = await AsyncStorage.getItem('userToken');
  if (!token) throw new Error('No token');
  const res = await fetch(`${API_URL}/recipes`, {
    method: 'GET',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch {}
    throw new Error('Get recipes failed: ' + detail);
  }
  return res.json();
}

export async function deleteRecipeAsync(index) {
  const token = await AsyncStorage.getItem('userToken');
  if (!token) throw new Error('No token');
  const res = await fetch(`${API_URL}/recipes/${index}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch {}
    throw new Error('Delete recipe failed: ' + detail);
  }
  return res.json();
}
