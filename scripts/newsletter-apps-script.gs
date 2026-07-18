/**
 * TuttoXAndroid — Newsletter
 * Form sito → Apps Script → (1) Foglio Google + (2) Brevo (opzionale)
 * ================================================================
 *
 * PERCHÉ APPS SCRIPT?
 * La API key di Brevo NON deve stare nel codice del sito (sarebbe pubblica).
 * Il browser chiama solo questo script; lo script chiama Brevo in privato.
 *
 * ── SETUP FOGLIO (sempre) ──────────────────────────────────────
 * 1. Crea Foglio Google "Newsletter TuttoXAndroid"
 * 2. Estensioni → Apps Script → incolla QUESTO file → Salva
 * 3. Esegui setupSheet() una volta (autorizza)
 *
 * ── SETUP BREVO (consigliato) ──────────────────────────────────
 * A. Account free: https://www.brevo.com  (registrati, conferma email)
 * B. Contatti → Liste → Crea lista es. "TuttoXAndroid Newsletter"
 *    → apri la lista e copia l'ID numerico (URL o dettagli lista)
 * C. Impostazioni account (icona profilo) → SMTP & API → API Keys
 *    → Genera nuova chiave → copiala (inizia spesso con xkeysib-)
 * D. In Apps Script: icona ingranaggio ⚙️ Progetto → Proprietà script
 *    Aggiungi:
 *      BREVO_API_KEY  =  (la tua chiave)
 *      BREVO_LIST_ID  =  (es. 3)   ← solo il numero
 * E. (Opzionale) Esegui testBrevo() per verificare la chiave
 * F. Distribuisci → Nuova distribuzione → App web
 *    - Esegui come: Me
 *    - Chi può accedere: Chiunque
 * G. Copia URL .../exec in services/newsletterService.ts
 *    → NEWSLETTER_WEBAPP_URL = 'https://script.google.com/macros/s/.../exec'
 * H. Commit/push/deploy del sito
 *
 * ── GDPR BREVO ─────────────────────────────────────────────────
 * - In Brevo: impostazioni → GDPR / consenso se disponibili
 * - Il form del sito ha già checkbox + informativa /privacy
 * - In ogni email: link unsubscribe automatico di Brevo (obbligatorio)
 * - Aggiungi Brevo come fornitore in Privacy Policy (già previsto)
 *
 * Colonne foglio: Timestamp | Email | Consenso | Fonte | URL | UA | Brevo
 */

var SHEET_NAME = 'Iscrizioni';
var HEADERS = [
  'Timestamp',
  'Email',
  'Consenso GDPR',
  'Fonte',
  'URL pagina',
  'User-Agent',
  'Brevo',
];

function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  var range = sheet.getRange(1, 1, 1, HEADERS.length);
  range.setValues([HEADERS]);
  range.setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
  Logger.log('Foglio Iscrizioni pronto.');
}

/** Verifica API key + lista (esegui a mano da Apps Script). */
function testBrevo() {
  var key = getProp_('BREVO_API_KEY');
  var listId = getProp_('BREVO_LIST_ID');
  if (!key || !listId) {
    throw new Error('Imposta BREVO_API_KEY e BREVO_LIST_ID nelle Proprietà script.');
  }
  var res = UrlFetchApp.fetch('https://api.brevo.com/v3/contacts/lists/' + listId, {
    method: 'get',
    headers: { 'api-key': key, accept: 'application/json' },
    muteHttpExceptions: true,
  });
  Logger.log('Status: ' + res.getResponseCode());
  Logger.log(res.getContentText());
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

    var source = String(data.source || '');
    var pageUrl = String(data.pageUrl || '');
    var ua = String(data.userAgent || '');
    var ts = data.ts ? new Date(data.ts) : new Date();

    // 1) Brevo (se configurato)
    var brevoStatus = 'skip';
    var brevoConfigured = !!(getProp_('BREVO_API_KEY') && getProp_('BREVO_LIST_ID'));
    if (brevoConfigured) {
      var brevo = addToBrevo_(email, source, pageUrl);
      if (!brevo.ok) {
        // Non salviamo a vuoto se Brevo è il canale principale e fallisce
        logSheet_(ts, email, source, pageUrl, ua, 'ERR: ' + brevo.error);
        return json_({ ok: false, error: 'brevo', detail: brevo.error });
      }
      brevoStatus = brevo.duplicate ? 'ok-update' : 'ok';
    }

    // 2) Foglio (backup / audit consenso)
    logSheet_(ts, email, source, pageUrl, ua, brevoStatus);

    return json_({ ok: true, brevo: brevoConfigured, status: brevoStatus });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  var brevo = !!(getProp_('BREVO_API_KEY') && getProp_('BREVO_LIST_ID'));
  return json_({ ok: true, service: 'newsletter', brevo: brevo });
}

/** Aggiunge/aggiorna contatto in Brevo e lo mette nella lista. */
function addToBrevo_(email, source, pageUrl) {
  var key = getProp_('BREVO_API_KEY');
  var listId = parseInt(getProp_('BREVO_LIST_ID'), 10);
  if (!key || !listId) return { ok: false, error: 'missing_config' };

  var payload = {
    email: email,
    listIds: [listId],
    updateEnabled: true,
    attributes: {
      SOURCE: String(source || '').slice(0, 80),
      OPT_IN: 'yes',
      SIGNUP_URL: String(pageUrl || '').slice(0, 200),
    },
  };

  var res = UrlFetchApp.fetch('https://api.brevo.com/v3/contacts', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'api-key': key, accept: 'application/json' },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  var code = res.getResponseCode();
  var body = res.getContentText() || '';

  // 201 created, 204 updated, 400 duplicate gestito da updateEnabled
  if (code === 201) return { ok: true, duplicate: false };
  if (code === 204) return { ok: true, duplicate: true };
  if (code === 400 && /already|duplicate|exist/i.test(body)) {
    // fallback: aggiungi solo alla lista
    return addToListOnly_(email, listId, key);
  }

  return { ok: false, error: 'HTTP ' + code + ' ' + body.slice(0, 200) };
}

function addToListOnly_(email, listId, key) {
  var res = UrlFetchApp.fetch(
    'https://api.brevo.com/v3/contacts/lists/' + listId + '/contacts/add',
    {
      method: 'post',
      contentType: 'application/json',
      headers: { 'api-key': key, accept: 'application/json' },
      payload: JSON.stringify({ emails: [email] }),
      muteHttpExceptions: true,
    }
  );
  var code = res.getResponseCode();
  if (code >= 200 && code < 300) return { ok: true, duplicate: true };
  return { ok: false, error: 'list ' + code + ' ' + (res.getContentText() || '').slice(0, 150) };
}

function logSheet_(ts, email, source, pageUrl, ua, brevoStatus) {
  var sheet = getOrCreateSheet_();
  var existing = sheet.getDataRange().getValues();
  for (var i = 1; i < existing.length; i++) {
    if (String(existing[i][1] || '').toLowerCase() === email) {
      sheet.getRange(i + 1, 1, 1, HEADERS.length).setValues([[
        ts, email, 'Sì', source, pageUrl, ua, brevoStatus,
      ]]);
      return;
    }
  }
  sheet.appendRow([ts, email, 'Sì', source, pageUrl, ua, brevoStatus]);
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return (e && e.parameter) || {};
  }
  try {
    return JSON.parse(e.postData.contents);
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
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  // Migrazione header se manca colonna Brevo
  if (sheet.getLastColumn() < HEADERS.length) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  return sheet;
}

function getProp_(name) {
  return PropertiesService.getScriptProperties().getProperty(name) || '';
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
