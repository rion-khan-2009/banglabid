/**
 * বাংলাবিদ — Google Apps Script ব্যাকএন্ড
 * ---------------------------------------------------------
 * এই কোডটি Google Sheet-কে ডাটাবেস হিসেবে ব্যবহার করে একটা API সার্ভার
 * তৈরি করে। কোনো ম্যানুয়াল হেডার লেখা বা Sheet ID কপি করার দরকার নেই —
 * নিচের setup() ফাংশনটা একবার Run করলেই সব ট্যাব, হেডার, ডিফল্ট
 * অ্যাডমিন — সব নিজে থেকে তৈরি হয়ে যাবে।
 *
 * সেটআপ নির্দেশনা README_BN.md ফাইলে দেখুন (এটা খুব ছোট, মাত্র কয়েকটা ধাপ)।
 */

const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "banglabid2026"; // ডিপ্লয়ের পর এটা অবশ্যই বদলান

const REGISTRATION_HEADERS = [
  "id", "name", "className", "school", "division", "phone", "email",
  "password", "bkashSender", "transactionId", "status", "note", "createdAt",
];

/**
 * এই একটামাত্র ফাংশন Run করলে দরকারি সব শিট/ট্যাব, হেডার, ডিফল্ট সেটিংস
 * এবং একটা ডিফল্ট অ্যাডমিন — সব অটোমেটিক তৈরি হয়ে যাবে।
 * Apps Script এডিটরে উপরের ড্রপডাউন থেকে "setup" সিলেক্ট করে ▶ Run চাপুন।
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1) Registrations ট্যাব
  let regSheet = ss.getSheetByName("Registrations");
  if (!regSheet) regSheet = ss.insertSheet("Registrations");
  if (regSheet.getLastRow() === 0) {
    regSheet.appendRow(REGISTRATION_HEADERS);
    regSheet.setFrozenRows(1);
  }

  // 2) Settings ট্যাব
  let settingsSheet = ss.getSheetByName("Settings");
  if (!settingsSheet) settingsSheet = ss.insertSheet("Settings");
  if (settingsSheet.getLastRow() === 0) {
    settingsSheet.appendRow(["key", "value"]);
    settingsSheet.appendRow(["price", "99"]);
    settingsSheet.appendRow(["discountDeadline", ""]);
    settingsSheet.appendRow(["courseImageUrl", ""]);
    settingsSheet.appendRow(["maintenanceMode", "FALSE"]);
    settingsSheet.setFrozenRows(1);
  }

  // 3) Admins ট্যাব + ডিফল্ট অ্যাডমিন
  let adminsSheet = ss.getSheetByName("Admins");
  if (!adminsSheet) adminsSheet = ss.insertSheet("Admins");
  if (adminsSheet.getLastRow() === 0) {
    adminsSheet.appendRow(["username", "password", "token"]);
    adminsSheet.appendRow([DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD, ""]);
    adminsSheet.setFrozenRows(1);
  }

  // ডিফল্টে তৈরি হওয়া খালি "Sheet1" থাকলে সেটা মুছে ফেলা (থাকলে সমস্যা করবে না, শুধু পরিষ্কার রাখার জন্য)
  const blank = ss.getSheetByName("Sheet1");
  if (blank && ss.getSheets().length > 1) ss.deleteSheet(blank);

  Logger.log("সেটআপ সম্পন্ন! এখন Deploy → New deployment করুন।");
  Logger.log("অ্যাডমিন লগইন — username: " + DEFAULT_ADMIN_USERNAME + " | password: " + DEFAULT_ADMIN_PASSWORD);
}

function getSheet_(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function sheetToObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  return values.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = row[i]));
    return obj;
  });
}

function findRowIndexById_(sheet, id) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) return i + 1; // 1-indexed sheet row
  }
  return -1;
}

/* ---------------- Settings ---------------- */

function getSettingsObj_() {
  const sheet = getSheet_("Settings");
  const rows = sheet.getDataRange().getValues();
  const settings = {};
  for (let i = 1; i < rows.length; i++) {
    settings[rows[i][0]] = rows[i][1];
  }
  settings.maintenanceMode = settings.maintenanceMode === true || settings.maintenanceMode === "TRUE";
  return settings;
}

function setSettingsObj_(newSettings) {
  const sheet = getSheet_("Settings");
  const rows = sheet.getDataRange().getValues();
  const keyRow = {};
  for (let i = 1; i < rows.length; i++) keyRow[rows[i][0]] = i + 1;

  Object.keys(newSettings).forEach((key) => {
    if (key === "action" || key === "token") return;
    const val = newSettings[key];
    if (keyRow[key]) {
      sheet.getRange(keyRow[key], 2).setValue(val);
    } else {
      sheet.appendRow([key, val]);
    }
  });
}

/* ---------------- Admin auth ---------------- */

function checkAdminToken_(token) {
  const admins = sheetToObjects_(getSheet_("Admins"));
  return admins.some((a) => String(a.token) === String(token) && token);
}

function adminLogin_(username, password) {
  const sheet = getSheet_("Admins");
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(username) && String(rows[i][1]) === String(password)) {
      const token = Utilities.getUuid();
      sheet.getRange(i + 1, 3).setValue(token);
      return token;
    }
  }
  return null;
}

/* ---------------- Registration ---------------- */

function registerStudent_(data) {
  const sheet = getSheet_("Registrations");
  const id = Utilities.getUuid();
  sheet.appendRow([
    id,
    data.name,
    data.className,
    data.school,
    data.division,
    data.phone,
    data.email,
    data.password,
    data.bkashSender,
    data.transactionId,
    "pending",
    "",
    new Date(),
  ]);
  return id;
}

function findRegistrationByContact_(phone, email) {
  const rows = sheetToObjects_(getSheet_("Registrations"));
  // সর্বশেষ ম্যাচটি ফেরত দেয়া হয়
  const matches = rows.filter(
    (r) => String(r.phone) === String(phone) && String(r.email).toLowerCase() === String(email).toLowerCase()
  );
  return matches.length ? matches[matches.length - 1] : null;
}

/* ---------------- HTTP entry points ---------------- */

function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === "getSettings") {
      return jsonOut_({ ok: true, data: getSettingsObj_() });
    }
    return jsonOut_({ ok: false, message: "অজানা action" });
  } catch (err) {
    return jsonOut_({ ok: false, message: String(err) });
  }
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ ok: false, message: "ভুল রিকোয়েস্ট ফরম্যাট" });
  }

  const action = body.action;

  try {
    switch (action) {
      case "register": {
        if (!body.name || !body.phone || !body.email) {
          return jsonOut_({ ok: false, message: "প্রয়োজনীয় তথ্য অনুপস্থিত" });
        }
        const id = registerStudent_(body);
        return jsonOut_({ ok: true, data: { id } });
      }

      case "checkStatus": {
        const reg = findRegistrationByContact_(body.phone, body.email);
        if (!reg) return jsonOut_({ ok: false, message: "কোনো রেজিস্ট্রেশন পাওয়া যায়নি।" });
        return jsonOut_({
          ok: true,
          data: { name: reg.name, status: reg.status, note: reg.note },
        });
      }

      case "adminLogin": {
        const token = adminLogin_(body.username, body.password);
        if (!token) return jsonOut_({ ok: false, message: "ভুল ইউজারনেম বা পাসওয়ার্ড।" });
        return jsonOut_({ ok: true, data: { token } });
      }

      case "adminListRegistrations": {
        if (!checkAdminToken_(body.token)) return jsonOut_({ ok: false, message: "Unauthorized" });
        return jsonOut_({ ok: true, data: sheetToObjects_(getSheet_("Registrations")) });
      }

      case "adminUpdateRegistrationStatus": {
        if (!checkAdminToken_(body.token)) return jsonOut_({ ok: false, message: "Unauthorized" });
        const sheet = getSheet_("Registrations");
        const rowIdx = findRowIndexById_(sheet, body.id);
        if (rowIdx === -1) return jsonOut_({ ok: false, message: "রেজিস্ট্রেশন পাওয়া যায়নি" });
        sheet.getRange(rowIdx, 11).setValue(body.status); // status column
        return jsonOut_({ ok: true });
      }

      case "adminUpdateSettings": {
        if (!checkAdminToken_(body.token)) return jsonOut_({ ok: false, message: "Unauthorized" });
        setSettingsObj_(body);
        return jsonOut_({ ok: true });
      }

      default:
        return jsonOut_({ ok: false, message: "অজানা action" });
    }
  } catch (err) {
    return jsonOut_({ ok: false, message: String(err) });
  }
}
