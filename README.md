# Ricette GPT

Applicazione composta da backend Python (FastAPI) e app mobile Expo/React Native.

## Prerequisiti
- Python 3.10+
- Node.js LTS, npm, e Expo CLI (`npm i -g expo-cli` opzionale per run nativo)
- Una chiave OpenAI (`OPENAI_API_KEY`) per funzionalità AI complete (altrimenti risultati di fallback)

## Setup Backend
1. Copia `backend/.env.example` in `backend/.env` e inserisci la tua `OPENAI_API_KEY`.
2. Installa le dipendenze Python:

```powershell
Push-Location "c:\Users\giacomoc\Documents\Lavoro\TestRicetteGpt\backend"; python -m pip install -r requirements.txt
```

3. Avvia il server FastAPI (porta 8000):
```powershell
Push-Location "c:\Users\giacomoc\Documents\Lavoro\TestRicetteGpt\backend"; uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

## Setup Mobile (Expo)
1. Installa le dipendenze npm:
```powershell
Push-Location "c:\Users\giacomoc\Documents\Lavoro\TestRicetteGpt\mobile"; npm install
```

2. (Opzionale) Imposta l'URL dell'API se non in locale:
   - Modifica `mobile/app.json` -> `extra.expoPublicApiUrl`

3. Avvia Expo:
```powershell
Push-Location "c:\Users\giacomoc\Documents\Lavoro\TestRicetteGpt\mobile"; npm start
```

Se usi un dispositivo fisico, assicurati che il telefono e il PC siano sulla stessa rete. Imposta `EXPO_PUBLIC_API_URL` (o `extra.expoPublicApiUrl`) con l'IP del PC: `http://<IP_PC>:8000`.

## Flusso dell'app
- Home: testo "COSA CUCINIAMO OGGI?" e bottone fotocamera.
- Fotocamera: scatta foto del frigo/ingredienti -> upload al backend.
- Lista ricette: compaiono 3 titoli suggeriti; selezionane uno.
- Dettaglio: ingredienti completi, passaggi, e foto finale del piatto.

## Note
- Senza `OPENAI_API_KEY`, il backend risponde con risultati di fallback.
- Per produzione, restringi CORS e proteggi le chiavi.
