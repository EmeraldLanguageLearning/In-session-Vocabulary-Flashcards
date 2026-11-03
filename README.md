# In-session Vocabulary Flashcards

English flashcards for Emerald Language Learning. Learners can study a deck online, print it as cut-out cards (PDF) or download it for Anki, Quizlet or a spreadsheet.

**Live site:** https://emeraldlanguagelearning.github.io/In-session-Vocabulary-Flashcards/

## Where the cards come from

All content lives in one Google Sheet: [Emerald Flashcards – Contents](https://docs.google.com/spreadsheets/d/1KTx7_WW-YiZON8G3uuHCsYfM1cpfjtoRaV1mL3LaNa4/edit).
The site reads it every time it opens, so editing the sheet is enough: no change to this repo is needed.

- **Contents** tab = table of contents. One row per deck: `Deck title`, `Tab name`, `Description`, `Level`, `Category`, `Show` (Yes/No).
- **One tab per deck**, named exactly as in `Tab name`, with the columns `Front`, `Back`, `Example`, `Notes` (and optionally `Image`, a public image link).
- The sheet must stay shared as **Anyone with the link can view**.

## Useful links

- Open a deck directly: `…/In-session-Vocabulary-Flashcards/#deck=Aircraft%20Parts`
- Try another sheet without editing the code: `…/In-session-Vocabulary-Flashcards/?sheet=<sheet id>`

To switch permanently to another sheet, change `SHEET_ID` near the top of `index.html`.

## Sharing a PDF with a learner

On a deck, choose **Download ▾ › Share PDF link** (or **Share PDF link** under the deck). Pick a word list or cut-out flashcards, then copy, email or share the link.

- Link format: `…/In-session-Vocabulary-Flashcards/?pdf=<Tab name>` (add `&layout=cards` for cut-out cards).
- When the learner opens it, the page builds the PDF from the sheet in their browser and downloads it (on iPad/iPhone they tap "Download the PDF").
- Works for decks set to `Show: No`, so you can keep per-group session vocabulary off the home page and still send it.
- The PDF library (jsPDF 2.5.1) loads from a public CDN (cdnjs, with jsDelivr and unpkg as fallbacks); the fonts in `fonts/` are a subset of DejaVu Sans so phonetic symbols print correctly.

## Teacher area (PIN)

**Teachers** in the menu opens a PIN pad (same trainer PIN as the Emerald-web trainer page). Inside:

- **Session deck:** type words, or paste a list (`word - meaning | example`, or columns copied from Excel/Sheets), or start from an existing deck. Save creates a new tab in the sheet and a row in Contents (hidden from the home page unless ticked), then opens the share panel.
- **Learner pack:** a learner's name, an optional message and a choice of decks. Saved in the `Packs` tab. The learner gets `…/?pack=<id>`: their decks to study online or download as PDFs (one deck, or everything in one PDF). Editing a pack keeps the same link.
- **Saved packs:** list of packs with Share and Edit.

The PIN on the page only keeps learners out of the menu. The save script checks the PIN again and blocks saving for 4 hours after 8 wrong PINs.

### One-time setup of the save script

1. Open the Google Sheet › **Extensions › Apps Script**.
2. Delete the sample code, paste the contents of [`apps-script/Code.gs`](apps-script/Code.gs), click **Save**.
   Then choose **setup** in the function menu next to **Run**, click **Run** and allow access. The log should say `Contents tab found: true`. (The script opens the flashcards sheet by its ID, set in `SHEET_ID`.)
3. **Deploy › New deployment** › type **Web app**. *Execute as:* **Me**. *Who has access:* **Anyone**. Click **Deploy**, then **Authorize access** and allow it (Google shows an "unverified app" warning for your own scripts: **Advanced › Go to … (unsafe)**).
4. Copy the **Web app URL** (ends in `/exec`).
5. On the site: **Teachers › Setup**, paste the URL, **Save and test**. To connect every device at once, put the URL in `SCRIPT_URL` near the top of `index.html`.

If you change `Code.gs` later: **Deploy › Manage deployments › Edit › Version: New version** (the URL stays the same).

## Printing

"Print" makes A4 pages with 8 cards: a page of fronts followed by a page of backs. Print double-sided (flip on long edge) and cut along the dashed lines. In the print dialog choose "Save as PDF" to get a PDF.

## Publishing

`.github/workflows/pages.yml` deploys the site on every push to `main`. In Settings → Pages, Source must be "GitHub Actions".

## Inside the Emerald Tools Android app

The Emerald Tools app (repository Emerald-tools) opens this site inside the app. When `window.EmeraldAndroid` exists, the page hands file downloads (PDF, CSV, Anki, Quizlet) to Android's "save as" screen, prints through Android printing, shares links through Android's share sheet, and shows a "← Tools" link back to the other tools. In a normal browser nothing changes.
