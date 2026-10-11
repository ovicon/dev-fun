# Repository Guidelines

## Project Structure

This repository is a small, framework-free Pomodoro progressive web app. The application is kept at the repository root: `index.html` defines the interface, `style.css` contains layout and visual styles, and `app.js` implements timer behavior and browser interactions. `service-worker.js` handles offline caching and notifications; `manifest.webmanifest` configures installation; `icons/` contains app artwork. `README.md` documents the app and local serving. There is no separate source or test directory.

## Build, Test, and Development

There is no build step or package manager configuration. Start a local server from the repository root:

```powershell
py -m http.server 8000
```

Open `http://localhost:8000` in a browser. Use a local HTTP server rather than `file://` to exercise service worker, offline, and install behavior. No automated test command is configured; verify changes manually in a browser, including relevant timer modes, settings, and responsive layouts.

## Coding Style

Keep the app dependency-free and preserve its simple static structure. Use two spaces for indentation in HTML and JavaScript, semicolons in JavaScript, and descriptive `camelCase` names for variables and functions. Use lowercase, hyphen-separated CSS class names and keep existing IDs stable when they are referenced by `app.js`. Follow the existing HTML semantics and accessibility patterns (labels, button types, and ARIA attributes). There is no formatter or linter configured.

## Testing Guidelines

For UI changes, check the page at desktop and narrow mobile widths. For timer changes, verify start, pause, reset, skip, mode changes, and persistence across reloads as applicable. For PWA changes, verify installation and offline loading over localhost or HTTPS. Do not claim automated coverage; this repository currently has no test framework or coverage requirement.

## Commits and Pull Requests

Recent history uses short, plain-language summaries rather than a strict conventional-commit format. Keep commit subjects concise and action-oriented (for example, `Improve offline startup`). Pull requests should explain the user-visible change, note manual verification steps, and include screenshots for visual changes. Link related issues when available; call out changes to offline behavior, permissions, or stored settings.

## Configuration and Data

Timer preferences and session state are stored in browser `localStorage`; do not add secrets or server-side configuration to this static app. If the service worker's cached app shell changes, review its cache version and update it when needed.
