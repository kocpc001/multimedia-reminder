# Deployment Guide - Multimedia Reminder App

Since this is a **Static Web Application** (HTML, CSS, JavaScript only), you can host it for free on many platforms.

**Crucial Requirement:** The app MUST be served over **HTTPS** (Secure connection) for the **Microphone** and **Notifications** to work. All the services below provide HTTPS by default.

## Option 1: Netlify Drop (Easiest & Fastest)

*Best for quick testing without installing Git.*

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Open your file explorer on your computer.
3. Locate the folder containing your app files (`index.html`, `style.css`, `js/` folder).
4. **Drag and drop** the entire folder into the Netlify box in your browser.
5. Netlify will upload and publish your site instantly.
6. You will get a URL like `https://random-name.netlify.app`. You can share this link with anyone!

## Option 2: GitHub Pages (Recommended for Long Term)

*Best if you want to update the code easily and keep a backup.*

1. **Create a Repository:**
    * Go to [GitHub.com](https://github.com) and create a new public repository (e.g., `multimedia-reminder`).
2. **Upload Files:**
    * Click "Upload files" in your new repository.
    * Drag and drop all your project files (`index.html`, `style.css`, `js/` folder) and commit them.
3. **Enable Pages:**
    * Go to the repository **Settings**.
    * Click on **Pages** in the left sidebar.
    * Under "Build and deployment" > "Source", select **Deploy from a branch**.
    * Select **main** (or master) branch and click **Save**.
4. **Visit Site:**
    * Wait a minute or two. GitHub will give you a link like `https://your-username.github.io/multimedia-reminder/`.

## Important Notes

### 1. Data Privacy (Local Storage)

This app uses **IndexedDB** to store your reminders, voice notes, and doodles **locally on your device**.

* **No Cloud Sync:** If you open the website on your phone, you will NOT see the reminders you created on your computer. Data does not sync between devices.
* **Clearing Data:** If you clear your browser cache/data, your reminders will be lost.

### 2. Google Calendar

The "Sync to Google Calendar" feature works by generating a link. This will work perfectly on the deployed version.

### 3. PWA (Optional Future Step)

To make this installable as a real app on your phone (Progressive Web App), you would need to add a `manifest.json` and a Service Worker. This is a good next step if you want an "App-like" experience on mobile.
