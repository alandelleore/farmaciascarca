# AGENTS.md - Farmacias Carcarana Project

## Commands

- **Run web app**: `npm run dev` (root) or `npm run dev` (in `app/`)
- **Build web app**: `npm run build` (root) or `npm run build` (in `app/`)
- **Deploy functions**: `cd functions && npm run deploy`

## Architecture

This is a Firebase monorepo with 3 deployable parts:

| Directory | Type | Framework |
|-----------|------|-----------|
| `app/` | Web frontend | React + Vite + MUI |
| `nativa/` | Mobile app | Expo (React Native) |
| `functions/` | Backend | Firebase Cloud Functions (Node 20) |

## Web App Entry Point

- Source: `app/src/App.tsx`
- Firebase config: `app/src/firebase.ts` (already configured)
- Build output: `app/dist` → deployed to Firebase Hosting

## Firebase Services Used

- Firestore (database)
- Firebase Functions (backend scraper/email)
- Hosting (`app/dist` deployed)

## Important Files

- `firebase.json` - Firebase config (hosting uses `app/dist`)