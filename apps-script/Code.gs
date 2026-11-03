const SHEET_NAME = "Konten";
function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(["ID", "Data JSON", "Diperbarui"]);
  return sheet;
}
function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function doGet(e) {
  try {
    const sheet = getSheet_();
    const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues() : [];
    const items = rows.filter(row => row[0] !== "").map(row => {
      try { return JSON.parse(row[1]); } catch (err) { return null; }
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
      const sheet = getSheet_();
      const last = sheet.getLastRow();
      if (last > 1) sheet.getRange(2, 1, last - 1, 3).clearContent();
      if (body.items.length) {
        const rows = body.items.map(item => [String(item.id), JSON.stringify(item), new Date()]);
        sheet.getRange(2, 1, rows.length, 3).setValues(rows);
      }
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true, count: body.items.length, updatedAt: new Date().toISOString() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}
function setupNoteAP() {
  const sheet = getSheet_();
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, 3).setFontWeight("bold");
  sheet.autoResizeColumns(1, 3);
  return "Database Note AP siap digunakan.";
}