/**
 * TuttoXAndroid — Newsletter → Foglio Google
 * ------------------------------------------------
 * SETUP:
 * 1. Crea un nuovo Foglio Google (es. "Newsletter TuttoXAndroid")
 * 2. Foglio → Estensioni → Apps Script
 * 3. Incolla QUESTO file intero e salva
 * 4. Esegui una volta la funzione setupSheet() (autorizza i permessi)
 * 5. Distribuisci → Nuova distribuzione → tipo "App web"
 *    - Esegui come: Me
 *    - Chi può accedere: Chiunque
 * 6. Copia l'URL (.../exec) in services/newsletterService.ts → NEWSLETTER_WEBAPP_URL
 *
 * Colonne create: Timestamp | Email | Consenso | Fonte | URL pagina | User-Agent
 */

var SHEET_NAME = 'Iscrizioni';
var HEADERS = ['Timestamp', 'Email', 'Consenso GDPR', 'Fonte', 'URL pagina', 'User-Agent'];

function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  var range = sheet.getRange(1, 1, 1, HEADERS.length);
  range.setValues([HEADERS]);
  range.setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
}

function doPost(e) {
  try {
    var data = parseBody_(e);
    var email = String(data.email || '').trim().toLowerCase();
    var consent = data.consent === true || data.consent === 'true' || data.consent === '1';

    if (!email || email.indexOf('@') === -1) {
      return json_({ ok: false, error: 'invalid_email' });
    }
    if (!consent) {
      return json_({ ok: false, error: 'no_consent' });
    }

    var sheet = getOrCreateSheet_();
    // Evita duplicati esatti (stessa email già presente)
    var existing = sheet.getDataRange().getValues();
    for (var i = 1; i < existing.length; i++) {
      if (String(existing[i][1] || '').toLowerCase() === email) {
        // Aggiorna timestamp / consenso (re-iscrizione)
        sheet.getRange(i + 1, 1, 1, HEADERS.length).setValues([[
          new Date(),
          email,
          'Sì',
          String(data.source || ''),
          String(data.pageUrl || ''),
          String(data.userAgent || '')
        ]]);
        return json_({ ok: true, duplicate: true });
      }
    }

    sheet.appendRow([
      data.ts ? new Date(data.ts) : new Date(),
      email,
      'Sì',
      String(data.source || ''),
      String(data.pageUrl || ''),
      String(data.userAgent || '')
    ]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** Health-check: apri l'URL /exec nel browser → {"ok":true,"service":"newsletter"} */
function doGet() {
  return json_({ ok: true, service: 'newsletter' });
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return (e && e.parameter) || {};
  }
  var raw = e.postData.contents;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return (e && e.parameter) || {};
  }
}

function getOrCreateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    setupSheet();
    sheet = ss.getSheetByName(SHEET_NAME);
  }
  // Assicura header
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
