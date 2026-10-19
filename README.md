# 🎉 Invitación Marichuy & Pedrulce

Invitación web de cumpleaños dual con temática **Pato Donald + Pokémon**.
Intro cinematográfica (Dragonite cartero + Pato Donald anfitrión), cuenta
regresiva, confirmación de asistencia (RSVP) guardada en **Google Sheets**,
lista pública de confirmados, canje de "poción" ligado a cada invitado y
música de fondo estilo chiptune.

---

## 📁 Estructura del proyecto

```
invitacion-cumple/
├── index.html            # Página principal
├── css/
│   └── styles.css        # Estilos (intro, animaciones, diálogos)
├── js/
│   ├── config.js         # ⚙️ Configuración (pega aquí tu URL de Apps Script)
│   └── app.js            # Lógica (intro, countdown, RSVP, música)
├── apps-script/
│   └── Code.gs           # Backend para pegar en Google (NO se sube a Pages)
├── .gitignore
└── README.md
```

---

## 🚀 Probar el sitio localmente (modo demo)

El sitio funciona **sin configurar nada** en "modo demo": las confirmaciones
se guardan solo en tu navegador (localStorage), ideal para ver el diseño.

- Opción rápida: abre `index.html` con doble clic.
- Opción recomendada (para que no falle nada): usa un servidor local.
  - VS Code: extensión **Live Server** → clic derecho en `index.html` → *Open with Live Server*.

> En modo demo cada persona ve solo sus propios datos. Para compartir una lista
> real entre todos los invitados, conecta Google Sheets (abajo). 👇

---

## 🗄️ Conectar Google Sheets (para guardar RSVP de verdad)

Esto permite que **todas** las confirmaciones lleguen a una sola hoja que tú
controlas, y que la lista pública sea la misma para todos.

### Paso 1 — Crear la Google Sheet
1. Entra a [sheets.google.com](https://sheets.google.com) y crea una hoja nueva.
2. Ponle el nombre que quieras (ej. *Invitados Cumple*).
3. No necesitas crear columnas: el script las crea solas.

### Paso 2 — Pegar el script
1. En la hoja, menú **Extensiones → Apps Script**.
2. Borra el código de ejemplo que aparezca.
3. Abre el archivo `apps-script/Code.gs` de este proyecto, copia **todo** su
   contenido y pégalo en el editor de Apps Script.
4. Guarda (icono 💾 o `Ctrl+S`).

### Paso 3 — Publicar como aplicación web
1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. En el engrane ⚙️ elige el tipo **Aplicación web**.
3. Configura:
   - **Descripción:** lo que quieras (ej. "API invitación").
   - **Ejecutar como:** *Yo* (tu cuenta).
   - **Quién tiene acceso:** **Cualquier usuario** (importante, para que los
     invitados puedan enviar sin iniciar sesión).
4. Clic en **Implementar**. Google te pedirá autorizar permisos: acéptalos
   (es tu propio script sobre tu propia hoja).
5. Copia la **URL de la aplicación web** (termina en `/exec`).

### Paso 4 — Pegar la URL en el sitio
1. Abre `js/config.js`.
2. Pega la URL entre las comillas de `SHEETS_API_URL`:
   ```js
   SHEETS_API_URL: "https://script.google.com/macros/s/AAAA.../exec",
   ```
3. Guarda. ¡Listo! Ahora los RSVP se escriben en tu hoja.

> **Si cambias el `Code.gs` después**, debes volver a **Implementar → Gestionar
> implementaciones → editar (lápiz) → Nueva versión** para que surta efecto.

---

## 📊 ¿Qué se guarda y qué es público?

| Dato              | Se guarda en la hoja | Visible públicamente |
|-------------------|:--------------------:|:--------------------:|
| Nombre            | ✅                   | ✅                   |
| Nº de personas    | ✅                   | ✅                   |
| Personaje favorito| ✅                   | ✅                   |
| Canje de poción   | ✅                   | ✅ (configurable)    |
| **Mensaje privado** | ✅                 | ❌ (solo tú lo ves)  |

Para **ocultar** el canje de poción al público, en `js/config.js` pon:
```js
SHOW_POTION_PUBLIC: false,
```

---

## 🌐 Publicar en GitHub Pages

1. Crea un repo nuevo en GitHub (ej. `invitacion-cumple`).
2. Sube el contenido de esta carpeta (sin `apps-script/` si no quieres, es solo referencia).
   ```bash
   git init
   git add .
   git commit -m "Invitación cumpleaños"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/invitacion-cumple.git
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages**.
4. En **Source** elige la rama `main` y carpeta `/ (root)`. Guarda.
5. En 1-2 minutos tu sitio estará en:
   `https://TU_USUARIO.github.io/invitacion-cumple/`
6. Ese es el link que envías a los invitados. 🎊

> Asegúrate de haber pegado la URL del Apps Script en `config.js` **antes** de
> subir, o el sitio quedará en modo demo para todos.

---

## 🎵 Sobre la música y las imágenes (derechos de autor)

- La **música de fondo** NO usa archivos con copyright: es una melodía chiptune
  original generada en el navegador (Web Audio API), con ambiente alegre estilo
  juego de aventura. Se activa con el botón 🎵 (abajo a la derecha) o al abrir
  la carta en la intro.
- No se incluyen **imágenes oficiales** de Disney ni Pokémon. La estética se
  logra con emojis, tipografías tipo videojuego, colores y animaciones.
  Si más adelante quieres arte, usa ilustraciones originales o de licencia libre.

---

## ✏️ Personalización rápida

- **Fecha del evento:** `js/config.js` → `EVENT_DATE`.
- **Diálogos de la intro:** `js/app.js` → arreglo `dialogueLines`.
- **Dirección / mapa:** `index.html` (sección "Gimnasio Central").
- **Textos / nombres:** directamente en `index.html`.

¡Que suban mucho de nivel! ⚡🦆🎂
