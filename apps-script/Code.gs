/**
 * Emerald Flashcards – save script
 * Lets the teacher area of the flashcard site save session decks and learner packs
 * into the flashcards Google Sheet (SHEET_ID below). It works from any Apps Script project.
 * After pasting: choose "setup" next to Run and click Run once to authorise,
 * then deploy as a Web app (Execute as: Me, Who has access: Anyone).
 *
 * The site sends the trainer PIN with every request; it is checked here again,
 * and 8 wrong PINs block saving for 4 hours.
 */

// The flashcards sheet: "Emerald Flashcards – Contents"
var SHEET_ID = '1KTx7_WW-YiZON8G3uuHCsYfM1cpfjtoRaV1mL3LaNa4';
// Private file for learner packs (learner names, messages). Never share it: the site reads it only through this script.
var PRIVATE_ID = '1Foifj3QThsBsIgTtGIuacbgeT9QvjbtCkvkYR4DwooM';
var LEARNER_PACKS = 'Learner packs';
var PIN_HASH = 2085847969;           // same trainer PIN as the Emerald-web trainer page
var CONTENTS = 'Contents';
var PACKS = 'Packs';
var DECK_HEADER = ['Front', 'Back', 'Example', 'Notes'];
// Public packs (shown on the site's main page): no learner information.
var PUBLIC_HEADER = ['Pack ID', 'Pack title', 'Category', 'Description', 'Decks', 'Updated'];
// Learner packs (private file only).
var PRIVATE_HEADER = ['Pack ID', 'Pack title', 'Learner', 'Message', 'Category', 'Decks', 'Created', 'Updated'];

function h(s) { var x = 5381; for (var k = 0; k < s.length; k++) { x = ((x * 33) ^ s.charCodeAt(k)) >>> 0; } return x; }

function book() { return SpreadsheetApp.openById(SHEET_ID); }
function privateBook() { return SpreadsheetApp.openById(PRIVATE_ID); }

/** Run this once from the editor: it asks for permission and checks the sheet is reachable. */
function setup() {
  var ss = book();
  Logger.log('Connected to "' + ss.getName() + '". Contents tab found: ' + !!ss.getSheetByName(CONTENTS));
  Logger.log('Private learner packs: "' + privateBook().getName() + '".');
}

/** GET ?pack=<id>: a learner pack's title, message and decks, without the learner's name. */
function doGet(e) {
  var id = s(e && e.parameter && e.parameter.pack);
  if (!id) return out({ ok: true, service: 'Emerald Flashcards save script' });
  var sh = privateBook().getSheetByName(LEARNER_PACKS);
  var data = sh ? sh.getDataRange().getValues() : [];
  for (var j = 1; j < data.length; j++) {
    if (s(data[j][0]) === id) {
      return out({ ok: true, pack: { id: id, title: s(data[j][1]), message: s(data[j][3]), category: s(data[j][4]),
        decks: s(data[j][5]).split('\n').map(s).filter(String) } });
    }
  }
  return out({ ok: false, error: 'not found' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var req = JSON.parse(e.postData.contents);
    var cache = CacheService.getScriptCache();
    var fails = Number(cache.get('fails') || 0);
    if (fails >= 8) return out({ ok: false, error: 'Too many wrong PINs. Saving is blocked for 4 hours.' });
    if (h(String(req.pin || '')) !== PIN_HASH) {
      cache.put('fails', String(fails + 1), 14400); // 4 hours (CacheService maximum is 6 hours)
      return out({ ok: false, error: 'Wrong PIN.' });
    }
    lock.waitLock(20000);
    var ss = book();
    if (req.action === 'ping') return out({ ok: true });
    if (req.action === 'saveDeck') return out(saveDeck(ss, req));
    if (req.action === 'savePack') return out(savePack(ss, req));
    if (req.action === 'listPacks') return out(listPacks(ss));
    return out({ ok: false, error: 'Unknown action.' });
  } catch (err) {
    return out({ ok: false, error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function s(v) { return v == null ? '' : String(v).trim(); }
function tabName(t) { return s(t).replace(/[\[\]\*\?\/\\:'|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90) || 'Session deck'; }

function styleHeader(sh, n) {
  sh.getRange(1, 1, 1, n).setFontWeight('bold').setFontColor('#ffffff').setBackground('#49B190');
  sh.setFrozenRows(1);
}

function saveDeck(ss, r) {
  var cards = (r.cards || []).filter(function (c) { return s(c.front) || s(c.back); });
  if (!cards.length) throw new Error('The deck has no words.');
  var title = s(r.title) || 'Session deck';
  var name, sh;
  if (r.tab) {
    name = s(r.tab);
    if (name === CONTENTS || name === PACKS) throw new Error('This tab cannot be overwritten.');
    sh = ss.getSheetByName(name) || ss.insertSheet(name, ss.getSheets().length);
  } else {
    var base = tabName(title); name = base;
    for (var i = 2; ss.getSheetByName(name); i++) name = base + ' (' + i + ')';
    sh = ss.insertSheet(name, ss.getSheets().length);
  }
  sh.clear();
  var rows = [DECK_HEADER].concat(cards.map(function (c) { return [s(c.front), s(c.back), s(c.example), s(c.notes)]; }));
  var rng = sh.getRange(1, 1, rows.length, 4);
  rng.setNumberFormat('@').setValues(rows).setWrap(true).setVerticalAlignment('top');
  styleHeader(sh, 4);
  sh.setColumnWidths(1, 4, 260);

  var c = ss.getSheetByName(CONTENTS);
  if (!c) throw new Error('The sheet has no Contents tab.');
  var row = [title, name, s(r.desc), s(r.level), s(r.category), r.show ? 'Yes' : 'No'];
  var data = c.getDataRange().getValues(), found = 0;
  for (var j = 1; j < data.length; j++) if (s(data[j][1]) === name) { found = j + 1; break; }
  var target = found ? c.getRange(found, 1, 1, 6) : c.getRange(c.getLastRow() + 1, 1, 1, 6);
  target.setNumberFormat('@').setValues([row]);
  return { ok: true, tab: name };
}

function packSheet(ss, name, header) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name, ss.getSheets().length);
  if (s(sh.getRange(1, 1).getValue()) !== 'Pack ID' || sh.getLastColumn() < header.length) {
    sh.getRange(1, 1, 1, header.length).setValues([header]);
    styleHeader(sh, header.length);
  }
  return sh;
}
function findRow(sh, id) {
  var data = sh.getDataRange().getValues();
  for (var j = 1; j < data.length; j++) if (s(data[j][0]) === id) return { row: j + 1, values: data[j] };
  return null;
}
function writeRow(sh, found, row) {
  var target = found ? sh.getRange(found.row, 1, 1, row.length) : sh.getRange(sh.getLastRow() + 1, 1, 1, row.length);
  target.setNumberFormat('@').setValues([row]).setWrap(true).setVerticalAlignment('top');
}

/** Public packs go to the public sheet (no learner info); learner packs go to the private file. */
function savePack(ss, r) {
  var decks = (r.decks || []).map(s).filter(String);
  if (!decks.length) throw new Error('Choose at least one deck.');
  var title = s(r.title);
  if (!title) throw new Error('Give the pack a title.');
  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  var id = s(r.id) || Utilities.getUuid().replace(/-/g, '').slice(0, 10);
  var pub = packSheet(ss, PACKS, PUBLIC_HEADER);
  var priv = packSheet(privateBook(), LEARNER_PACKS, PRIVATE_HEADER);
  var inPub = findRow(pub, id), inPriv = findRow(priv, id);
  if (r.public) {
    if (inPriv) priv.deleteRow(inPriv.row);
    writeRow(pub, inPub, [id, title, s(r.category), s(r.message), decks.join('\n'), now]);
  } else {
    if (inPub) pub.deleteRow(inPub.row);
    var created = inPriv ? s(inPriv.values[6]) || now : now;
    writeRow(priv, inPriv, [id, title, s(r.learner), s(r.message), s(r.category), decks.join('\n'), created, now]);
  }
  return { ok: true, id: id };
}

/** Teacher list (PIN-checked): both kinds of packs. */
function listPacks(ss) {
  var list = [];
  function rows(sh) { return sh ? sh.getDataRange().getValues().slice(1) : []; }
  rows(ss.getSheetByName(PACKS)).forEach(function (v) {
    if (s(v[0])) list.push({ id: s(v[0]), title: s(v[1]), category: s(v[2]), message: s(v[3]), decks: s(v[4]).split('\n').map(s).filter(String), updated: s(v[5]), public: true, learner: '' });
  });
  rows(privateBook().getSheetByName(LEARNER_PACKS)).forEach(function (v) {
    if (s(v[0])) list.push({ id: s(v[0]), title: s(v[1]), learner: s(v[2]), message: s(v[3]), category: s(v[4]), decks: s(v[5]).split('\n').map(s).filter(String), updated: s(v[7]) || s(v[6]), public: false });
  });
  return { ok: true, packs: list };
}
