/**
 * Emerald Flashcards – save script
 * Lets the teacher area of the flashcard site save session decks and learner packs
 * into this Google Sheet. Paste this file into Extensions › Apps Script of the sheet,
 * then deploy it as a Web app (Execute as: Me, Who has access: Anyone).
 *
 * The site sends the trainer PIN with every request; it is checked here again,
 * and too many wrong PINs block saving for 10 minutes.
 */

var PIN_HASH = 2085847969;           // same trainer PIN as the Emerald-web trainer page
var CONTENTS = 'Contents';
var PACKS = 'Packs';
var DECK_HEADER = ['Front', 'Back', 'Example', 'Notes'];
var PACK_HEADER = ['Pack ID', 'Pack title', 'Learner', 'Message', 'Decks', 'Created', 'Updated'];

function h(s) { var x = 5381; for (var k = 0; k < s.length; k++) { x = ((x * 33) ^ s.charCodeAt(k)) >>> 0; } return x; }

function doGet() { return out({ ok: true, service: 'Emerald Flashcards save script' }); }

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var req = JSON.parse(e.postData.contents);
    var cache = CacheService.getScriptCache();
    var fails = Number(cache.get('fails') || 0);
    if (fails >= 8) return out({ ok: false, error: 'Too many wrong PINs. Wait 10 minutes and try again.' });
    if (h(String(req.pin || '')) !== PIN_HASH) {
      cache.put('fails', String(fails + 1), 600);
      return out({ ok: false, error: 'Wrong PIN.' });
    }
    lock.waitLock(20000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (req.action === 'ping') return out({ ok: true });
    if (req.action === 'saveDeck') return out(saveDeck(ss, req));
    if (req.action === 'savePack') return out(savePack(ss, req));
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

function savePack(ss, r) {
  var decks = (r.decks || []).map(s).filter(String);
  if (!decks.length) throw new Error('Choose at least one deck.');
  var sh = ss.getSheetByName(PACKS);
  if (!sh) {
    sh = ss.insertSheet(PACKS, ss.getSheets().length);
    sh.getRange(1, 1, 1, PACK_HEADER.length).setValues([PACK_HEADER]);
    styleHeader(sh, PACK_HEADER.length);
    sh.setColumnWidth(1, 110); sh.setColumnWidths(2, 4, 220);
  }
  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  var id = s(r.id), data = sh.getDataRange().getValues(), found = 0, created = now;
  if (id) for (var j = 1; j < data.length; j++) if (s(data[j][0]) === id) { found = j + 1; created = s(data[j][5]) || now; break; }
  if (!id) id = Utilities.getUuid().replace(/-/g, '').slice(0, 10);
  var row = [id, s(r.title) || 'Your vocabulary', s(r.learner), s(r.message), decks.join('\n'), created, now];
  var target = found ? sh.getRange(found, 1, 1, row.length) : sh.getRange(sh.getLastRow() + 1, 1, 1, row.length);
  target.setNumberFormat('@').setValues([row]).setWrap(true).setVerticalAlignment('top');
  return { ok: true, id: id };
}
