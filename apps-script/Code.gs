/* ============================================================
   GOOGLE APPS SCRIPT — Backend de la invitación
   ------------------------------------------------------------
   Este código NO vive en el repo del sitio: se pega dentro de
   Google (script.google.com) y se conecta a una Google Sheet.
   Es el "pegamento" que recibe las confirmaciones (RSVP),
   marca el canje de la poción y devuelve la lista pública.

   👉 Las instrucciones paso a paso están en el README.md
   ============================================================ */

// Nombre de la pestaña dentro de tu Google Sheet.
var SHEET_NAME = "RSVP";

// Encabezados de las columnas (orden fijo).
var HEADERS = ["Fecha", "Nombre", "Acompanantes", "Personaje", "Mensaje", "Pocion"];

/* ---------- Utilidad: obtener (o crear) la hoja ---------- */
function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  // Asegura encabezados en la primera fila.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

/* ---------- Respuesta JSON (o JSONP si se pide callback) ----------
   JSONP permite que el navegador lea la respuesta esquivando CORS:
   si llega ?callback=foo, envolvemos el JSON como foo({...}). */
function json_(obj, callback) {
  var text = JSON.stringify(obj);
  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + text + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(text)
    .setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
   GET -> devuelve la lista pública de confirmados
   URL: .../exec?action=list              (JSON)
        .../exec?action=list&callback=fn  (JSONP, para el navegador)
   ============================================================ */
function doGet(e) {
  var callback = (e && e.parameter && e.parameter.callback) || null;
  try {
    var action = (e && e.parameter && e.parameter.action) || "list";
    if (action === "list") {
      return json_({ ok: true, guests: readGuests_() }, callback);
    }
    return json_({ ok: false, error: "Acción no reconocida" }, callback);
  } catch (err) {
    return json_({ ok: false, error: String(err) }, callback);
  }
}

/* ============================================================
   POST -> registrar RSVP o canjear poción
   Body (JSON como text/plain):
     { action: "rsvp", name, attendees, fav, message }
     { action: "claim", name }
   ============================================================ */
function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    var action = body.action || "rsvp";

    if (action === "rsvp") {
      return handleRsvp_(body);
    } else if (action === "claim") {
      return handleClaim_(body);
    }
    return json_({ ok: false, error: "Acción no reconocida" });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* ---------- Registrar confirmación ---------- */
function handleRsvp_(body) {
  var sheet = getSheet_();
  var name = String(body.name || "").trim();
  if (!name) return json_({ ok: false, error: "Falta el nombre" });

  sheet.appendRow([
    new Date(),
    name,
    String(body.attendees || "1"),
    String(body.fav || ""),
    String(body.message || ""),
    false
  ]);
  return json_({ ok: true });
}

/* ---------- Marcar poción canjeada ---------- */
function handleClaim_(body) {
  var sheet = getSheet_();
  var name = String(body.name || "").trim();
  if (!name) return json_({ ok: false, error: "Falta el nombre" });

  var data = sheet.getDataRange().getValues();
  // Busca la última fila cuyo nombre coincida (col B = índice 1).
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][1]).trim() === name) {
      sheet.getRange(i + 1, 6).setValue(true); // col F = Pocion
      return json_({ ok: true });
    }
  }
  return json_({ ok: false, error: "Nombre no encontrado" });
}

/* ---------- Leer confirmados (datos públicos) ---------- */
function readGuests_() {
  var sheet = getSheet_();
  var data = sheet.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[1]) continue; // sin nombre -> ignorar
    out.push({
      name: String(row[1]),
      attendees: String(row[2] || "1"),
      fav: String(row[3] || ""),
      // NOTA: el mensaje (row[4]) es PRIVADO: no se expone aquí.
      potion: row[5] === true || String(row[5]).toLowerCase() === "true"
    });
  }
  return out;
}
