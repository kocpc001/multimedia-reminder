# Multimedia Reminder App

A premium, local-first web application for personalized reminders (Voice, Text, Doodle).

## How to Run

Due to browser security restrictions (CORS, Microphone access, IndexedDB), this application **cannot** be run simply by double-clicking `index.html`. It must be served via a local web server.

### Option 1: VS Code Live Server (Recommended)

1. Open this folder in VS Code.
2. Install the "Live Server" extension.
3. Right-click `index.html` and select "Open with Live Server".

### Option 2: Python (If installed)

1. Open a terminal in this folder.
2. Run `python -m http.server` (or `python3 -m http.server`).
3. Open `http://localhost:8000` in your browser.

### Option 3: Chrome Web Server Extension

1. Install "Web Server for Chrome" from the Chrome Web Store.
2. Select this folder.
3. Open the provided URL.

## Features

* **Multimedia Reminders**: Record audio, draw doodles, or write text.
* **Google Calendar Sync**: Adds a direct link to your calendar event.
* **Deep Linking**: Clicking the link in the calendar opens the specific reminder.
* **Local Storage**: All data is saved locally in your browser (IndexedDB).
