# Pomodoro

A small, installable Pomodoro timer. It works offline after its first successful load and keeps timer settings and today's completed focus sessions in local browser storage.

## Run locally

From this folder, start a local static server:

```powershell
py -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000). A service worker and install prompt are not available when opening `index.html` directly as a `file://` URL. On a deployed site, serve the app over HTTPS.

Use the settings button for timer lengths, auto-start behavior, and notification permission. The space bar starts or pauses the timer; `R` resets it.

