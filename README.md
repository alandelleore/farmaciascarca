# Farmacias de Turno - Carcarañá

App web + app nativa para consultar las farmacias de turno en Carcarañá, Santa Fe.

## Arquitectura

```
Web App (React + Firebase)
       │
       ├── Vercel (hosting automático)
       │
       └── App Nativa (Expo WebView)
              │
              └── EAS Build (APK)
```

## Estructura

```
├── app/              # Web App PWA
├── nativa/           # App nativa WebView
├── functions/        # Cloud Functions (scraper)
```

## Configuración

### Variables de Entorno para Vercel

Crear archivo `.env.local` en la raíz:

```
VITE_API_URL=https://farmacias-carcarana.vercel.app
```

### Config EAS (para APK)

```bash
cd nativa
npx eas login
npx eas build:configure
```

## Deploy Web (Vercel)

1. Subir código a GitHub
2. Conectar repo en https://vercel.com
3. Deploy automático en cada push

## Build APK (EAS)

```bash
cd nativa
npx eas build --platform android --profile preview
```