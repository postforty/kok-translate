# KokTranslate (콕! 번역기)

A Google Chrome Extension that translates any text on a webpage instantly with a simple **point-and-click** or **drag-and-select**, powered by Google Gemini AI.

[한국어 설명서 (Korean Documentation)](README.ko.md)

---

## 🌟 Key Features

* **Intuitive Element Selection (DOM Hover & Highlight)**: When translation mode is active, hovering over web elements highlights them with a clean purple dashed border.
* **Point & Click Translation**: Left-click any highlighted element to instantly translate its text and view results right next to your cursor.
* **Marquee Drag Selection**: Click and drag a box across the screen to extract and translate multi-paragraph sections or complex layouts at once.
* **Smart Two-Way LLM Translation**: Uses the Google Gemini API to provide natural, context-aware translations. (Translates foreign languages into Korean, and Korean into English automatically.)
* **Custom Gemini Model Support**: Specify custom Gemini model IDs in settings in addition to the default (`gemini-3.1-flash-lite`).
* **Seamless Tooltip UI**: View translation results without leaving the page, and copy them with one click. Press `ESC` anytime to exit translation mode.
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

1. Visit [Google AI Studio](https://aistudio.google.com/) to get a free API Key.
2. Click the KokTranslate extension icon in the toolbar.
3. Click the **Settings** button at the bottom of the popup.
4. Configure the following options and click **Save Settings**:
   - **Gemini API Key**: Paste your Gemini API Key (click the eye icon to toggle visibility).
   - **Gemini Model**: Enter custom model ID (default: `gemini-3.1-flash-lite`).
   - **UI Language**: Select preferred UI language (Auto / Korean / English).
   - **Reset Defaults**: Restore model and language settings to defaults while safely retaining your API key.

---

## 🖱️ How to Use

1. Click the KokTranslate extension icon on any webpage you wish to translate.
2. Click the **Start Point & Click Mode** button. (Hovering over elements will now show a purple highlight box.)
3. **Single Element Translation:** Hover over target text and left-click.
4. **Drag Selection Translation:** Hold down left-click and drag a box over multiple elements or long paragraphs.
5. A translation tooltip with a loading spinner will appear at the cursor position and display the translated text once ready.
6. Press `ESC` or click outside the tooltip to close it and resume browsing or selecting.

---

## 📂 Project Structure

* `manifest.json`: Extension metadata and permissions configuration (Manifest V3)
* `_locales/`: Chrome standard locale messages (`ko`, `en`)
* `i18n.js`: Runtime multilingual dictionary and DOM binding module
* `popup.html` / `popup.js`: Extension popup UI and action triggers
* `options.html` / `options.js`: Settings page (API Key, Model ID, UI language, and reset defaults)
* `guide.html` / `guide_en.html`: Korean and English user guides
* `content.js`: In-page DOM highlight, marquee drag box, and translation tooltip UI
* `background.js`: Background Service Worker handling Gemini API communication

---

## 📜 Changelog

### v1.1
* **🌐 Full i18n & Multilingual Support:** Comprehensive Korean and English UI support with automatic browser language detection and manual language switching.
* **⚙️ Custom Gemini Model IDs:** Enter custom Gemini model IDs directly in settings in addition to the default `gemini-3.1-flash-lite`.
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
* Google Gemini API (`gemini-3.1-flash-lite`, etc.)