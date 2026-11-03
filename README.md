# YouTube Ad Blocker

A small Chrome Manifest V3 extension that blocks selected ad requests, removes ad scheduling fields from YouTube player API responses, and hides common page-level ad placements.

## Load it in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked**.
4. Select this project folder.
5. Refresh any open YouTube tabs.

YouTube changes its player and ad delivery regularly, so no fixed set of local rules can guarantee that every ad is blocked. This build filters common player API ad fields and selected ad requests while preserving normal video format data. The extension does not send data anywhere.
