/**
 * The Wired Dentistry — subscriber capture
 * Receives POSTs from the landing page and appends them to the sheet.
 *
 * Sheet: https://docs.google.com/spreadsheets/d/14-kHaXsQ5G3OssIT5AA3CgBb5uIbjmC_Bx39H2Cim1A
 */

var SHEET_ID = "14-kHaXsQ5G3OssIT5AA3CgBb5uIbjmC_Bx39H2Cim1A";
var SHEET_NAME = "Subscribers"; // tab name — created automatically if missing

function doPost(e) {
  try {
    var lock = LockService.getScriptLock();
    lock.waitLock(10000); // avoid clashing writes on simultaneous signups

    var params = (e && e.parameter) || {};
    var email = String(params.email || "").trim().toLowerCase();
    var source = String(params.source || "site");
    var page = String(params.page || "");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ ok: false, error: "Invalid email" });
    }

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // Header row on first use
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Email", "Source", "Page"]);
      sheet.getRange("A1:D1").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    // Skip exact duplicate emails
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var existing = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      for (var i = 0; i < existing.length; i++) {
        if (String(existing[i][0]).trim().toLowerCase() === email) {
          return jsonResponse({ ok: true, duplicate: true });
        }
      }
    }

    sheet.appendRow([new Date(), email, source, page]);
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

// Handy for testing the deployment in a browser (GET request)
function doGet() {
  return jsonResponse({ ok: true, message: "The Wired Dentistry subscriber endpoint is live." });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
