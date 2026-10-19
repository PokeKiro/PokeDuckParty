/* ============================================================
   CONFIGURACIÓN — Invitación Marichuy & Pedrulce
   ------------------------------------------------------------
   PASO IMPORTANTE:
   1. Sigue las instrucciones del README.md para crear tu
      Google Apps Script conectado a una Google Sheet.
   2. Al publicarlo como "Aplicación web", Google te dará una
      URL que termina en /exec. Pégala abajo, entre comillas.

   Mientras esté vacía (""), el sitio funciona en "modo demo":
   guarda las confirmaciones solo en el navegador (localStorage)
   para que puedas probar el diseño sin conectar nada todavía.
   ============================================================ */

window.CONFIG = {
    // 👇 Pega aquí la URL de tu Apps Script (termina en /exec)
    SHEETS_API_URL: "https://script.google.com/macros/s/AKfycbw_RhByyyexII2vrLxOOXI8pC-c7zhiA0F__ZTIEQBLYd9ahFCycYytTUHQY58kHZNfkw/exec",

    // Fecha y hora del evento (para la cuenta regresiva)
    // Formato: "Mes Día, Año HH:MM:SS"
    EVENT_DATE: "November 7, 2026 14:00:00",

    // Mostrar públicamente quién ya canjeó su shot/poción
    SHOW_POTION_PUBLIC: true,
};
