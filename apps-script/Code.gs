/**
 * NOTE AP · APOTEK PRAPATAN
 * Database Google Sheets untuk workspace Note AP.
 * Pasang sebagai script TERIKAT (bound) melalui Extensions > Apps Script
 * dari spreadsheet database yang akan digunakan.
 */
const SHEETS = {
  dashboard: "DASHBOARD",
  content: "KONTEN",
  activity: "AKTIVITAS",
  team: "TIM",
  settings: "SETTING"
};

const CONTENT_HEADERS = [
  "ID", "Judul / Topik", "Platform", "Format Konten", "Durasi / Slide",
  "Pilar Konten", "Funnel", "Objective", "Status", "Tanggal Posting",
  "Waktu Posting", "Judul Keranjang", "Referensi Konten", "Hook / Opening",
  "Visual Hook", "Body / Naskah", "Visual Body", "CTA", "Visual CTA",
  "Caption", "Hashtag", "Notes", "Persetujuan (JSON)", "Komentar (JSON)",
  "Riwayat (JSON)", "Data Lengkap (JSON)", "Dibuat", "Diperbarui"
];
const ACTIVITY_HEADERS = ["ID Aktivitas", "ID Konten", "Judul Konten", "Jenis Aktivitas", "Detail", "Waktu"];
const TEAM_HEADERS = ["ID Anggota", "Nama", "Email", "Peran", "Status", "Ditambahkan"];
const SETTING_HEADERS = ["Kunci", "Nilai", "Keterangan"];
const SETTINGS_DEFAULTS = [
  ["nama_aplikasi", "Note AP", "Nama workspace"],
  ["nama_apotek", "Apotek Prapatan", "Nama organisasi"],
  ["platform_aktif", "Instagram, TikTok", "Platform yang digunakan"],
  ["zona_waktu", "Asia/Jakarta", "Zona waktu database"],
  ["mode_persetujuan", "Semua anggota tim", "Kebijakan persetujuan konten"]
];

function spreadsheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Buka Apps Script dari spreadsheet database melalui Extensions > Apps Script.");
  return ss;
}

function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    const existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];
    headers.forEach((header, i) => {
      if (!existing[i]) sheet.getRange(1, i + 1).setValue(header);
    });
  }
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  sheet.autoResizeColumns(1, headers.length);
  return sheet;
}

function setupNoteAP() {
  const ss = spreadsheet_();
  const dashboard = ensureSheet_(ss, SHEETS.dashboard, ["RINGKASAN NOTE AP", "JUMLAH"]);
  const content = ensureSheet_(ss, SHEETS.content, CONTENT_HEADERS);
  ensureSheet_(ss, SHEETS.activity, ACTIVITY_HEADERS);
  ensureSheet_(ss, SHEETS.team, TEAM_HEADERS);
  const settings = ensureSheet_(ss, SHEETS.settings, SETTING_HEADERS);

  if (settings.getLastRow() < 2) {
    settings.getRange(2, 1, SETTINGS_DEFAULTS.length, 3).setValues(SETTINGS_DEFAULTS);
  }

  refreshDashboardFromSheet_();
  dashboard.setFrozenRows(1);
  content.setFrozenRows(1);
  return "Struktur database Note AP siap: DASHBOARD, KONTEN, AKTIVITAS, TIM, SETTING.";
}

function refreshDashboard_(items) {
  const sheet = spreadsheet_().getSheetByName(SHEETS.dashboard);
  const list = Array.isArray(items) ? items : [];
  const count = status => list.filter(item => item.status === status).length;
  const published = count("Published");
  const scheduled = list.filter(item => ["Planning", "Ready to Publish"].includes(item.status)).length;
  const production = list.filter(item => ["Production", "Editing", "Review"].includes(item.status)).length;
  const instagram = list.filter(item => item.platform === "Instagram").length;
  const tiktok = list.filter(item => item.platform === "TikTok").length;
  const now = new Date();
  const upcoming = list.filter(item => item.date && item.status !== "Published" && new Date(item.date + "T00:00:00") >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    .sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || ""))).slice(0, 8);

  const activities = [];
  list.forEach(item => {
    (item.history || []).forEach(entry => activities.push([entry.at || "", item.title || "", "Riwayat", entry.status || entry.title || "Pembaruan konten"]));
    (item.approvals || []).forEach(entry => activities.push([entry.at || "", item.title || "", "Persetujuan", entry.action || "Pembaruan persetujuan"]));
    (item.comments || []).forEach(entry => activities.push([entry.at || "", item.title || "", "Komentar", entry.text || entry.comment || "Komentar baru"]));
  });
  activities.sort((a, b) => String(b[0]).localeCompare(String(a[0])));

  sheet.clearContents();
  sheet.getRange("A1:D1").merge().setValue("NOTE AP · DASHBOARD DATABASE");
  sheet.getRange("A2:B2").setValues([["RINGKASAN", "JUMLAH"]]);
  sheet.getRange("A3:B7").setValues([
    ["Total Konten", list.length],
    ["Publish", published],
    ["Terjadwal", scheduled],
    ["Dalam Produksi", production],
    ["Belum Dipublikasikan", list.length - published]
  ]);
  sheet.getRange("D2:E2").setValues([["PLATFORM", "JUMLAH"]]);
  sheet.getRange("D3:E4").setValues([["Instagram", instagram], ["TikTok", tiktok]]);
  sheet.getRange("G2:H2").setValues([["STATUS", "JUMLAH"]]);
  sheet.getRange(3, 7, STATUSES_FOR_DASHBOARD.length, 2).setValues(STATUSES_FOR_DASHBOARD.map(status => [status, count(status)]));

  sheet.getRange("A10:D10").merge().setValue("KONTEN AKAN DATANG");
  sheet.getRange("A11:D11").setValues([["Tanggal", "Waktu", "Judul Konten", "Platform"]]);
  if (upcoming.length) sheet.getRange(12, 1, upcoming.length, 4).setValues(upcoming.map(item => [item.date, item.time || "", item.title || "", item.platform || ""]));
  else sheet.getRange("A12").setValue("Belum ada konten mendatang.");

  sheet.getRange("F10:I10").merge().setValue("AKTIVITAS TERBARU");
  sheet.getRange("F11:I11").setValues([["Waktu", "Judul Konten", "Jenis", "Detail"]]);
  if (activities.length) sheet.getRange(12, 6, Math.min(activities.length, 10), 4).setValues(activities.slice(0, 10));
  else sheet.getRange("F12").setValue("Belum ada aktivitas.");

  sheet.getRange("A1:I1").setFontWeight("bold").setFontSize(14).setBackground("#00B3B3").setFontColor("#FFFFFF");
  ["A2:B2", "D2:E2", "G2:H2", "A10:D10", "F10:I10", "A11:D11", "F11:I11"].forEach(range => sheet.getRange(range).setFontWeight("bold").setBackground("#E8F7F7"));
  sheet.setFrozenRows(2);
  sheet.autoResizeColumns(1, 9);
}

const STATUSES_FOR_DASHBOARD = ["Ideation", "Planning", "Production", "Editing", "Review", "Ready to Publish", "Published"];

function refreshDashboardFromSheet_() {
  const sheet = spreadsheet_().getSheetByName(SHEETS.content);
  const last = sheet.getLastRow();
  const rows = last > 1 ? sheet.getRange(2, 1, last - 1, CONTENT_HEADERS.length).getValues() : [];
  const items = rows.map(row => { try { return JSON.parse(row[25]); } catch (err) { return null; } }).filter(Boolean);
  refreshDashboard_(items);
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function contentRow_(item, now) {
  return [
    String(item.id || ""),
    item.title || "",
    item.platform || "",
    item.format || "",
    item.duration || "",
    item.pillar || "",
    item.funnel || "",
    item.objective || "",
    item.status || "",
    item.date || "",
    item.time || "",
    item.basket || "",
    item.reference || "",
    item.hook || "",
    item.visualHook || "",
    item.body || "",
    item.visualBody || "",
    item.cta || "",
    item.visualCta || "",
    item.caption || "",
    item.hashtags || "",
    item.notes || "",
    JSON.stringify(item.approvals || []),
    JSON.stringify(item.comments || []),
    JSON.stringify(item.history || []),
    JSON.stringify(item),
    item.createdAt || now,
    now
  ];
}

function rebuildActivities_(sheet, items) {
  const rows = [];
  items.forEach(item => {
    (item.history || []).forEach((entry, index) => rows.push([
      String(item.id) + "-H-" + index, String(item.id), item.title || "",
      "Riwayat", entry.status || entry.title || "Pembaruan konten", entry.at || ""
    ]));
    (item.approvals || []).forEach((entry, index) => rows.push([
      String(item.id) + "-P-" + index, String(item.id), item.title || "",
      "Persetujuan", entry.action || "Pembaruan persetujuan", entry.at || ""
    ]));
    (item.comments || []).forEach((entry, index) => rows.push([
      String(item.id) + "-K-" + index, String(item.id), item.title || "",
      "Komentar", entry.text || entry.comment || JSON.stringify(entry), entry.at || ""
    ]));
  });
  const last = sheet.getLastRow();
  if (last > 1) sheet.getRange(2, 1, last - 1, ACTIVITY_HEADERS.length).clearContent();
  if (rows.length) sheet.getRange(2, 1, rows.length, ACTIVITY_HEADERS.length).setValues(rows);
}

function doGet() {
  try {
    setupNoteAP();
    const sheet = spreadsheet_().getSheetByName(SHEETS.content);
    const last = sheet.getLastRow();
    const rows = last > 1 ? sheet.getRange(2, 1, last - 1, CONTENT_HEADERS.length).getValues() : [];
    const items = rows.map(row => {
      try { return JSON.parse(row[25]); } catch (err) { return null; }
    }).filter(Boolean);
    return json_({ ok: true, items: items, updatedAt: new Date().toISOString() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (body.action !== "replaceAll" || !Array.isArray(body.items)) {
      return json_({ ok: false, error: "Permintaan tidak valid." });
    }
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      setupNoteAP();
      const ss = spreadsheet_();
      const sheet = ss.getSheetByName(SHEETS.content);
      const oldLast = sheet.getLastRow();
      if (oldLast > 1) sheet.getRange(2, 1, oldLast - 1, CONTENT_HEADERS.length).clearContent();
      const now = new Date().toISOString();
      const rows = body.items.map(item => contentRow_(item, now));
      if (rows.length) sheet.getRange(2, 1, rows.length, CONTENT_HEADERS.length).setValues(rows);
      rebuildActivities_(ss.getSheetByName(SHEETS.activity), body.items);
      refreshDashboard_(body.items);
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true, count: body.items.length, updatedAt: new Date().toISOString() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}
