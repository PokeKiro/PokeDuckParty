/* ============================================================
   APP — Invitación Marichuy & Pedrulce
   Disney (Pato Donald) + Pokémon
   ============================================================ */

(function () {
    "use strict";

    // Base de la API en Railway (sin barra final). Sin ella -> modo demo.
    const API_BASE = ((window.CONFIG && window.CONFIG.API_BASE) || "").replace(/\/+$/, "");
    const DEMO_MODE = !API_BASE;
    const SHOW_POTION_PUBLIC = !window.CONFIG || window.CONFIG.SHOW_POTION_PUBLIC !== false;

    // En modo conectado (Sheets) limpiamos los datos de prueba del modo demo
    // que pudieran haber quedado guardados en el navegador.
    if (!DEMO_MODE) {
        try { localStorage.removeItem("myPartyGuests"); } catch (e) {}
    }

    // Guarda el nombre con el que esta persona confirmó (para ligar el canje)
    let currentGuestName = localStorage.getItem("rsvpName") || "";

    /* ========================================================
       UTILIDADES
       ======================================================== */
    function $(id) { return document.getElementById(id); }

    function escapeHtml(text) {
        return String(text == null ? "" : text).replace(/[&<>"']/g, function (m) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m];
        });
    }

    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    /* ========================================================
       AUDIO: efectos retro + música de fondo (sintetizada)
       No usamos archivos con copyright: generamos una melodía
       alegre estilo chiptune con Web Audio API.
       ======================================================== */
    let audioCtx = null;
    function getAudioCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === "suspended") audioCtx.resume();
        return audioCtx;
    }

    function playVictorySound() {
        try {
            const ctx = getAudioCtx();
            const notes = [261.63, 329.63, 392.0, 523.25, 659.25]; // C E G C E
            notes.forEach(function (freq, idx) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "triangle";
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + idx * 0.1);
                osc.stop(ctx.currentTime + idx * 0.1 + 0.3);
            });
        } catch (e) { /* silencioso */ }
    }

    function playBlip() {
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "square";
            osc.frequency.value = 660;
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } catch (e) { /* silencioso */ }
    }

    /* ---- Música de fondo: loop chiptune alegre y relajado ---- */
    const BGM = {
        ctx: null,
        master: null,
        timer: null,
        playing: false,
        step: 0,
        audioEl: null,         // <audio> del MP3 si existe
        usingFile: false,      // true si está sonando el MP3
        // Ruta del MP3 opcional. Si colocas el archivo aquí, suena ese;
        // si no existe, se usa la melodía chiptune de respaldo.
        fileSrc: "assets/audio/title.mp3",
        // Melodía tipo "pueblo tranquilo" (notas en Hz), compás simple.
        // Original, inspirada en el ambiente de un juego de aventura.
        melody: [
            523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 587.33, 659.25,
            523.25, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33, 523.25
        ],
        bass: [
            130.81, 0, 196.0, 0, 174.61, 0, 196.0, 0,
            130.81, 0, 196.0, 0, 174.61, 0, 130.81, 0
        ],
        start: function () {
            if (this.playing) return;
            this.playing = true;
            const self = this;

            // 1) Intentar reproducir el MP3 (si existe el archivo).
            if (!this.audioEl) {
                this.audioEl = new Audio();
                this.audioEl.src = this.fileSrc;
                this.audioEl.loop = true;
                this.audioEl.volume = 0.25;
            }
            this.audioEl.play().then(function () {
                // El archivo existe y suena: no usamos chiptune.
                self.usingFile = true;
            }).catch(function () {
                // No hay MP3 (o el navegador lo bloqueó): usar chiptune.
                self.usingFile = false;
                self.startChiptune();
            });
        },
        startChiptune: function () {
            this.ctx = getAudioCtx();
            this.master = this.ctx.createGain();
            this.master.gain.value = 0.12; // volumen fondo suave
            this.master.connect(this.ctx.destination);
            this.step = 0;
            const tempo = 260; // ms por paso
            const self = this;
            this.timer = setInterval(function () { self.tick(); }, tempo);
            this.tick();
        },
        tick: function () {
            const i = this.step % this.melody.length;
            this.playNote(this.melody[i], "triangle", 0.09, 0.22);
            if (this.bass[i]) this.playNote(this.bass[i], "sine", 0.12, 0.10);
            this.step++;
        },
        playNote: function (freq, type, dur, vol) {
            if (!freq) return;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            g.gain.setValueAtTime(0, this.ctx.currentTime);
            g.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
            osc.connect(g);
            g.connect(this.master);
            osc.start();
            osc.stop(this.ctx.currentTime + dur + 0.02);
        },
        stop: function () {
            this.playing = false;
            // Pausar MP3 si estaba sonando
            if (this.audioEl) {
                try { this.audioEl.pause(); } catch (e) {}
            }
            // Detener chiptune
            if (this.timer) clearInterval(this.timer);
            this.timer = null;
            if (this.master) {
                try { this.master.disconnect(); } catch (e) {}
                this.master = null;
            }
        }
    };

    function updateMusicButton() {
        const btn = $("musicToggle");
        const state = $("musicState");
        if (!btn) return;
        if (BGM.playing) {
            btn.classList.add("playing");
            state.textContent = "ON";
            btn.querySelector("i").className = "fa-solid fa-music";
        } else {
            btn.classList.remove("playing");
            state.textContent = "OFF";
            btn.querySelector("i").className = "fa-solid fa-volume-xmark";
        }
    }

    function toggleMusic() {
        if (BGM.playing) BGM.stop();
        else BGM.start();
        updateMusicButton();
    }

    /* ========================================================
       INTRO CINEMÁTICA
       ======================================================== */
    const dialogueLines = [
        "¡Hola, hola! 🦆 ¡Qué gusto verte! Soy el Pato Donald y seré tu anfitrión en esta celebración de cuento.",
        "Un mensajero muy especial voló sin descanso para entregarte esta invitación tan mágica.",
        "¡Marichuy y Pedrulce cumplen un año más y quieren vivir esta aventura contigo!",
        "📍 La fiesta será en: Cerrada de Olivos 64, San Antonio Zomeyucan, Naucalpan.",
        "🗓️ El sábado 7 de Noviembre, a las 14:00 hrs. ¡Que no se te haga tarde!",
        "Y al llegar... te espera una poción de bienvenida para que la magia no pare. 🍹✨",
        "¿Aceptas la invitación? ¡Confirma tu asistencia y prepárate para celebrar! 🎉"
    ];
    let dialogueIndex = 0;
    let typing = false;

    function typeLine(text) {
        return new Promise(function (resolve) {
            const el = $("dialogueText");
            const next = $("dialogueNext");
            el.innerHTML = "";
            next.classList.remove("show");
            typing = true;
            let i = 0;
            const cursor = '<span class="cursor">▍</span>';
            const interval = setInterval(function () {
                if (i < text.length) {
                    el.innerHTML = escapeHtml(text.slice(0, i + 1)) + cursor;
                    if (text[i] !== " ") playBlip();
                    i++;
                } else {
                    clearInterval(interval);
                    el.innerHTML = escapeHtml(text);
                    typing = false;
                    next.classList.add("show");
                    resolve();
                }
            }, 28);
            el._skip = function () {
                clearInterval(interval);
                el.innerHTML = escapeHtml(text);
                typing = false;
                next.classList.add("show");
                resolve();
            };
        });
    }

    function advanceDialogue() {
        const el = $("dialogueText");
        if (typing && el._skip) { el._skip(); return; }      // primer toque: completa el texto
        dialogueIndex++;
        if (dialogueIndex < dialogueLines.length) {
            typeLine(dialogueLines[dialogueIndex]);
        } else {
            endIntro();
        }
    }

    async function runIntro() {
        // Escena 1: Dragonite vuela (ya animado por CSS)
        await sleep(3800);
        if (introEnded) return;
        showScene("scene-letter");

        // Escena 2: espera a que el usuario toque la carta
        const letter = $("letterEnvelope");
        letter.addEventListener("click", openLetter, { once: true });
    }

    function openLetter() {
        if (introEnded) return;
        playVictorySound();
        const letter = $("letterEnvelope");
        letter.classList.add("opening");
        // Durante la intro NO suena la música de fondo, para que se escuchen
        // los efectos de los diálogos del anfitrión. La música arranca al
        // entrar a la página (ver endIntro).
        setTimeout(function () {
            showScene("scene-dialogue");
            dialogueIndex = 0;
            typeLine(dialogueLines[0]);
        }, 850);
    }

    function showScene(id) {
        ["scene-dragonite", "scene-letter", "scene-dialogue"].forEach(function (s) {
            const el = $(s);
            if (el) el.classList.toggle("hidden", s !== id);
        });
    }

    let introEnded = false;
    function endIntro() {
        if (introEnded) return;
        introEnded = true;
        const intro = $("intro");
        intro.classList.add("intro-closing");
        // Ahora SÍ: al entrar a la página principal arranca el tema de fondo.
        if (!BGM.playing) { BGM.start(); updateMusicButton(); }
        setTimeout(function () {
            intro.style.display = "none";
            const main = $("mainContent");
            main.classList.remove("main-hidden");
            main.classList.add("main-visible");
            initMainContent();
        }, 1000);
    }

    /* ========================================================
       COUNTDOWN
       ======================================================== */
    const EVENT_TS = new Date(window.CONFIG.EVENT_DATE).getTime();

    // ¿Ya llegó (o pasó) el día/hora del evento?
    function eventStarted() {
        return Date.now() >= EVENT_TS;
    }

    function initCountdown() {
        function update() {
            const diff = EVENT_TS - Date.now();
            if (diff > 0) {
                const d = Math.floor(diff / 86400000);
                const h = Math.floor((diff % 86400000) / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                $("days").textContent = String(d).padStart(2, "0");
                $("hours").textContent = String(h).padStart(2, "0");
                $("minutes").textContent = String(m).padStart(2, "0");
                $("seconds").textContent = String(s).padStart(2, "0");
            } else {
                // Llegó el evento: se queda en ceros.
                $("days").textContent = "00";
                $("hours").textContent = "00";
                $("minutes").textContent = "00";
                $("seconds").textContent = "00";
                // Al llegar la fecha, desbloquea el botón de la poción.
                updatePotionAvailability();
            }
        }
        update();
        setInterval(update, 1000);
    }

    // Bloquea/desbloquea el botón de reclamar poción según la fecha.
    function updatePotionAvailability() {
        const btn = $("claimBtn");
        const btnText = $("btnText");
        if (!btn) return;
        // Si ya fue canjeada, no tocar (se queda como "canjeada").
        if (btn.dataset.claimed === "1") return;

        if (eventStarted()) {
            btn.disabled = false;
            btn.title = "";
            btnText.textContent = "¡Reclamar Poción HP!";
        } else {
            btn.disabled = true;
            btn.title = "Disponible el día del evento";
            btnText.textContent = "Disponible el día del evento";
        }
    }

    /* ========================================================
       REVEAL AL SCROLL
       ======================================================== */
    function initReveal() {
        const els = document.querySelectorAll(".reveal");
        if (!("IntersectionObserver" in window)) {
            els.forEach(function (el) { el.classList.add("revealed"); });
            return;
        }
        const obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("revealed");
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        els.forEach(function (el) { obs.observe(el); });
    }

    /* ========================================================
       DATOS: Google Sheets (vía Apps Script) o modo demo
       ======================================================== */
    function demoGuests() {
        try { return JSON.parse(localStorage.getItem("myPartyGuests") || "[]"); }
        catch (e) { return []; }
    }
    function saveDemoGuests(list) {
        try { localStorage.setItem("myPartyGuests", JSON.stringify(list)); } catch (e) {}
    }

    // Helper: fetch con timeout contra la API de Railway
    async function apiFetch(path, options, ms) {
        const ctrl = new AbortController();
        const timer = setTimeout(function () { ctrl.abort(); }, ms || 20000);
        try {
            const res = await fetch(API_BASE + path, Object.assign({}, options, { signal: ctrl.signal }));
            const text = await res.text();
            let data;
            try { data = JSON.parse(text); }
            catch (e) { throw new Error("Respuesta inválida del servidor"); }
            if (!res.ok || (data && data.ok === false)) {
                throw new Error((data && data.error) || ("HTTP " + res.status));
            }
            return data;
        } finally {
            clearTimeout(timer);
        }
    }

    // Enviar RSVP (fetch normal contra Railway, CORS ok)
    async function submitRSVP(payload) {
        if (DEMO_MODE) {
            const list = demoGuests();
            list.push(Object.assign({ potion: false, date: new Date().toISOString() }, payload));
            saveDemoGuests(list);
            return { ok: true };
        }
        return apiFetch("/rsvp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    }

    // Marcar poción canjeada
    async function claimPotion(name) {
        if (DEMO_MODE) {
            const list = demoGuests();
            for (let i = list.length - 1; i >= 0; i--) {
                if (list[i].name === name) { list[i].potion = true; break; }
            }
            saveDemoGuests(list);
            return { ok: true };
        }
        return apiFetch("/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name })
        });
    }

    // Obtener lista pública
    async function fetchGuests() {
        if (DEMO_MODE) return demoGuests();
        const data = await apiFetch("/list?_=" + Date.now(), { method: "GET" });
        return (data && data.guests) || [];
    }

    /* ========================================================
       RENDER LISTA PÚBLICA
       ======================================================== */
    async function refreshGuestList() {
        const stateEl = $("guestListState");
        const container = $("guestListContainer");
        const listEl = $("guestList");
        const countEl = $("confirmedCount");

        stateEl.classList.remove("hidden");
        stateEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cargando lista de invitados...';
        container.classList.add("hidden");

        // Hasta 3 intentos: en datos móviles el primer intento puede fallar.
        let guests = null;
        let lastErr = null;
        for (let intento = 1; intento <= 3; intento++) {
            try {
                guests = await fetchGuests();
                break;
            } catch (e) {
                lastErr = e;
                if (intento < 3) {
                    stateEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Reintentando... (' + intento + '/3)';
                    await sleep(1500);
                }
            }
        }
        if (guests === null) {
            stateEl.innerHTML = '<span class="text-red-400"><i class="fa-solid fa-triangle-exclamation"></i> No se pudo cargar la lista. Toca "Actualizar lista".</span>';
            return;
        }

        const total = guests.reduce(function (sum, g) {
            return sum + (parseInt(g.attendees, 10) || 1);
        }, 0);
        countEl.textContent = total;

        if (!guests.length) {
            stateEl.innerHTML = '🥚 Aún no hay confirmados. ¡Sé el primer entrenador en unirse a esta incursión!';
            return;
        }

        stateEl.classList.add("hidden");
        container.classList.remove("hidden");
        listEl.innerHTML = guests.map(function (g) {
            const potion = SHOW_POTION_PUBLIC && (g.potion === true || g.potion === "TRUE" || g.potion === "true")
                ? '<span class="potion-badge">🍹 poción canjeada</span>'
                : "";
            const count = parseInt(g.attendees, 10) || 1;
            return (
                '<li class="py-1.5 flex justify-between items-center gap-2">' +
                '<div class="min-w-0">' +
                '<span class="font-medium text-slate-200">' + escapeHtml(g.name) + "</span>" +
                (g.fav ? '<span class="text-xs text-gold ml-2">(' + escapeHtml(g.fav) + ")</span>" : "") +
                (potion ? '<div class="mt-0.5">' + potion + "</div>" : "") +
                "</div>" +
                '<span class="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700 whitespace-nowrap">' +
                count + (count === 1 ? " persona" : " personas") +
                "</span>" +
                "</li>"
            );
        }).join("");
    }

    /* ========================================================
       FORM RSVP
       ======================================================== */
    function initForm() {
        const form = $("rsvpForm");
        form.addEventListener("submit", async function (e) {
            e.preventDefault();
            const name = $("guestName").value.trim();
            const attendees = $("attendees").value;
            const fav = $("favoriteChar").value.trim();
            const message = $("message").value.trim();
            const errEl = $("rsvpError");
            errEl.classList.add("hidden");

            if (!name) { $("guestName").focus(); return; }

            const btn = $("rsvpSubmit");
            const btnText = $("rsvpSubmitText");
            btn.disabled = true;
            btnText.textContent = "Enviando...";

            try {
                const result = await submitRSVP({ name: name, attendees: attendees, fav: fav, message: message });
                if (result && result.ok === false) throw new Error(result.error || "Error desconocido");

                currentGuestName = name;
                localStorage.setItem("rsvpName", name);

                confetti({
                    particleCount: 120,
                    spread: 100,
                    origin: { y: 0.6 },
                    colors: ["#D4AF37", "#FFCC03", "#3B4CCA", "#0055A5", "#10B981"]
                });
                playVictorySound();

                form.classList.add("hidden");
                $("msgDetails").textContent =
                    "Gracias " + name + ", registramos a tu equipo (" + attendees +
                    (attendees === "1" ? " persona)." : " personas).");
                $("confirmationMsg").classList.remove("hidden");
                updatePotionAvailability(); // bloquea/activa según la fecha

                refreshGuestList();
            } catch (err) {
                btn.disabled = false;
                btnText.textContent = "Confirmar Asistencia Oficial";
                const msg = err && err.message ? err.message : "";
                // Si el backend avisa de nombre duplicado, mostramos ese mensaje tal cual.
                errEl.textContent = /ya confirm/i.test(msg)
                    ? "Ese nombre ya confirmó asistencia. Usa un nombre distinto si eres otra persona."
                    : "Ups, no se pudo enviar. Revisa tu conexión e inténtalo de nuevo.";
                errEl.classList.remove("hidden");
            }
        });
    }

    /* ========================================================
       CANJE DE SHOT (ligado al RSVP)
       ======================================================== */
    window.claimShot = async function claimShot() {
        const btn = $("claimBtn");
        const btnText = $("btnText");
        if (btn.disabled) return;
        if (!eventStarted()) return; // doble seguro: no se canjea antes del evento

        confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.7 },
            colors: ["#10B981", "#00FF66", "#D4AF37"]
        });
        playVictorySound();

        btn.disabled = true;
        btnText.textContent = "Canjeando...";

        try {
            await claimPotion(currentGuestName);
            btn.dataset.claimed = "1";
            btnText.textContent = "¡Poción Canjeada con Éxito! 🍹";
            btn.classList.remove("bg-emerald-500", "hover:bg-emerald-400");
            btn.classList.add("bg-gold", "text-slate-950");
            refreshGuestList();
        } catch (e) {
            // Aunque falle la red, visualmente ya se canjeó; reintenta al refrescar.
            btn.dataset.claimed = "1";
            btnText.textContent = "¡Poción Canjeada! 🍹";
            btn.classList.add("bg-gold", "text-slate-950");
        }
    };

    /* ========================================================
       INICIALIZACIÓN DEL CONTENIDO PRINCIPAL
       ======================================================== */
    let mainInitialized = false;
    function initMainContent() {
        if (mainInitialized) return;
        mainInitialized = true;
        initCountdown();
        initReveal();
        initForm();
        refreshGuestList();

        $("refreshGuests").addEventListener("click", function () {
            playBlip();
            refreshGuestList();
        });
        $("musicToggle").addEventListener("click", toggleMusic);
        updateMusicButton();
    }

    /* ========================================================
       ARRANQUE
       ======================================================== */
    document.addEventListener("DOMContentLoaded", function () {
        // Botón saltar intro (endIntro arranca la música al entrar)
        $("skipIntro").addEventListener("click", endIntro);

        // Avanzar diálogo (clic en caja o en la flecha)
        $("scene-dialogue").addEventListener("click", advanceDialogue);

        // Arranca la secuencia de intro
        showScene("scene-dragonite");
        runIntro();
    });
})();
