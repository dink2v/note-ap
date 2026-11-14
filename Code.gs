/**
 * NOTE AP
 * Content Planning & Management System
 * Backend source for Google Apps Script.
 *
 * Development source of truth: GitHub
 * Runtime target: Google Apps Script
 *
 * This file is intentionally Apps Script-compatible.
 * It can be copied/synced to Apps Script when the project is ready.
 * It does not create, rename, clear, or delete spreadsheet tabs.
 */

const NOTE_AP = Object.freeze({
  APP_NAME: "Note AP",
  SPREADSHEET_ID: "132FD2WyRTDOaZbOq_ABlyR1SWtesRh5i0XWkE_7p54w",
  TIMEZONE: "Asia/Jakarta",
  SHEETS: Object.freeze({
    DASHBOARD: "Dashboard",
    NOTIFIKASI: "Notifikasi",
    SETTING: "Setting",
    REFERENSI: "Referensi",
    TIM: "Tim",
    KONTEN: "Konten",
    AKTIVITAS: "Aktivitas"
  }),
  HEADERS: Object.freeze({
    KONTEN: [
      "ID", "Judul / Topik", "Platform", "Format Konten",
      "Durasi / Slide", "Pilar Konten", "Funnel", "Objective",
      "Status", "Tanggal Posting", "Waktu Posting", "Judul Keranjang",
      "Referensi Konten", "Hook / Opening", "Visual Hook",
      "Body / Naskah", "Visual Body", "CTA", "Visual CTA",
      "Caption", "Hashtag", "Notes", "Persetujuan (JSON)",
      "Komentar (JSON)", "Riwayat (JSON)", "Data Lengkap (JSON)",
      "Dibuat", "Diperbarui"
    ],
    AKTIVITAS: [
      "ID Aktivitas", "ID Konten", "Judul Konten",
      "Jenis Aktivitas", "Detail", "Waktu"
    ],
    NOTIFIKASI: [
      "ID", "Jenis", "Content ID", "Judul",
      "Pesan", "Tanggal Posting", "Dibuat Pada"
    ],
    TIM: [
      "ID Anggota", "Nama", "Email", "Peran",
      "Status", "Ditambahkan"
    ],
    SETTING: ["Kunci", "Nilai", "Keterangan"],
    REFERENSI: [
      "Platform", "Status", "Format",
      "Pilar", "Funnel", "Objective"
    ]
  })
});

// -----------------------------------------------------------------------------
// Spreadsheet access and diagnostics
// -----------------------------------------------------------------------------

function getSpreadsheet_() {
  return SpreadsheetApp.openById(NOTE_AP.SPREADSHEET_ID);
}

function getSheet_(key) {
  const name = NOTE_AP.SHEETS[key];
  if (!name) throw new Error("Kunci sheet tidak dikenal: " + key);

  const sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) {
    throw new Error(
      'Sheet "' + name + '" tidak ditemukan. Periksa nama tab spreadsheet.'
    );
  }
  return sheet;
}

/**
 * Read-only check. Does not create or modify any sheet.
 */
function testConnection() {
  const ss = getSpreadsheet_();
  const sheets = Object.keys(NOTE_AP.SHEETS).map(function(key) {
    const name = NOTE_AP.SHEETS[key];
    const sheet = ss.getSheetByName(name);
    return {
      key: key,
      name: name,
      exists: Boolean(sheet),
      rows: sheet ? sheet.getLastRow() : 0,
      columns: sheet ? sheet.getLastColumn() : 0
    };
  });

  const result = {
    success: sheets.every(function(item) { return item.exists; }),
    spreadsheetName: ss.getName(),
    spreadsheetId: ss.getId(),
    sheets: sheets
  };

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * Read-only header validation. Does not rewrite headers.
 */
function validateHeaders() {
  const results = [];

  Object.keys(NOTE_AP.HEADERS).forEach(function(key) {
    const sheet = getSheet_(key);
    const expected = NOTE_AP.HEADERS[key];
    const lastColumn = sheet.getLastColumn();
    const actual = lastColumn
      ? sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0]
      : [];

    results.push({
      sheet: NOTE_AP.SHEETS[key],
      valid: expected.every(function(header) {
        return actual.indexOf(header) !== -1;
      }),
      missing: expected.filter(function(header) {
        return actual.indexOf(header) === -1;
      })
    });
  });

  Logger.log(JSON.stringify(results, null, 2));
  return results;
}

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

function now_() {
  return new Date();
}

function id_(prefix) {
  return prefix + "-" +
    Utilities.getUuid().replace(/-/g, "").substring(0, 12).toUpperCase();
}

function text_(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function jsonParse_(value, fallback) {
  if (value === "" || value === null || value === undefined) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function jsonStringify_(value) {
  return JSON.stringify(value === undefined ? null : value);
}

function rowById_(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === String(id)) return i + 2;
  }
  return -1;
}

function dateValue_(value) {
  if (!value) return "";
  if (value instanceof Date) {
    return Utilities.formatDate(value, NOTE_AP.TIMEZONE, "yyyy-MM-dd");
  }
  return text_(value);
}

function timeValue_(value) {
  if (!value) return "";
  if (value instanceof Date) {
    return Utilities.formatDate(value, NOTE_AP.TIMEZONE, "HH:mm");
  }
  return text_(value);
}

// -----------------------------------------------------------------------------
// Content read operations
// -----------------------------------------------------------------------------

function getAllContents() {
  const sheet = getSheet_("KONTEN");
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const rows = sheet.getRange(
    2, 1, lastRow - 1, NOTE_AP.HEADERS.KONTEN.length
  ).getValues();

  return rows.map(function(row) {
    const full = jsonParse_(row[25], {});
    return Object.assign({}, full, {
      id: text_(row[0]),
      title: text_(row[1]),
      platform: text_(row[2]),
      format: text_(row[3]),
      duration: row[4],
      pillar: text_(row[5]),
      funnel: text_(row[6]),
      objective: text_(row[7]),
      status: text_(row[8]),
      postingDate: dateValue_(row[9]),
      postingTime: timeValue_(row[10]),
      basketTitle: text_(row[11]),
      reference: text_(row[12]),
      hook: text_(row[13]),
      visualHook: text_(row[14]),
      body: text_(row[15]),
      visualBody: text_(row[16]),
      cta: text_(row[17]),
      visualCTA: text_(row[18]),
      caption: text_(row[19]),
      hashtag: text_(row[20]),
      notes: text_(row[21]),
      approvals: jsonParse_(row[22], []),
      comments: jsonParse_(row[23], []),
      history: jsonParse_(row[24], []),
      createdAt: row[26],
      updatedAt: row[27]
    });
  });
}

function getContentById(id) {
  if (!id) throw new Error("ID konten wajib diisi.");
  const found = getAllContents().find(function(item) {
    return String(item.id) === String(id);
  });
  if (!found) throw new Error("Konten tidak ditemukan: " + id);
  return found;
}

// -----------------------------------------------------------------------------
// Activity log — append-only; existing activity rows are never rebuilt/cleared.
// -----------------------------------------------------------------------------

function logActivity_(contentId, title, type, detail) {
  getSheet_("AKTIVITAS").appendRow([
    id_("ACT"),
    contentId || "",
    title || "",
    type || "",
    detail || "",
    now_()
  ]);
}

function getActivities(limit) {
  const sheet = getSheet_("AKTIVITAS");
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const rows = sheet.getRange(
    2, 1, lastRow - 1, NOTE_AP.HEADERS.AKTIVITAS.length
  ).getValues();

  const items = rows.map(function(row) {
    return {
      id: row[0],
      contentId: row[1],
      title: row[2],
      type: row[3],
      detail: row[4],
      time: row[5]
    };
  }).reverse();

  return limit ? items.slice(0, Math.max(0, Number(limit))) : items;
}

// -----------------------------------------------------------------------------
// Content write operations — row-level writes, protected by script lock.
// -----------------------------------------------------------------------------

function contentRow_(item, previous) {
  const createdAt = previous ? previous.createdAt : now_();
  const updatedAt = now_();

  const fullData = Object.assign({}, item, {
    id: String(item.id),
    createdAt: createdAt,
    updatedAt: updatedAt
  });

  return [
    String(item.id),
    text_(item.title),
    text_(item.platform),
    text_(item.format),
    item.duration || "",
    text_(item.pillar),
    text_(item.funnel),
    text_(item.objective),
    text_(item.status),
    text_(item.postingDate),
    text_(item.postingTime),
    text_(item.basketTitle),
    text_(item.reference),
    text_(item.hook),
    text_(item.visualHook),
    text_(item.body),
    text_(item.visualBody),
    text_(item.cta),
    text_(item.visualCTA),
    text_(item.caption),
    text_(item.hashtag),
    text_(item.notes),
    jsonStringify_(item.approvals || []),
    jsonStringify_(item.comments || []),
    jsonStringify_(item.history || []),
    jsonStringify_(fullData),
    createdAt,
    updatedAt
  ];
}

function saveContentItem(item) {
  if (!item || typeof item !== "object") {
    throw new Error("Data konten tidak valid.");
  }
  if (!text_(item.title)) throw new Error("Judul konten wajib diisi.");

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const sheet = getSheet_("KONTEN");
    const isNew = !item.id;
    const id = isNew ? String(Date.now()) : String(item.id);
    const rowNumber = isNew ? -1 : rowById_(sheet, id);

    if (!isNew && rowNumber < 0) {
      throw new Error("Konten tidak ditemukan untuk diperbarui.");
    }

    const previous = isNew ? null : getContentById(id);

    if (
      previous &&
      item.expectedUpdatedAt &&
      previous.updatedAt &&
      String(item.expectedUpdatedAt) !== String(previous.updatedAt)
    ) {
      throw new Error("CONFLICT: Konten sudah berubah. Muat ulang sebelum menyimpan.");
    }

    const saved = Object.assign({}, previous || {}, item, {
      id: id,
      approvals: item.approvals !== undefined
        ? item.approvals : (previous ? previous.approvals : []),
      comments: item.comments !== undefined
        ? item.comments : (previous ? previous.comments : []),
      history: item.history !== undefined
        ? item.history : (previous ? previous.history : [])
    });

    const row = contentRow_(saved, previous);

    if (isNew) {
      sheet.appendRow(row);
    } else {
      sheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
    }

    logActivity_(
      id,
      saved.title,
      isNew ? "Konten Dibuat" : "Konten Diperbarui",
      isNew ? "Konten baru ditambahkan." : "Data konten diperbarui."
    );

    return {
      success: true,
      id: id,
      message: isNew ? "Konten berhasil dibuat." : "Konten berhasil diperbarui."
    };
  } finally {
    lock.releaseLock();
  }
}

function deleteContentItem(id, expectedUpdatedAt) {
  if (!id) throw new Error("ID konten wajib diisi.");

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const sheet = getSheet_("KONTEN");
    const rowNumber = rowById_(sheet, id);
    if (rowNumber < 0) throw new Error("Konten tidak ditemukan.");

    const content = getContentById(id);
    if (
      expectedUpdatedAt &&
      content.updatedAt &&
      String(expectedUpdatedAt) !== String(content.updatedAt)
    ) {
      throw new Error("CONFLICT: Konten sudah berubah. Muat ulang sebelum menghapus.");
    }

    sheet.deleteRow(rowNumber);
    logActivity_(id, content.title, "Konten Dihapus", "Konten dihapus dari database.");

    return { success: true, message: "Konten berhasil dihapus." };
  } finally {
    lock.releaseLock();
  }
}

// -----------------------------------------------------------------------------
// Reference, team, settings, notification read operations
// -----------------------------------------------------------------------------

function getReferences() {
  const sheet = getSheet_("REFERENSI");
  const lastRow = sheet.getLastRow();
  const result = {
    platforms: [], statuses: [], formats: [],
    pillars: [], funnels: [], objectives: []
  };
  if (lastRow < 2) return result;

  const rows = sheet.getRange(2, 1, lastRow - 1, 6).getDisplayValues();
  const keys = Object.keys(result);

  rows.forEach(function(row) {
    row.forEach(function(value, index) {
      const key = keys[index];
      if (value && result[key].indexOf(value) === -1) {
        result[key].push(value);
      }
    });
  });
  return result;
}

function getTeamMembers() {
  const sheet = getSheet_("TIM");
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, 6).getValues().map(function(row) {
    return {
      id: row[0], name: row[1], email: row[2],
      role: row[3], status: row[4], addedAt: row[5]
    };
  });
}

function getSettings() {
  const sheet = getSheet_("SETTING");
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return {};

  const result = {};
  sheet.getRange(2, 1, lastRow - 1, 3).getValues().forEach(function(row) {
    const key = text_(row[0]);
    if (key) result[key] = { value: row[1], description: row[2] };
  });
  return result;
}

function getNotifications(limit) {
  const sheet = getSheet_("NOTIFIKASI");
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const items = sheet.getRange(2, 1, lastRow - 1, 7).getValues()
    .map(function(row) {
      return {
        id: row[0], type: row[1], contentId: row[2],
        title: row[3], message: row[4],
        postingDate: row[5], createdAt: row[6]
      };
    }).reverse();

  return limit ? items.slice(0, Math.max(0, Number(limit))) : items;
}

function createNotification(type, contentId, title, message, postingDate) {
  const sheet = getSheet_("NOTIFIKASI");
  const notificationId = id_("NOTIF");

  sheet.appendRow([
    notificationId, type || "Informasi", contentId || "",
    title || "", message || "", postingDate || "", now_()
  ]);

  return { success: true, id: notificationId };
}

// -----------------------------------------------------------------------------
// Dashboard and initial application payload
// -----------------------------------------------------------------------------

function getDashboardData() {
  const contents = getAllContents();
  const statuses = {};
  const platforms = {};

  contents.forEach(function(item) {
    const status = item.status || "Belum Diatur";
    const platform = item.platform || "Belum Diatur";
    statuses[status] = (statuses[status] || 0) + 1;
    platforms[platform] = (platforms[platform] || 0) + 1;
  });

  const published = contents.filter(function(item) {
    return item.status === "Published";
  }).length;

  const upcoming = contents.filter(function(item) {
    return item.postingDate && item.status !== "Published";
  }).sort(function(a, b) {
    return (a.postingDate + " " + a.postingTime)
      .localeCompare(b.postingDate + " " + b.postingTime);
  }).slice(0, 5);

  return {
    summary: {
      total: contents.length,
      published: published,
      scheduled: contents.filter(function(item) {
        return item.status === "Ready to Publish";
      }).length,
      inProduction: contents.filter(function(item) {
        return ["Production", "Editing", "Review"].indexOf(item.status) >= 0;
      }).length,
      unpublished: contents.length - published
    },
    platforms: platforms,
    statuses: statuses,
    upcoming: upcoming,
    recentActivities: getActivities(10)
  };
}

function getInitialData() {
  return {
    appName: NOTE_AP.APP_NAME,
    contents: getAllContents(),
    dashboard: getDashboardData(),
    activities: getActivities(20),
    notifications: getNotifications(20),
    team: getTeamMembers(),
    references: getReferences(),
    settings: getSettings(),
    serverTime: now_()
  };
}

// -----------------------------------------------------------------------------
// Apps Script web app entry points — frontend files will be added later.
// -----------------------------------------------------------------------------

function doGet() {
  return HtmlService.createHtmlOutput(
    "<h1>Note AP</h1><p>Backend is connected. Frontend is under development.</p>"
  ).setTitle(NOTE_AP.APP_NAME)
   .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getAppInfo() {
  return {
    name: NOTE_AP.APP_NAME,
    version: "0.1.0",
    timezone: NOTE_AP.TIMEZONE,
    spreadsheetId: NOTE_AP.SPREADSHEET_ID,
    runtime: "Google Apps Script",
    database: "Google Sheets"
  };
}
