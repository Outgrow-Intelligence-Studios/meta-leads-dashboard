/**
 * Meta Leads — Google Sheets Backend (Web App)
 * Handles leads captured from the landing page and serves them to the dashboard.
 *
 * Deploy:
 *   1. Extensions → Apps Script → paste this file.
 *   2. Deploy → New Deployment → Web App
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   3. Copy the deployment URL and paste into the dashboard Settings.
 *   Current deployment (v7 — 3 Aug 2026): https://script.google.com/macros/s/AKfycbz-jP5TnOgJeuC8IdBZnuAuw_RMIZeIz3XSH00ebO9k_LwhL9e0fu1dTxMuH9AQQEjO/exec
 *
 * Sheet columns (row 1 = header):
 *   A: Timestamp | B: Name | C: Email | D: Phone | E: Source | F: Notes | G: Status
 *   H: utm_source | I: utm_medium | J: utm_campaign | K: utm_adgroup | L: utm_term
 *   M: utm_matchtype | N: utm_device | O: utm_network | P: utm_location
 *   Q: utm_interest_location | R: utm_creative | S: gclid
 */

const CONFIG = {
  SHEET_NAME: 'Leads',
  LOCK_TIMEOUT: 30000,
  HEADERS: [
    'Timestamp', 'Name', 'Email', 'Phone', 'Source', 'Notes', 'Status',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_adgroup', 'utm_term',
    'utm_matchtype', 'utm_device', 'utm_network', 'utm_location',
    'utm_interest_location', 'utm_creative', 'gclid'
  ],
  SUPABASE_URL: 'https://gyqneffgffrflqjbhbqu.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5cW5lZmZnZmZyZmxxamJoYnF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NTU3MTMsImV4cCI6MjA5MjUzMTcxM30.CY-KYiiWhGwH7Bmg5oiarERW86YzdKAWlIaGDXZ5SkY'
};

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);

  const lastCol = sheet.getLastColumn() || 1;
  const existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  // If sheet is empty, set all headers
  const needsHeaders = !existing || existing.every(c => c === '' || c === null);
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, CONFIG.HEADERS.length).setValues([CONFIG.HEADERS]);
    sheet.setFrozenRows(1);
    return sheet;
  }

  // Append any missing headers to the right of existing ones (non-destructive)
  const existingHeaders = existing.filter(h => h !== '' && h !== null);
  if (existingHeaders.length < CONFIG.HEADERS.length) {
    const missingHeaders = CONFIG.HEADERS.slice(existingHeaders.length);
    const startCol = existingHeaders.length + 1;
    sheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

/** GET — return all leads as JSON */
function doGet() {
  try {
    const sheet = getSheet_();
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return json_({ status: 'success', leads: [] });

    const range = sheet.getRange(2, 1, lastRow - 1, CONFIG.HEADERS.length);
    const values = range.getValues();
    const leads = values.map((r, i) => ({
      row: i + 2,
      timestamp: r[0] instanceof Date ? r[0].toISOString() : r[0],
      name:     r[1],
      email:    r[2],
      phone:    r[3],
      source:   r[4],
      notes:    r[5] || '',
      status:   r[6] || 'New',
      // UTM / ad attribution fields
      utm_source:            r[7]  || '',
      utm_medium:            r[8]  || '',
      utm_campaign:          r[9]  || '',
      utm_adgroup:           r[10] || '',
      utm_term:              r[11] || '',
      utm_matchtype:         r[12] || '',
      utm_device:            r[13] || '',
      utm_network:           r[14] || '',
      utm_location:          r[15] || '',
      utm_interest_location: r[16] || '',
      utm_creative:          r[17] || '',
      gclid:                 r[18] || ''
    }));
    return json_({ status: 'success', leads });
  } catch (err) {
    return json_({ status: 'error', message: err.message });
  }
}

/** POST — add, updateNote, updateStatus, or delete */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT);
    const sheet = getSheet_();
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action || 'add';

    if (action === 'add') {
      const {
        name, email, phone, source, notes,
        utm_source, utm_medium, utm_campaign, utm_adgroup,
        utm_term, utm_matchtype, utm_device, utm_network,
        utm_location, utm_interest_location, utm_creative, gclid
      } = payload;

      if (!name || !email) {
        return json_({ status: 'error', message: 'name and email required' });
      }

      sheet.appendRow([
        new Date(),           // A: Timestamp
        name,                 // B: Name
        email,                // C: Email
        phone  || 'N/A',      // D: Phone
        source || 'Landing Page', // E: Source
        notes  || '',         // F: Notes
        'New',                // G: Status
        // Ad attribution columns
        utm_source            || '',  // H
        utm_medium            || '',  // I
        utm_campaign          || '',  // J
        utm_adgroup           || '',  // K
        utm_term              || '',  // L
        utm_matchtype         || '',  // M
        utm_device            || '',  // N
        utm_network           || '',  // O
        utm_location          || '',  // P
        utm_interest_location || '',  // Q
        utm_creative          || '',  // R
        gclid                 || ''   // S
      ]);

      syncToSupabase_({
        name, email, phone, source, notes,
        utm_source, utm_medium, utm_campaign, utm_adgroup,
        utm_term, utm_matchtype, utm_device, utm_network,
        utm_location, utm_interest_location, utm_creative, gclid
      });

      return json_({ status: 'success', message: 'Lead captured.' });
    }

    if (action === 'updateNote') {
      const { row, note } = payload;
      if (!row) return json_({ status: 'error', message: 'row required' });
      sheet.getRange(row, 6).setValue(note || '');
      return json_({ status: 'success', message: 'Note updated.' });
    }

    if (action === 'updateStatus') {
      const { row, status } = payload;
      if (!row) return json_({ status: 'error', message: 'row required' });
      sheet.getRange(row, 7).setValue(status || 'New');
      return json_({ status: 'success', message: 'Status updated.' });
    }

    if (action === 'delete') {
      const { row } = payload;
      if (!row) return json_({ status: 'error', message: 'row required' });
      sheet.deleteRow(row);
      return json_({ status: 'success', message: 'Lead deleted.' });
    }

    return json_({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return json_({ status: 'error', message: 'Server error: ' + err.message });
  } finally {
    lock.releaseLock();
  }
}

/** Sync a new lead to Supabase (non-blocking — never throws) */
function syncToSupabase_(lead) {
  try {
    const payload = {
      name:   lead.name,
      email:  lead.email,
      phone:  lead.phone  || 'N/A',
      source: lead.source || 'Landing Page',
      notes:  lead.notes  || '',
      status: lead.status || 'New',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
      // Note: UTM fields are stored in the Google Sheet only.
      // To store them in Supabase, add corresponding columns to the leads table
      // and include them here.
    };
    const options = {
      method: 'post',
      headers: {
        'apikey':         CONFIG.SUPABASE_ANON_KEY,
        'Authorization':  'Bearer ' + CONFIG.SUPABASE_ANON_KEY,
        'Content-Type':   'application/json',
        'Prefer':         'return=minimal'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    UrlFetchApp.fetch(CONFIG.SUPABASE_URL + '/rest/v1/leads', options);
  } catch (e) {
    console.warn('Supabase sync failed (non-blocking): ' + e.message);
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
