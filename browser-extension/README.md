# Chakravyuh browser extension (Chrome / Edge)

Test **your own** chatbot's web page in Hindi, Kannada, Telugu and Tamil without leaving the browser:

1. Open your chatbot's page and click the Chakravyuh icon. It checks the site is a **verified target** in
   Chakravyuh — on any other site it does nothing.
2. Pick a goal, an attack, a language and a style → **Prepare attack**. Sarvam Translate writes it in that
   language, with a hidden random code.
3. Click into the site's chat box → **Insert into chat box** → press **send yourself**. The extension never sends
   anything to the bot on its own.
4. Select the bot's reply with the mouse → **Check selected reply**. Chakravyuh scores it with the same detectors
   as campaigns (planted secrets, the hidden code, Indian PII, prompt leaks, refusals, then the Sarvam judge) and
   saves it as a finding in a "Browser extension · manual tests" campaign, with a link to the full evidence.

## Install (developer mode)

1. Start Chakravyuh (`scripts\dev.ps1`).
2. Open `chrome://extensions` (or `edge://extensions`) → turn on **Developer mode** → **Load unpacked** → choose
   this `browser-extension` folder.
3. Pin the extension. Try it on the demo chat pages: http://127.0.0.1:8101/chat-ui (Sahayak Seva) or
   http://127.0.0.1:8100/chat-ui (BharatBank Assist).

Settings (⚙ in the popup): the Chakravyuh API (default `http://127.0.0.1:8010`) and app (default
`http://localhost:5173`). For an `https://` API the extension asks for permission to reach that one origin.

## Permissions and safety

- `activeTab` + `scripting`: only on the tab where you open the popup, only to insert text into the chat box and
  read your selection. `storage`: settings and the last prepared attack.
- Works only on sites that match a target whose ownership is verified in Chakravyuh — the same rule as campaigns.
- No API keys in the extension; it talks only to your Chakravyuh server.
