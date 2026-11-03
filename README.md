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

## Printing

"Print" makes A4 pages with 8 cards: a page of fronts followed by a page of backs. Print double-sided (flip on long edge) and cut along the dashed lines. In the print dialog choose "Save as PDF" to get a PDF.

## Publishing

`.github/workflows/pages.yml` deploys the site on every push to `main`. In Settings → Pages, Source must be "GitHub Actions".
