# Keyboard Shortcut Manager

> A Chrome extension for creating fully custom keyboard shortcuts on any website — combos, leader sequences, text expansion, macros, and more.

[![CI](https://github.com/aaronsharma/chrome-keyboard-shortcut-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/aaronsharma/chrome-keyboard-shortcut-extension/actions/workflows/ci.yml)

---

## Features

**Trigger types**
- **Combo** — standard key combinations (e.g. `Ctrl+Shift+G`)
- **Leader sequence** — press a leader key, then a follow-up combo within a configurable timeout
- **Text expansion** — type an abbreviation (e.g. `;addr`) and it auto-expands to full text

**Action types**
- Open a URL in the current tab, a new tab, or a new window
- Navigate forward/back, scroll up/down/to top/bottom
- Click or fill form elements by CSS selector
- Execute arbitrary JavaScript on the page
- Run multi-step macros (with delays, error handling, and undo)
- Clipboard operations with transformations (uppercase, snake_case, encode URI, etc.)

**UI**
- **Command palette** (`Ctrl+Shift+P`) — fuzzy-search all shortcuts instantly
- **Hint overlay** (`Alt+H`) — floating panel showing every active shortcut on the current page
- **Popup** — quick-add and dashboard shortcut from the extension icon
- **Options page** — full management UI with 6 tabs

**Reliability & safety**
- Smart conflict detection: flags browser-reserved combos, warns on commonly-used ones, catches extension-level duplicates
- Import/export as JSON with add, merge, or replace modes
- Per-shortcut analytics with execution history
- Undo support for reversible DOM actions
- Cross-device sync via `chrome.storage.sync`
- Graceful fallback if service worker is asleep

---

## Installation

### From source

```bash
git clone https://github.com/aaronsharma/chrome-keyboard-shortcut-extension.git
cd chrome-keyboard-shortcut-extension
npm install
npm run build
```

Then in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select the `dist/` folder

### From a CI release artifact

1. Open the [Actions tab](https://github.com/aaronsharma/chrome-keyboard-shortcut-extension/actions) and pick a green run
2. Download the `kms-dist-*` artifact and unzip it
3. Load the unzipped `dist/` folder as an unpacked extension (same steps above)

---

## Usage

| Action | How |
|--------|-----|
| Quick-add a shortcut | Click the extension icon → **Add Shortcut** |
| Open full dashboard | Click the extension icon → **Open Dashboard** |
| Search all shortcuts | Press `Ctrl+Shift+P` anywhere |
| See active shortcuts | Press `Alt+H` anywhere |
| Manage everything | Right-click icon → **Options** |

The options page has six tabs:

| Tab | What it does |
|-----|-------------|
| **Dashboard** | List, search, edit, and delete all shortcuts |
| **New Shortcut** | Full shortcut builder with trigger + action config |
| **Macros** | Create and manage multi-step macro sequences |
| **Analytics** | Usage stats and execution history per shortcut |
| **Settings** | Leader key, theme, platform, palette hotkey, analytics opt-in |
| **Import / Export** | Bulk import/export as JSON |

---

## Trigger Types

| Type | Description | Example |
|------|-------------|---------|
| `combo` | One-shot key combination | `Ctrl+Shift+D` |
| `leader_sequence` | Leader key then a follow-up combo | `Space` → `G` within 1.5 s |
| `text_expansion` | Abbreviation typed in any text field | `;addr` → `123 Main Street` |

---

## Action Types

| Type | Description |
|------|-------------|
| `url` | Open a URL in current tab, new tab, or new window |
| `navigate` | Browser history back or forward |
| `scroll` | Scroll by amount, or jump to top/bottom |
| `click` | Click an element matching a CSS selector |
| `fill` | Fill a form field matching a CSS selector |
| `script` | Run custom JavaScript on the page |
| `macro` | Execute a named multi-step macro |
| `text_expand` | Insert expanded text at the cursor |
| `clipboard` | Copy/paste/transform clipboard content |

---

## Development

```bash
npm install          # install dependencies
npm run build        # build → dist/
npm run watch        # rebuild on file change (dev mode)
```

### Tests

```bash
npm run test:unit    # pure logic tests — no browser required
npm run test:e2e     # Puppeteer E2E tests — requires a built dist/
npm run test:e2e:ui  # same, but with a visible browser window for debugging
```

Unit tests cover validators and key-utilities. E2E tests launch Chrome with the extension loaded and exercise the full message pipeline: CRUD, shortcut firing, text expansion, conflict detection, import/export, toggle, analytics, and command palette.

---

## CI/CD

GitHub Actions runs on every push and pull request to `main`:

1. **Build** — `npm run build` produces `dist/`, uploaded as an artifact
2. **Unit tests** — `npm run test:unit`
3. **E2E tests** — `xvfb-run npm run test:e2e` (headless Chromium on Ubuntu)
4. **Auto-tag** — if the version in `package.json` doesn't have a git tag yet, CI creates an annotated `v<version>` tag automatically

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

| Increment | When |
|-----------|------|
| `PATCH` (1.0.**1**) | Bug fix only |
| `MINOR` (1.**1**.0) | New feature, backward-compatible |
| `MAJOR` (**2**.0.0) | Breaking change or architectural overhaul |

To cut a new release:
1. Bump `"version"` in `package.json`
2. Bump `"version"` in `dist/manifest.json` (must stay in sync)
3. Commit and push to `main`
4. CI auto-creates the annotated tag `v<version>`

---

## Project Structure

```
src/
├── background/
│   ├── service-worker.js      # message router & initialization
│   ├── conflict-detector.js   # browser-reserved / duplicate detection
│   ├── macro-runner.js        # multi-step macro execution (alarm-based)
│   ├── analytics-tracker.js   # usage logging
│   └── storage-manager.js     # chrome.storage wrapper
├── content/
│   ├── content-main.js        # bootstrap & message router
│   ├── key-interceptor.js     # keyboard capture engine
│   ├── command-palette.js     # Ctrl+Shift+P overlay
│   ├── hint-overlay.js        # Alt+H hints panel
│   ├── text-expander.js       # abbreviation expansion
│   └── action-executor.js     # DOM actions (scroll, click, fill, clipboard)
├── options/
│   ├── options.html / options.js
│   └── components/            # dashboard, editor, macros, analytics, import-export
├── popup/
│   └── popup.html / popup.js
└── shared/
    ├── constants.js           # message types, action types, default settings
    ├── validators.js          # shortcut & macro validation
    └── key-utils.js           # key normalization & combo utilities

tests/
├── unit/                      # validators.test.js, key-utils.test.js
└── e2e/                       # 8 test files, Puppeteer + Jest
    └── setup/                 # browser.js, helpers.js
```

---

## License

MIT
