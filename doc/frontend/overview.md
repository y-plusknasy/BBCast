# Frontend Overview

## Tech Stack
*   **Framework**: React Native (via [Expo](https://expo.dev/))
*   **Language**: TypeScript
*   **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
*   **State Management**: React Context / Hooks
*   **Backend Integration**: Firebase JS SDK

## Directory Structure
The project follows the standard Expo Router structure:

```
frontend/
├── app/                 # Expo Router pages and layouts
│   ├── _layout.tsx      # Root layout (Auth provider, Theme provider)
│   ├── (tabs)/          # Tab navigation group
│   └── index.tsx        # Entry point
├── components/          # Reusable UI components
├── constants/           # App constants (Colors, Config)
├── hooks/               # Custom React Hooks
├── assets/              # Images and fonts
└── firebaseConfig.ts    # Firebase initialization and Emulator connection
```

## Key Features

### 1. Authentication
*   **Method**: Firebase Anonymous Authentication.
*   **Implementation**: 
    *   The app automatically signs in anonymously on launch (`app/_layout.tsx`).
    *   This ensures all database access is authenticated, even for public-facing content, allowing for secure Firestore rules.

### 2. Data Access
*   **Firestore**: 
    *   The app connects to Firestore to fetch episode metadata, scripts, and quizzes.
    *   **Development**: Connects to local Firebase Emulators (`localhost:8080`).
    *   **Production**: Connects to the live Firebase project.

## Development

### Running the App
```bash
cd frontend
npm start
```
*   Press `w` to run in Web browser.
*   Press `a` to run in Android Emulator.
*   Press `i` to run in iOS Simulator (macOS only).
*   Scan QR code with **Expo Go** app to run on physical device.

### Environment Configuration
Firebase configuration is managed in `firebaseConfig.ts`.
Currently, it is hardcoded to connect to local emulators in `__DEV__` mode.
