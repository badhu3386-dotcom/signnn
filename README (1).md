# Public assets

No model binary is committed in this repository. The demo loads the official MediaPipe Gesture Recognizer model from Google's hosted URL at runtime and loads the MediaPipe WebAssembly files from jsDelivr. An internet connection is required for the first model initialization.

For production/offline usage, download a compatible model under its applicable terms and update `src/services/gestureService.ts` to point to the locally hosted asset.
