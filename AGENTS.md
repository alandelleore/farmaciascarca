# AGENTS.md - Farmacias Carcarana

## Development Commands

- **Run web app**: `npm run dev` (in `app/` folder)
- **Build web app**: `npm run build` (in `app/` folder)
- **Build & deploy APK**:
  ```bash
  cd nativa
  # Regenerate PNG icons from SVG first
  node -e "const sharp=require('sharp');sharp('assets/icon.svg').resize(1024,1024).png().toFile('assets/icon.png')"
  npx expo prebuild --platform android --clean
  npx eas build --platform android --profile preview --clear-cache
  ```
- **Deploy Functions**: `cd functions && npm run deploy`

## Architecture

| Directory | Type | Framework |
|-----------|------|-----------|
| `app/` | Web frontend | React + Vite + MUI |
| `nativa/` | Mobile app | Expo (WebView) |
| `functions/` | Backend | Firebase Cloud Functions |

## Production URLs

| Service | URL |
|---------|-----|
| Web | https://farmaciascarca-tau.vercel.app |
| APK | https://farmacias-436a4.web.app/farmacias.apk |

## Theme

- Primary: `#006D5C` (green)
- Secondary: `#004D40` (dark green)
- Icon: FC with white cross on green background

## Native App Assets

Icon files in `nativa/assets/`:
- `icon.svg`, `icon.png` - App icon (1024x1024)
- `adaptive-icon.svg`, `adaptive-icon.png` - Adaptive icon
- `splash-icon.svg`, `splash-icon.png` - Splash screen

## Important Files

- `app/src/App.tsx` - Main web component with green theme
- `app/src/main.tsx` - Entry point
- `app/public/farmacias.apk` - APK for download (linked)
- `nativa/App.tsx` - Native app entry point (WebView wrapper)
- `nativa/app.json` - Expo config (green splash background)
- `app/src/firebase.ts` - Firebase configuration

## APK Build Notes

1. Regenerate PNG icons from SVG before `prebuild`:
   ```bash
   node -e "const sharp=require('sharp');sharp('assets/icon.svg').resize(1024,1024).png().toFile('assets/icon.png')"
   ```
2. Run `prebuild` then `eas build`
3. Upload to Firebase Hosting after build completes:
   ```bash
   Invoke-WebRequest -Uri "BUILD_URL" -OutFile "app/public/farmacias.apk"
   firebase deploy --only hosting
   ```

## Cleartext Traffic

Android manifest has `android:usesCleartextTraffic="true"` to allow HTTP connections (pharmacies website uses HTTP).