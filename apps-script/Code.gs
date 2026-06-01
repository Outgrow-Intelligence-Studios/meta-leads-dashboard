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
 *
 * Sheet columns (row 1 = header):
 *   A: Timestamp | B: Name | C: Email | D: Phone | E: Source | F: Notes | G: Status
 */

const CONFIG = {
  SHEET_NAME: 'Leads',
  LOCK_TIMEOUT: 30000,
  HEADERS: ['Timestamp', 'Name', 'Email', 'Phone', 'Source', 'Notes', 'Status']
};

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);

  const existing = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
  
  // If sheet is empty or has fewer columns than expected, set headers
  const needsHeaders = !existing || existing.every(c => c === '' || c === null);
  if (needsHeaders || existing.length < CONFIG.HEADERS.length) {
    sheet.getRange(1, 1, 1, CONFIG.HEADERS.length).setValues([CONFIG.HEADERS]);
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
      name: r[1],
      email: r[2],
      phone: r[3],
      source: r[4],
      notes: r[5] || '',
      status: r[6] || 'New'
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
      const { name, email, phone, source } = payload;
      if (!name || !email) {
        return json_({ status: 'error', message: 'name and email required' });
      }
      sheet.appendRow([
        new Date(),
        name,
        email,
        phone || 'N/A',
        source || 'Landing Page',
        '',
        'New'
      ]);
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

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
