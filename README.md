# OJT Progress Tracker

OJT Progress Tracker is a React Native Expo app for Android-focused internship hour tracking. It includes onboarding, hour logging, progress analytics, history management, local backup/import, PDF reporting, sharing, and optional reminder notifications.

## Features

- Student onboarding with editable target hours and internship date range
- Dashboard with completion metrics, pacing estimates, and a 30-day chart
- Hour logging with break deductions, notes, and recent activity
- History screen with weekly/monthly filters, edit support, and swipe-to-delete
- Reports screen with PDF export, sharing, and copyable text summary
- Settings for profile updates, JSON/CSV export, import backup, reminders, dark mode, and data reset

## Tech Stack

- Expo SDK 55
- Expo Router
- React Native Paper
- AsyncStorage
- `expo-print`, `expo-sharing`, `expo-notifications`, `expo-document-picker`
- `react-native-chart-kit`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npx expo start
```

3. Run on Android:

```bash
npx expo start --android
```

## Notes

- Reminder notifications are scheduled for `8:00 PM` local time when enabled.
- Backup import expects a JSON file exported by this app.
- The project uses Expo Router, so the entry point is `expo-router/entry`.
