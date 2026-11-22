# Privacy

Pip's Valley has no accounts, analytics, advertising, microphone recording or live
AI-generation endpoint. The published site contains static files only.

Player names, selected faces, progress and settings live in this browser's
`localStorage`. Paintings live in this browser's IndexedDB. Different players have
separate paintings. Removing a player deletes that player's paintings and profile;
resetting progress also clears their paintings. Clearing browser site data removes
all of it. Private browsing and storage limits can prevent permanent saves.

The browser requests the site's scripts, artwork, films and recorded audio from the
site host. The host can receive ordinary connection information under its own
privacy policy. The app does not attach player names or artwork to these requests.

Missing recorded lines fall back to the device's speech engine. Some device voices
may use an operating-system or browser speech service; that behavior depends on
the selected voice and device. Turning Talking voice off disables app speech.
The app does not upload names for personalized narration.

Optional art and speech generation scripts are maintainer tools. They send public
authored prompts to the explicitly configured API when the maintainer runs them.
They are separate from the playable app. API keys stay in local environment
variables; local cache and preview folders are excluded from Git.
