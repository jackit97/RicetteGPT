import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { analyzeImageAsync } from '../services/api';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { theme } from '../theme';

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);
  const cameraInputRef = useRef(null);
  const pickerInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [webStream, setWebStream] = useState(null);
  const [webCameraActive, setWebCameraActive] = useState(false);
  const [webVideoReady, setWebVideoReady] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('back');

  const goToRecipeList = (recipes) => {
    const parent = navigation.getParent ? navigation.getParent() : null;
    if (parent && parent.navigate) parent.navigate('RecipeList', { recipes });
    else navigation.navigate('RecipeList', { recipes });
  };

  const takeAndAnalyze = async () => {
    if (!cameraRef.current) return;
    try {
      setLoading(true);
      console.log('[Camera] taking picture...');
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
      console.log('[Camera] photo uri =', photo?.uri);
      const data = await analyzeImageAsync(photo.uri);
      console.log('[Camera] analyze response =', data);
      if (data && data.recipes) {
        goToRecipeList(data.recipes);
      } else {
        console.warn('[Camera] analyze returned no recipes', data);
        Alert.alert('Nessuna ricetta', 'Non sono state trovate ricette nella foto');
      }
    } catch (e) {
      console.error('[Camera] error', e);
      Alert.alert('Errore', 'Non sono riuscito ad analizzare la foto');
    } finally {
      setLoading(false);
    }
  };

  const handleWebFile = async (file) => {
    if (!file) return;
    try {
      setLoading(true);
      console.log('[Camera][web] file selected', file.name);
      const data = await analyzeImageAsync(file);
      console.log('[Camera][web] analyze response =', data);
      if (data && data.recipes) {
        goToRecipeList(data.recipes);
      } else {
        Alert.alert('Nessuna ricetta', 'Non sono state trovate ricette nella foto');
      }
    } catch (e) {
      console.error('[Camera][web] error', e);
      Alert.alert('Errore', 'Non sono riuscito ad analizzare la foto');
    } finally {
      setLoading(false);
    }
  };

  const pickFromGallery = async () => {
    try {
      setLoading(true);
      // Dynamic import so app doesn't fail if package not present during web
      const ImagePicker = await import('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permesso richiesto', 'Serve permesso per accedere alla galleria');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
      if (result.cancelled) return;
      const uri = result.assets ? result.assets[0].uri : result.uri;
      console.log('[Camera] picked from gallery uri =', uri);
      const data = await analyzeImageAsync(uri);
      if (data && data.recipes) {
        goToRecipeList(data.recipes);
      } else {
        Alert.alert('Nessuna ricetta', 'Non sono state trovate ricette nella foto');
      }
    } catch (err) {
      console.error('[Camera] gallery error', err);
      Alert.alert('Errore', 'Impossibile selezionare immagine dalla galleria');
    } finally {
      setLoading(false);
    }
  };

  const toggleCameraFacing = () => {
    setCameraFacing((f) => (f === 'back' ? 'front' : 'back'));
  };

  // Web fallback: provide both camera (capture) and file picker options
  const startWebCamera = async () => {
    try {
      if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        Alert.alert('Errore', 'Browser non supporta getUserMedia');
        return;
      }
      const constraints = { video: { facingMode: cameraFacing === 'back' ? 'environment' : 'user' } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[Camera][web] got stream', stream);
      // first make UI render so video element exists
      setWebStream(stream);
      setWebCameraActive(true);
      // wait for the video element to mount
      let attempts = 0;
      while (!videoRef.current && attempts < 20) {
        await new Promise((r) => setTimeout(r, 50));
        attempts += 1;
      }
      if (!videoRef.current) {
        console.warn('[Camera][web] video element not mounted');
      } else {
        const video = videoRef.current;
        try { video.muted = true; } catch (e) {}
        video.playsInline = true;
        video.autoplay = true;
        video.srcObject = stream;
        setWebVideoReady(false);
        // wait for metadata so we have videoWidth/videoHeight available and autoplay works
        await new Promise((resolve) => {
          let settled = false;
          const onLoaded = () => {
            if (settled) return;
            settled = true;
            try { console.log('[Camera][web] loadedmetadata', video.videoWidth, video.videoHeight); } catch (e) {}
            setWebVideoReady(true);
            video.removeEventListener('loadedmetadata', onLoaded);
            resolve(true);
          };
          video.addEventListener('loadedmetadata', onLoaded);
          // fallback: also try play() which may resolve if already ready
          const p = video.play();
          if (p && p.then) p.then(() => { if (!settled) { settled = true; setWebVideoReady(true); resolve(true); } }).catch((err) => { console.warn('[Camera][web] play fallback error', err); });
          // safety timeout
          setTimeout(() => {
            if (!settled) {
              settled = true;
              console.warn('[Camera][web] metadata timeout');
              resolve(true);
            }
          }, 3000);
        });
      }
    } catch (e) {
      console.error('[Camera][web] getUserMedia error', e);
      Alert.alert('Errore', 'Impossibile accedere alla fotocamera dal browser');
    }
  };

  const stopWebCamera = () => {
    try {
      if (webStream) {
        webStream.getTracks().forEach((t) => t.stop());
      }
    } catch (e) {
      console.error('[Camera][web] stop stream error', e);
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setWebStream(null);
    setWebCameraActive(false);
    setWebVideoReady(false);
  };

  const captureWebPhoto = async () => {
    try {
      if (!videoRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        await handleWebFile(file);
      }, 'image/jpeg', 0.9);
    } catch (e) {
      console.error('[Camera][web] capture error', e);
      Alert.alert('Errore', 'Impossibile acquisire la foto');
    } finally {
      stopWebCamera();
    }
  };

  if (Platform.OS === 'web') {
    return (
      <Screen>
        <input
          id="fileUploadCamera"
          ref={cameraInputRef}
          type="file"
          accept={cameraFacing === 'back' ? 'image/*;capture=environment' : 'image/*;capture=user'}
          capture={cameraFacing === 'back' ? 'environment' : 'user'}
          style={{ display: 'none' }}
          onChange={(e) => handleWebFile(e.target.files && e.target.files[0])}
        />
        <input
          id="fileUploadPicker"
          ref={pickerInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleWebFile(e.target.files && e.target.files[0])}
        />
        <View style={{ flex: 1, paddingTop: theme.spacing(3) }}>
          <Text style={styles.webTitle}>Fotocamera</Text>
          <Text style={styles.webSubtitle}>Scatta dal browser o carica un'immagine.</Text>

          {webCameraActive ? (
            <View style={{ alignItems: 'center', marginTop: theme.spacing(2) }}>
              <Card style={{ padding: theme.spacing(2) }}>
                <View style={{ position: 'relative' }}>
                <video
                  ref={(el) => (videoRef.current = el)}
                  style={{ width: 320, height: 240, backgroundColor: '#000', objectFit: 'cover' }}
                  playsInline
                  autoPlay
                />
                {!webVideoReady && (
                  <View style={{ position: 'absolute', left: 0, top: 0, width: 320, height: 240, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' }}>
                    <ActivityIndicator color="#fff" />
                    <Text style={{ color: '#fff', marginTop: 8 }}>Attivazione camera...</Text>
                  </View>
                )}
                </View>
                <View style={{ marginTop: theme.spacing(2) }}>
                  <Button title="Scatta" onPress={captureWebPhoto} disabled={!webVideoReady} loading={loading} />
                </View>
                <View style={{ marginTop: theme.spacing(1) }}>
                  <Button title="Annulla" variant="secondary" onPress={stopWebCamera} disabled={loading} />
                </View>
              </Card>
            </View>
          ) : (
            <View style={{ marginTop: theme.spacing(3) }}>
              <Card>
                <Button title="Apri fotocamera" onPress={() => startWebCamera()} loading={loading} />
                <View style={{ height: theme.spacing(1) }} />
                <Button
                  title="Carica immagine"
                  variant="secondary"
                  onPress={() => pickerInputRef.current && pickerInputRef.current.click()}
                  disabled={loading}
                />
                <View style={{ height: theme.spacing(1) }} />
                <Button
                  title={cameraFacing === 'back' ? 'Usa camera frontale' : 'Usa camera posteriore'}
                  variant="secondary"
                  onPress={toggleCameraFacing}
                  disabled={loading}
                />
              </Card>
            </View>
          )}
        </View>
      </Screen>
    );
  }

  if (!permission) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>Permesso fotocamera richiesto</Text>
        <TouchableOpacity style={styles.shutter} onPress={requestPermission}>
          <Text style={styles.shutterText}>Concedi permesso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.nativeContainer}>
      <CameraView style={styles.camera} ref={cameraRef} facing={cameraFacing} />

      <View style={styles.topHint} pointerEvents="none">
        <Text style={styles.topHintText}>Inquadra frigo o ingredienti</Text>
      </View>

      <View style={styles.bottomSheet}>
        <View style={{ alignItems: 'center' }}>
          <Button title="Scatta e analizza" onPress={takeAndAnalyze} loading={loading} />
        </View>
        <View style={styles.bottomRow}>
          <View style={{ flex: 1 }}>
            <Button title="Galleria" variant="secondary" onPress={pickFromGallery} disabled={loading} />
          </View>
          <View style={{ width: theme.spacing(1) }} />
          <View style={{ flex: 1 }}>
            <Button
              title={cameraFacing === 'back' ? 'Flip (front)' : 'Flip (rear)'}
              variant="secondary"
              onPress={toggleCameraFacing}
              disabled={loading}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nativeContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  topHint: {
    position: 'absolute',
    top: 18,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  topHintText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: 'rgba(246, 247, 251, 0.96)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    marginTop: theme.spacing(1),
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  webTitle: { color: theme.colors.text, fontSize: 22, fontWeight: '900', marginTop: theme.spacing(1) },
  webSubtitle: { color: theme.colors.muted, fontSize: 14, fontWeight: '600', marginTop: 6 },
});
