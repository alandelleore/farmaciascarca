# Farmacias de Turno - Carcarañá

App web + app nativa para consultar las farmacias de turno en Carcarañá, Santa Fe.

## URLs de Producción

| Servicio | URL |
|----------|-----|
| **Web App** | https://farmaciascarca-tau.vercel.app |
| **APK (descarga)** | https://farmacias-436a4.web.app/farmacias.apk |

## Arquitectura

```
Web App (React + Vite + MUI)
        │
        ├── Vercel (deploy automático desde GitHub)
        │
        └── App Nativa (Expo WebView)
               │
               └── EAS Build → Firebase Hosting
```

## Estructura

```
├── app/              # Web App PWA (React + Vite + MUI)
├── nativa/           # App nativa (Expo - WebView wrapper)
├── functions/        # Cloud Functions (scraper)
├── firebase.json    # Firebase config
└── package.json     # Root scripts
```

## Tema Visual

- **Color primario**: #006D5C (verde)
- **Color secundario**: #004D40 (verde oscuro)
- **Ícono**: FC con cruz blanca sobre fondo verde

## Configuración

### Variables de Entorno

Crear archivo `.env.local` en la raíz del proyecto:

```bash
VITE_API_URL=https://farmaciascarca-tau.vercel.app
```

### Credenciales

- **Firebase**: Proyecto `farmacias-436a4` (configurado en `app/src/firebase.ts`)
- **EAS**: Cuenta Expo `@alandelleore`

## Despliegues

### Web (Vercel)

1. Hacer push a GitHub
2. Vercel detecta cambios y hace deploy automáticamente
3. URL: https://farmaciascarca-tau.vercel.app

### APK (EAS + Firebase)

```bash
cd nativa
npx eas build --platform android --profile preview --clear-cache
```

El APK se sube a Firebase Hosting:
- URL fixa: https://farmacias-436a4.web.app/farmacias.apk
- También disponible desde el panel de EAS: https://expo.dev/accounts/alandelleore/projects/farmacias-nativa/builds

### Backend Functions

```bash
cd functions
npm run deploy
```

## Desarrollo Local

```bash
# Web app
npm run dev

# Native app
cd nativa
npm run dev
```

## Build

```bash
# Web
npm run build
```

## Notas Importantes

1. **APK体型**: ~59MB (más grande que el límite de GitHub de 50MB) - por eso se hostea en Firebase
2. **Íconos nativos**: Necesitan ser PNG para Expo prebuild. Usar `sharp` para convertir SVGs antes de building
3. **Cleartext Traffic**: Habilitado en Android manifest para permitir HTTP
4. **Splash**: Theme verde #006D5C