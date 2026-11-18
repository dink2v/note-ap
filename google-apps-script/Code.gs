/**
 * NOTE AP — Google Sheets + Google Calendar bridge
 *
 * Deploy this file as a Google Apps Script Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Before deployment, set Script Properties:
 *   NOTEAP_API_TOKEN       = a long random secret
 *   NOTEAP_SPREADSHEET_ID  = 132FD2WyRTDOaZbOq_ABlyR1SWtesRh5i0XWkE_7p54w
 *   NOTEAP_CALENDAR_ID     = primary (or the shared calendar ID)
 *
 * The frontend calls GET health via JSONP and POST sync via a hidden iframe.
 * Keep the token private; anyone who can inspect the browser that stores it
 * can use it. For a public-facing deployment, put an authenticated server
 * between GitHub Pages and this script.
 */

const NOTEAP = {
  CONTENTS_SHEET: 'NoteAP_Contents',
  LOG_SHEET: 'NoteAP_SyncLog',
  CONTENT_HEADERS: [
    'id', 'title', 'platform', 'format', 'pillar', 'status',
    'postingDate', 'postingTime', 'updatedAt', 'googleEventId',
    'deleted', 'lastSyncAt', 'dataJson'
  ],
  LOG_HEADERS: ['timestamp', 'action', 'contentId', 'result', 'details']
};

function doGet(e) {
  const params = (e && e.parameter) || {};
  const callback = String(params.callback || '');
  const action = String(params.action || 'health');
  let result;
  try {
    authorize_(params.token);
    if (action === 'health') {
      const cfg = config_();
      result = {
        ok: true,
        service: 'Note AP Calendar Bridge',
        spreadsheetConfigured: Boolean(cfg.spreadsheetId),
        calendarConfigured: Boolean(cfg.calendarId),
        spreadsheetName: SpreadsheetApp.openById(cfg.spreadsheetId).getName(),
        calendarName: getCalendar_(cfg.calendarId).getName(),
        serverTime: new Date().toISOString()
      };
    } else {
      throw new Error('Unsupported GET action.');
    }
  } catch (err) {
    result = { ok: false, error: err.message || String(err) };
  }
  const json = JSON.stringify(result).replace(/</g, '\\u003c');
  if (callback && /^[A-Za-z_$][\w.$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let result;
  try {
    const raw = e && e.parameter && e.parameter.payload;
    if (!raw) throw new Error('Payload tidak ditemukan.');
    const payload = JSON.parse(raw);
    authorize_(payload.token);
    if (payload.action !== 'sync') throw new Error('Aksi tidak dikenal.');
    result = sync_(payload.items || [], payload.deletedIds || []);
  } catch (err) {
    result = { ok: false, error: err.message || String(err) };
  }
  const encoded = JSON.stringify(result).replace(/</g, '\\u003c');
  const html = '<!doctype html><meta charset="utf-8"><script>' +
    'window.parent.postMessage({type:"NOTEAP_GCAL_RESULT",payload:' + encoded + '},"*");' +
    '</script><p>Note AP sync finished. You can close this frame.</p>';
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== NOTEAP.CONTENTS_SHEET || e.range.getRow() < 2) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const updatedCol = headers.indexOf('updatedAt') + 1;
  const syncCol = headers.indexOf('lastSyncAt') + 1;
  const dataCol = headers.indexOf('dataJson') + 1;
  const now = new Date().toISOString();
  const row = e.range.getRow();
  if (updatedCol > 0) sheet.getRange(row, updatedCol).setValue(now);
  if (syncCol > 0) sheet.getRange(row, syncCol).setValue(now);
  if (dataCol > 0) {
    const cell = sheet.getRange(row, dataCol);
    try {
      const data = JSON.parse(String(cell.getValue() || '{}'));
      data.updatedAt = now;
      cell.setValue(JSON.stringify(data));
    } catch (err) {}
  }
}

function config_() {
  const p = PropertiesService.getScriptProperties();
  const spreadsheetId = p.getProperty('NOTEAP_SPREADSHEET_ID');
  const calendarId = p.getProperty('NOTEAP_CALENDAR_ID') || 'primary';
  if (!spreadsheetId) throw new Error('Set NOTEAP_SPREADSHEET_ID di Script Properties.');
  if (!calendarId) throw new Error('Set NOTEAP_CALENDAR_ID di Script Properties.');
  return { spreadsheetId: spreadsheetId, calendarId: calendarId };
}


function getCalendar_(calendarId) {
  return String(calendarId).toLowerCase() === 'primary'
    ? CalendarApp.getDefaultCalendar()
    : CalendarApp.getCalendarById(calendarId);
}

function authorize_(provided) {
  const expected = PropertiesService.getScriptProperties().getProperty('NOTEAP_API_TOKEN');
  if (!expected) throw new Error('NOTEAP_API_TOKEN belum diatur di Script Properties.');
  if (!provided || String(provided) !== expected) throw new Error('Token integrasi tidak valid.');
}

function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  return sheet;
}

function readContentRows_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1).filter(row => row[0]).map(row => {
    const obj = {};
    headers.forEach((key, i) => obj[key] = row[i]);
    let full = {};
    try { full = obj.dataJson ? JSON.parse(String(obj.dataJson)) : {}; } catch (err) {}
    return normalizeContent_(Object.assign({}, full, obj));
  });
}

function normalizeContent_(item) {
  const full = Object.assign({}, item || {});
  full.id = String(full.id || '');
  full.title = String(full.title || '');
  full.platform = String(full.platform || 'Instagram');
  full.format = String(full.format || 'Feed');
  full.pillar = String(full.pillar || '');
  full.status = String(full.status || 'Planning');
  full.postingDate = dateString_(full.postingDate);
  full.postingTime = timeString_(full.postingTime);
  full.updatedAt = iso_(full.updatedAt);
  full.googleEventId = String(full.googleEventId || '');
  full.deleted = full.deleted === true || String(full.deleted).toLowerCase() === 'true';
  return full;
}

function dateString_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value).slice(0, 10);
}

function timeString_(value) {
  if (!value) return '09:00';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'HH:mm');
  }
  return String(value).slice(0, 5);
}

function iso_(value) {
  if (!value) return new Date(0).toISOString();
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

function sync_(incoming, deletedIds) {
  const cfg = config_();
  const ss = SpreadsheetApp.openById(cfg.spreadsheetId);
  const calendar = getCalendar_(cfg.calendarId);
  if (!calendar) throw new Error('Google Calendar tidak ditemukan atau tidak memiliki akses.');
  const sheet = ensureSheet_(ss, NOTEAP.CONTENTS_SHEET, NOTEAP.CONTENT_HEADERS);
  const logSheet = ensureSheet_(ss, NOTEAP.LOG_SHEET, NOTEAP.LOG_HEADERS);
  const sheetItems = readContentRows_(sheet);
  const byId = new Map(sheetItems.map(item => [item.id, item]));
  const incomingItems = incoming.map(normalizeContent_).filter(item => item.id);
  const now = new Date().toISOString();
  const counts = { created: 0, updated: 0, imported: 0, deleted: 0, calendarDeleted: 0, conflicts: 0 };
  const merged = new Map(byId);
  const removedIds = (deletedIds || []).map(String).filter(Boolean);
  removedIds.forEach(id => {
    const old = merged.get(id);
    if (old) merged.set(id, Object.assign({}, old, { deleted: true, updatedAt: now }));
  });

  incomingItems.forEach(local => {
    const stored = merged.get(local.id);
    if (!stored) {
      merged.set(local.id, local);
      return;
    }
    const localTime = new Date(local.updatedAt).getTime();
    const sheetTime = new Date(stored.updatedAt).getTime();
    if (localTime >= sheetTime) merged.set(local.id, local);
    else counts.conflicts++;
  });

  const lastYear = new Date();
  lastYear.setFullYear(lastYear.getFullYear() - 1);
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 2);
  const events = calendar.getEvents(lastYear, nextYear);
  const eventByNoteId = new Map();
  events.forEach(event => {
    const match = String(event.getDescription() || '').match(/\[NOTEAP_ID:([^\]]+)\]/);
    if (match) eventByNoteId.set(match[1], event);
  });

  // Import calendar-only events as Note AP records.
  events.forEach(event => {
    const match = String(event.getDescription() || '').match(/\[NOTEAP_ID:([^\]]+)\]/);
    if (match) return;
    const id = 'gcal-' + event.getId();
    if (merged.has(id)) return;
    const start = event.getStartTime();
    const imported = {
      id: id,
      title: event.getTitle(),
      platform: 'Instagram',
      format: 'Feed',
      pillar: '',
      status: 'Planning',
      postingDate: Utilities.formatDate(start, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      postingTime: Utilities.formatDate(start, Session.getScriptTimeZone(), 'HH:mm'),
      updatedAt: event.getLastUpdated().toISOString(),
      googleEventId: event.getId(),
      deleted: false
    };
    merged.set(id, imported);
    event.setDescription((event.getDescription() || '') + '\n[NOTEAP_ID:' + id + ']');
    eventByNoteId.set(id, event);
    counts.imported++;
  });

  const output = [];
  merged.forEach(item => {
    if (item.deleted) {
      const event = eventByNoteId.get(item.id) || (item.googleEventId ? calendar.getEventById(item.googleEventId) : null);
      if (event) event.deleteEvent();
      counts.deleted++;
      output.push(item);
      return;
    }
    let event = eventByNoteId.get(item.id);
    if (!event && item.googleEventId) {
      // A linked event was deleted directly in Google Calendar: keep the content,
      // but clear its publication schedule and mapping instead of recreating it.
      item.postingDate = '';
      item.postingTime = '';
      item.googleEventId = '';
      item.updatedAt = now;
      counts.calendarDeleted++;
      output.push(item);
      return;
    }
    const start = new Date(item.postingDate + 'T' + item.postingTime + ':00');
    if (!item.postingDate || isNaN(start.getTime())) {
      output.push(item);
      return;
    }
    if (!event) {
      const created = calendar.createEvent(item.title || 'Konten Note AP', start,
        new Date(start.getTime() + 60 * 60 * 1000), {
          description: '[NOTEAP_ID:' + item.id + ']\nDikelola melalui Note AP.'
        });
      item.googleEventId = created.getId();
      item.updatedAt = now;
      counts.created++;
    } else {
      const eventTime = event.getLastUpdated().getTime();
      const recordTime = new Date(item.updatedAt).getTime();
      if (eventTime > recordTime) {
        const eventStart = event.getStartTime();
        item.title = event.getTitle();
        item.postingDate = Utilities.formatDate(eventStart, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        item.postingTime = Utilities.formatDate(eventStart, Session.getScriptTimeZone(), 'HH:mm');
        item.updatedAt = event.getLastUpdated().toISOString();
        counts.conflicts++;
      } else {
        const currentStart = event.getStartTime().getTime();
        const desiredStart = start.getTime();
        if (event.getTitle() !== (item.title || 'Konten Note AP') || currentStart !== desiredStart) {
          event.setTitle(item.title || 'Konten Note AP');
          event.setTime(start, new Date(start.getTime() + 60 * 60 * 1000));
          event.setDescription('[NOTEAP_ID:' + item.id + ']\nDikelola melalui Note AP.');
          item.updatedAt = now;
          counts.updated++;
        }
        item.googleEventId = event.getId();
      }
    }
    output.push(item);
  });

  // Persist the authoritative merged records to Sheets.
  const rows = [NOTEAP.CONTENT_HEADERS];
  output.forEach(item => rows.push([
    item.id, item.title, item.platform, item.format, item.pillar, item.status,
    item.postingDate, item.postingTime, item.updatedAt, item.googleEventId,
    item.deleted, now, JSON.stringify(item)
  ]));
  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, NOTEAP.CONTENT_HEADERS.length).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, NOTEAP.CONTENT_HEADERS.length);
  logSheet.appendRow([now, 'sync', '', 'ok', JSON.stringify(counts)]);
  return { ok: true, counts: counts, items: output.filter(item => !item.deleted), deletedIds: removedIds, syncedAt: now };
}
