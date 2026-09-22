# KokTranslate (콕! 번역기)

A Google Chrome Extension that translates any text on a webpage instantly with a simple **point-and-click** or **drag-and-select**, powered by Google Gemini AI.

[한국어 설명서 (Korean Documentation)](README.ko.md)

---

## 🌟 Key Features

* **🔑 One-Click Free API Key Issuance**: Direct one-click shortcut to Google AI Studio right within the settings page with official Google branding for effortless onboarding.
* **⚡ Global Shortcut Support**: Toggle translation mode anytime, anywhere using `Ctrl+Shift+X` (Mac: `Command+Shift+X`) without clicking browser icons.
* **Intuitive Element Selection (DOM Hover & Highlight)**: When translation mode is active, hovering over web elements highlights them with a clean purple dashed border.
* **Point & Click Translation**: Left-click any highlighted element to instantly translate its text and view results right next to your cursor.
* **Marquee Drag Selection & Edge Auto-Scroll**: Click and drag a box to capture multi-paragraph sections or tables at once; scrolling automatically engages as you reach the top or bottom edges of the viewport.
* **🔄 Source / Translation Instant Toggle**: Effortlessly toggle between original source text and the translated result inside the tooltip header.
* **📝 Source & Translation Markdown Viewer**: Preserves original webpage markdown structures including tables (`<table>`), inline code (`<code>`), bold text (`<strong>`), and lists (`<li>`) for both original and translated text views.
* **🖐️ Draggable Tooltip**: Drag and move the translation tooltip anywhere on the screen by its header to read obstructed text underneath.
* **🔌 API Test Connection**: Quickly verify Gemini API key validity and model connectivity directly from the options page with a single click.
* **🔒 Enhanced Security & Prompt Optimization**: Sends API keys via official `x-goog-api-key` headers to prevent URL leakage, and isolates translation rules into Gemini's official `system_instruction` parameter.
* **Unidirectional LLM Translation**: Uses the Google Gemini API to provide natural, context-aware translations strictly to your chosen target language, eliminating LLM distraction and mixed-language errors.
* **Target Translation Language Selection**: Choose your preferred destination language (Korean, English, Japanese, Chinese, Spanish, French, German, Russian, Vietnamese, Hindi, etc.) directly in settings.
* **Custom Gemini Model Support**: Specify custom Gemini model IDs in settings in addition to the default (`gemini-3.5-flash-lite`).
* **Full i18n & Multilingual Support**: Built-in support for Korean and English UI and user guides. Switch languages anytime or auto-detect system language.

---

## 🚀 Installation

1. Clone or download this repository and unzip it.
2. In Chrome, navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the `kok-translate` folder.
6. Click the Extensions (puzzle) icon in your browser toolbar and pin **KokTranslate** for quick access.

---

## ⚙️ Configuration (API Key, Model & Language)

A **Google Gemini API Key** is required for translation.

1. Click the KokTranslate extension icon in your browser toolbar, then click the **Settings** button (or right-click extension icon -> Options).
2. Click the **`[Sign in with Google & Get Free API Key →]`** button at the top to generate a free Gemini API key on Google AI Studio.
3. Configure the following options and click **Save Settings**:
   - **Gemini API Key**: Paste your Gemini API Key (click the eye icon to toggle visibility).
   - **Test Connection**: Click the `[Test Connection]` button to verify API key validity immediately.
   - **Gemini Model**: Enter custom model ID (default: `gemini-3.5-flash-lite`).
   - **Target Language**: Select target translation language (default: `Korean`, with options for English, Japanese, Chinese, Spanish, Hindi, etc.).
   - **UI Language**: Select preferred UI language (Auto / Korean / English).
   - **Reset Defaults**: Restore model and language settings to defaults while safely retaining your API key.

---

## 🖱️ How to Use

1. **Activate Translation Mode (2 methods)**:
   - Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> (Mac: <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd>).
   - Or click the KokTranslate extension icon and click **Start Point & Click Mode**.
2. **Single Element Translation:** Hover over target text and left-click when the purple dashed box appears.
3. **Drag Selection Translation:** Hold down left-click and drag a box across multiple paragraphs or tables. The screen will automatically scroll when dragging near viewport edges.
4. **View Results & Toggle Source:**
   - A translation tooltip appears at the cursor location.
   - Click the **`[Source]`** button in the tooltip header to view the original text with full markdown formatting (tables, code, bold), and click **`[Translate]`** to switch back.
   - Grab the tooltip header with your mouse to drag and move it freely.
   - Click the **Copy** button at the bottom-right to copy text to clipboard.
5. **Exit Mode:** Press <kbd>ESC</kbd> or click outside the tooltip to close it and exit translation mode.

---

## 📂 Project Structure

* `manifest.json`: Extension metadata, permissions, and global keyboard shortcuts (Manifest V3)
* `_locales/`: Chrome standard locale messages (`ko`, `en`)
* `i18n.js`: Runtime multilingual dictionary and DOM binding module
* `popup.html` / `popup.js`: Extension popup UI and action triggers
* `options.html` / `options.js`: Settings page (API Key, Model ID, UI language, connection testing, and reset defaults)
* `guide.html` / `guide_en.html`: Korean and English user guides
* `content.js`: In-page DOM highlight, marquee drag box, edge auto-scroll, and draggable/toggleable tooltip UI
* `background.js`: Background Service Worker handling global commands and secure Gemini API communication

---

## 📜 Changelog

### v1.9
* **🔑 Google AI Studio One-Click Free Key Issuance**: Added a prominent `[Sign in with Google & Get Free API Key →]` shortcut button with official Google branding on the options page for frictionless user onboarding.
* **🎨 Elevated Popup UI & Branding**: Embedded an enlarged 72px brand symbol logo in the popup header and harmonized secondary action button styles ([Guide] & [Settings]) in clean light-gray.
* **🛡️ System/Restricted Page Tab Safety**: Handled cases where `tab.url` is undefined on internal pages (`chrome://`, webstore, or error screens), eliminating runtime `TypeError: Cannot read properties of undefined (reading 'startsWith')`.

### v1.8
* **🇮🇳 Hindi (힌디어) Target Language Support**: Added Hindi (`hi`) to target translation languages, enabling natural and accurate translations into Hindi powered by Google Gemini AI.
* **🌐 Multilingual Settings Expansion**: Updated the options page and runtime i18n dictionaries (Korean and English) to fully support Hindi target language selection.

### v1.7
* **⚡ Global Keyboard Shortcut**: Register `Ctrl+Shift+X` (Mac: `Command+Shift+X`) to toggle translation mode on any webpage instantly.
* **🔄 Source ↔ Translation Real-Time Toggle**: Seamlessly switch between original source text and translated results in the tooltip header.
* **📝 Source HTML to Markdown Preservation**: Automatically extracts tables (`<table>`), inline code (`<code>`), bold (`<strong>`), and lists (`<li>`) into structured Markdown for flawless original text rendering.
* **🎯 Block Container Extraction Engine**: Preserves 100% DOM Document Order and inline spacing, eliminating text reordering and unwanted line breaks within sentences.
* **📜 Marquee Edge Auto-Scroll**: Viewport automatically scrolls when dragging near top/bottom edges, seamlessly compensating coordinate deltas.
* **🖐️ Draggable Tooltip Header**: Grab and reposition tooltips freely across the screen without obstructing background content.
* **📍 Popover Viewport Coordinate Sync**: Synchronized `position: fixed` and `clientX/Y` coordinates for reliable tooltip placement on long scrolling pages.
* **🔌 API Test Connection**: Added a one-click connection test button on the options page to verify API credentials immediately.
* **🔒 Security & Prompt Hardening**: Switched to official `x-goog-api-key` headers and decoupled prompt rules into Gemini's `system_instruction` parameter.
* **🎨 UI Refinements**: Preserved options page SVG header icon during i18n binding and added SVG keyboard icons to shortcut hints.
* **📝 Markdown Viewer Rendering:** Seamlessly renders bold text, bullet/numbered lists, inline code, syntax-styled code blocks, and blockquotes with an ultra-lightweight, XSS-safe parser.
* **🛡️ Secure XSS Protection:** Pre-escapes all HTML special characters before parsing markdown to prevent cross-site scripting vulnerabilities.
* **📋 Raw Markdown Clipboard Copy:** The copy button copies the clean, original markdown text to your clipboard for instant pasting into Notion, Obsidian, GitHub, or notes.
* **⚙️ Options Toggle:** Easily toggle Markdown Viewer mode on or off in the options page.

### v1.5
* **🚀 Strictly Unidirectional Translation:** Removed "Smart Auto" fallback modes to prevent LLM distraction. KokTranslate now strictly translates into your explicitly chosen target language, solving issues with mixed-language text or strict language selections falling back to English.
* **⚙️ Default Language Update:** Default target language changed from Smart Auto to Korean.

### v1.4
* **🌐 Custom Target Language Support:** Choose your preferred translation language (Smart Auto, Korean, English, Japanese, Chinese, Spanish, French, German, Russian, Vietnamese, etc.) in settings.
* **🤖 Smart Fallback Prompt Architecture:** Intelligently switches to fallback languages (English or Korean) if the highlighted text already matches the destination language.
* **⚙️ Expanded Options & Reset Defaults:** Seamlessly configure target translation language and reset all settings with one click.

### v1.3
* **🛡️ Full Shadow DOM & Web Component Support:** Uses `e.composedPath()` and recursive Shadow Root traversal to precisely target, hover, and drag-translate elements inside Web Components (e.g., Lit, Angular, Polymer, modern Google web apps).
* **⚡ Capturing Mode Event Listeners:** Event listeners now use the capturing phase to bypass page-level `stopPropagation` interference during hover, click, drag, and ESC key exit.
* **🔒 Global Host Permissions (`host_permissions`):** Added `<all_urls>` host permissions to ensure reliable script execution and translation across all domains and subframes.
* **🔄 Selection Lifecycle Stabilization:** Safely cleans up previous selection state and guarantees seamless re-entry when clicking translation toggle buttons in the popup.

### v1.2
* **🛡️ Top Layer & Dialog Modal Support (Popover API):** Resolved an issue where translation tooltips were hidden behind HTML5 `<dialog>` modals and Top Layer elements by integrating modern Popover API (`popover="manual"`) and max `z-index` (`2147483647`).
* **✨ Overlay Stability:** Ensured marquee drag boxes and tooltips always render on top of modern web modals and dialog components.

### v1.1
* **🌐 Full i18n & Multilingual Support:** Comprehensive Korean and English UI support with automatic browser language detection and manual language switching.
* **⚙️ Custom Gemini Model IDs:** Enter custom Gemini model IDs directly in settings in addition to the default `gemini-3.5-flash-lite`.
* **🔄 Reset Defaults:** Restore model and language settings to defaults with a single click while safely retaining your API Key.
* **👁️ Integrated Eye Icon Toggle UI:** Clean integrated SVG eye icon in the API Key field to easily toggle password visibility.
* **📖 English User Guide & Documentation:** Added dedicated English user guide (`guide_en.html`) and restructured documentation.

### v1.0
* **🎉 Initial Release:** First release of KokTranslate point-and-click extension.
* **🎯 DOM Hover & Highlight Selection:** Purple dashed highlight box for elements under the cursor.
* **🖱️ Point & Click Translation:** Instant translation tooltip displayed directly at the cursor position.
* **📦 Marquee Drag Selection:** Click and drag a box across the screen to extract and translate multi-paragraph sections at once.
* **🤖 Smart Two-Way LLM Translation:** Automatically translates foreign languages into Korean and Korean into English.
* **📋 Seamless Tooltip UI:** On-page result display with one-click clipboard copying and `ESC` safe exit.

---

## 🛠️ Tech Stack

* HTML, CSS, JavaScript (Vanilla)
* Chrome Extension API (Manifest V3, i18n)
* Google Gemini API (`gemini-3.5-flash-lite`, etc.)