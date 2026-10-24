# SignBridge AI

A GitHub-ready React + TypeScript starter for a sign-language accessibility hackathon prototype. It includes a browser webcam pipeline, MediaPipe generic gesture demo, editable transcript + speech synthesis, a video dictionary, and a labelled hand-landmark Dataset Lab.

> **Important:** The included MediaPipe Gesture Recognizer is a generic gesture model. It is **not** an ISL or ASL translator. The app keeps this distinction explicit. Real ISL/ASL recognition needs language-specific labelled data, a trained classifier, and evaluation with signers. Text-to-sign plays clips you add to the dictionary; it does not generate fluent sign-language grammar.

## Features

- React, TypeScript and Vite.
- Responsive dark dashboard with ISL/ASL selector.
- Start/stop laptop webcam with permission and model-loading states.
- MediaPipe hand landmarks and generic gesture output.
- Add, edit-by-removal, clear and speak transcript words.
- Text-to-sign word sequence and HTML video player.
- Add sign clips using a hosted video URL or a local video file.
- Dataset Lab to capture numerical landmarks, label samples, inspect counts, delete samples, and export JSON/CSV.
- Local browser storage for transcript and URL-based dictionary entries.
- No backend or paid API required for this initial demo.

## Requirements

- Node.js 20 or newer recommended.
- npm.
- A modern browser with webcam support.
- Internet access for the MediaPipe WASM runtime and default gesture model (unless you configure local assets).

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. Click **Start camera** and allow browser camera access.

To run a production build:

```bash
npm run build
npm run preview
```

## Upload to GitHub

1. Download and extract this ZIP on your computer.
2. Create an empty repository on GitHub.
3. Upload the **contents of the extracted folder**, not the ZIP itself. Make sure `package.json`, `index.html`, `src/`, and `vite.config.ts` are in the repository root.
4. Commit the files.

Or use Git from a terminal in the extracted folder:

```bash
git init
git add .
git commit -m "Initial SignBridge AI prototype"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

## Deploy to Vercel

1. Import the GitHub repository into Vercel.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Deploy. Use HTTPS in production because browsers require a secure context for camera access.

## How the webcam recognizer works

`src/services/gestureService.ts` configures MediaPipe Tasks Vision. The WASM runtime is served by jsDelivr, and the default model is fetched from Google's public MediaPipe model hosting. These are remote dependencies, so the first load needs internet access.

Current generic categories include gestures such as `Open Palm`, `Closed Fist`, `Thumb Up`, `Thumb Down`, `Victory`, `Pointing Up`, and `ILoveYou`. These output labels must not be represented as ISL/ASL word predictions.

## Dataset Lab format

The JSON export uses the top-level format identifier `signbridge-landmarks-v1`. Each sample contains:

- `language`: `ISL` or `ASL`;
- `label`: the sign label supplied by the collector;
- `capturedAt`: ISO timestamp;
- `hands`: one flattened list per detected hand, with `[x, y, z]` repeated for 21 landmarks.

CSV gives one row per captured sample. It represents a **single frame**. Dynamic signs need ordered frame sequences grouped by recording/session and label. The in-browser Dataset Lab does not train a classifier.

For meaningful training/evaluation, collect varied consenting signers and backgrounds, use verified sign labels, split training and test data by signer, and report held-out performance honestly. Consider upper-body pose and facial expression for signs that depend on them.

## Text-to-sign dictionary

The initial dictionary is intentionally empty to avoid presenting incorrect or unlicensed clips as real signs. Select **Sign Dictionary → Add sign**, choose the active language, enter a label, and provide either:

- a direct hosted video URL ending in a browser-compatible video resource, or
- a local video upload.

URL-based entries are saved in localStorage on that browser. Local uploads use temporary browser Blob URLs and work for the current session only; they do not persist after reload. For a persistent library, host permitted clips on a stable URL or implement IndexedDB/storage in a future version. Only use clips you have permission to use and verify them with competent ISL/ASL users. A word-by-word clip sequence is not necessarily grammatically valid signing.

## Privacy

- The webcam starts only after a user action.
- MediaPipe processes webcam frames locally in the browser; this app does not send or save raw webcam video.
- The Dataset Lab saves numerical landmark samples only when the user clicks capture, and keeps them in memory until exported or the page is left.
- Transcript and URL dictionary entries may be saved in localStorage on the current device/browser.
- Browser speech recognition may use a browser-vendor service depending on the browser; the UI displays this limitation before use.
- MediaPipe library metrics and external resource requests may follow their providers' policies. Review provider documentation if deploying publicly.

## Project structure

```text
src/
  components/       Sidebar and top navigation
  data/             Empty-by-default sign dictionary
  hooks/            Webcam and gesture-recognition lifecycle
  pages/            Translator, Text-to-Sign, Dictionary, Dataset Lab, About
  services/         MediaPipe, speech, storage and exports
  types/            Shared TypeScript types
  App.tsx
  index.css
  main.tsx
```

## Next steps for a true ISL/ASL translator

1. Decide and document a limited vocabulary per language.
2. Collect properly consented, labelled samples, including motion sequences for dynamic signs.
3. Train separate ISL and ASL classifiers and evaluate on signers not seen during training.
4. Implement a `custom classifier` adapter in `recognitionService.ts` and expose supported vocabulary and model status in the UI.
5. Validate predictions and interface design with Deaf and hard-of-hearing signers.

This is a prototype, not a certified accessibility service. The sign-language community should be involved in validating the vocabulary, outputs and grammar.
