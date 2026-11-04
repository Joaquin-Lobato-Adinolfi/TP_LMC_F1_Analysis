/* Video del TP "¿Piloto o auto?": 8 escenas animadas sincronizadas con el audio.
   Todo se dibuja en SVG y depende solo del tiempo: window.render(T) deja el cuadro
   del segundo T listo para capturar (video/render.js lo llama cuadro por cuadro).
   Los tiempos de cada palabra vienen de video/tiempos.js y los datos de
   docs/data/f1_data.js, el mismo archivo que usan la web y la presentación. */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const D = window.F1_DATA, TI = window.TIEMPOS;
  const C = {
    bg: "#0B0D12", auto: "#FF2D2D", piloto: "#3EE0FF", texto: "#F2F3F5", tenue: "#8A90A0",
    linea: "#262A36", violeta: "#9B6BFF", rb: "#3671C6", fer: "#E8002D", mcl: "#FF8000",
    alp: "#FF87BC", amr: "#229971", dinero: "#3DBE6E", gris: "#3A4050", claude: "#D97757",
  };
  const MONO = "JetBrains Mono", DISP = "Inter Display", SANS = "Inter";
  const svg = document.getElementById("v");

  // ---------------------------------------------------------------- utilidades
  function el(tag, a, p) {
    const e = document.createElementNS(NS, tag);
    if (a) for (const k in a) e.setAttribute(k, a[k]);
    (p || svg).appendChild(e);
    return e;
  }
  function set(e, a) { for (const k in a) e.setAttribute(k, a[k]); return e; }
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, p) => a + (b - a) * p;
  const E = {
    lin: (p) => p,
    out: (p) => 1 - Math.pow(1 - p, 3),
    in: (p) => p * p * p,
    io: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    back: (p) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  };
  const P = (T, t0, d = 0.6, e = E.out) => e(clamp((T - t0) / d));
  // Visible desde a (entra en di segundos) hasta b (sale en dout segundos).
  const F = (T, a, b, di = 0.4, dout = 0.4) => Math.min(P(T, a, di), b == null ? 1 : 1 - P(T, b, dout, E.in));
  const tr = (g, x, y, s = 1, r = 0) => g.setAttribute("transform", `translate(${x} ${y}) rotate(${r}) scale(${s})`);
  const op = (g, o) => { g.setAttribute("opacity", o); g.style.display = o <= 0.001 ? "none" : ""; };
  const fmt = (x, d = 2) => x.toFixed(d).replace(".", ",");
  function txt(p, s, a) {
    const t = el("text", Object.assign({ "font-family": SANS, fill: C.texto, "text-anchor": "middle" }, a), p);
    t.textContent = s;
    return t;
  }
  // Flecha horizontal desde x0 con largo len (en el grupo g).
  function flecha(p, color, grosor) {
    const g = el("g", {}, p);
    const linea = el("rect", { y: -grosor / 2, height: grosor, rx: grosor / 2, fill: color }, g);
    const punta = el("path", { d: `M0 ${-grosor * 1.9} L${grosor * 3.2} 0 L0 ${grosor * 1.9} Z`, fill: color }, g);
    const cola = el("rect", { x: -grosor * 0.6, y: -grosor * 1.6, width: grosor * 0.9, height: grosor * 3.2, rx: 2, fill: color }, g);
    return {
      g,
      set(x0, y, len) {
        tr(g, x0, y);
        const l = Math.max(0, len - grosor * 3);
        set(linea, { x: 0, width: l });
        tr(punta, l, 0, len > 2 ? 1 : 0);
      },
    };
  }

  // ---------------------------------------------------------- tiempos del habla
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[¿?¡!,;:"]/g, "").replace(/\.+$/, "");
  const ESC = {};
  TI.forEach((e) => (ESC[e.id] = e));
  // Momento (en segundos del video) en que se dice la n-ésima aparición de la palabra.
  function G(id, palabra, n = 1, fin = false) {
    const e = ESC[id];
    let c = 0;
    for (const p of e.palabras) {
      if (norm(p.w) === norm(palabra) || norm(p.asr) === norm(palabra)) {
        if (++c === n) return e.inicio + (fin ? p.f : p.t);
      }
    }
    throw new Error(`No está la palabra "${palabra}" (${n}) en ${id}`);
  }
  const S0 = (id) => ESC[id].inicio;
  const S1 = (id) => ESC[id].inicio + ESC[id].dur;
  const TOTAL = S1(TI[TI.length - 1].id);

  // ------------------------------------------------------------------ dibujos
  const defs = el("defs");
  defs.innerHTML = `
    <linearGradient id="brillo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>
    <radialGradient id="vineta" cx=".5" cy=".45" r=".75">
      <stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></radialGradient>
    <radialGradient id="foco" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#fff" stop-opacity=".09"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="glowF" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="22" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <pattern id="cuadros" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="#F2F3F5"/><rect width="20" height="20" fill="#0B0D12"/>
      <rect x="20" y="20" width="20" height="20" fill="#0B0D12"/></pattern>
    <pattern id="rayas" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="14" height="14" fill="#F2F3F5" fill-opacity=".1"/><rect width="5" height="14" fill="#F2F3F5" fill-opacity=".5"/></pattern>`;

  let uid = 0;
  function auto(p, color, w, acento) {
    const g = el("g", {}, p);
    const h = (w * 100) / 260;
    g.innerHTML = window.F1_AUTO(color, "a" + uid++, acento)
      .replace("<svg ", `<svg x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" `);
    return g;
  }
  // Auto de los años 50 (para "comparar épocas"): dibujo propio y simple.
  function autoViejo(p, w) {
    const g = el("g", {}, p);
    const k = el("g", { transform: `scale(${w / 260}) translate(-130 -50)` }, g);
    for (const [x, y] of [[62, 14], [62, 86], [190, 16], [190, 84]])
      el("rect", { x: x - 20, y: y - 12, width: 40, height: 24, rx: 10, fill: "#16171b", stroke: "#3a3d45", "stroke-width": 2 }, k);
    el("path", { d: "M18 50 C18 34 50 28 120 28 C190 28 240 36 246 50 C240 64 190 72 120 72 C50 72 18 66 18 50 Z", fill: "#B6BABD" }, k);
    el("path", { d: "M18 50 C18 34 50 28 120 28 C190 28 240 36 246 50 C240 64 190 72 120 72 C50 72 18 66 18 50 Z", fill: "url(#brillo)" }, k);
    el("ellipse", { cx: 110, cy: 50, rx: 18, ry: 12, fill: "#07080a" }, k);
    el("circle", { cx: 106, cy: 50, r: 7, fill: "#E8C341" }, k);
    el("ellipse", { cx: 246, cy: 50, rx: 6, ry: 9, fill: "#07080a" }, k);
    return g;
  }
  function casco(p, color, s) {
    const g = el("g", {}, p);
    const k = el("g", { transform: `scale(${s / 100}) translate(-54 -47)` }, g);
    const d = "M12 62 C12 30 34 10 60 10 C84 10 96 30 96 54 L96 72 C96 79 91 84 84 84 L30 84 C19 84 12 75 12 62 Z";
    el("path", { d, fill: color }, k);
    el("path", { d, fill: "url(#brillo)" }, k);
    el("path", { d: "M54 36 L94 36 L97 56 L60 56 C54 56 50 51 50 46 C50 40 51 36 54 36 Z", fill: "#0d0f14" }, k);
    el("path", { d: "M60 41 L88 41", stroke: "#fff", "stroke-opacity": 0.4, "stroke-width": 3, "stroke-linecap": "round" }, k);
    el("path", { d: "M14 68 L96 68", stroke: "#0d0f14", "stroke-opacity": 0.5, "stroke-width": 4 }, k);
    return g;
  }
  function billete(p) {
    const g = el("g", {}, p);
    el("rect", { x: -34, y: -15, width: 68, height: 30, rx: 4, fill: C.dinero, stroke: "#1f6e3d", "stroke-width": 2 }, g);
    el("rect", { x: -27, y: -9, width: 54, height: 18, rx: 3, fill: "none", stroke: "#1f6e3d", "stroke-width": 1.5 }, g);
    txt(g, "$", { y: 7, "font-size": 18, "font-weight": 800, fill: "#124226", "font-family": MONO });
    return g;
  }
  function tilde(p, color, s = 1) {
    const g = el("g", {}, p);
    const path = el("path", { d: `M${-14 * s} ${0} L${-4 * s} ${10 * s} L${16 * s} ${-12 * s}`, fill: "none", stroke: color, "stroke-width": 6 * s, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    const L = 48 * s;
    set(path, { "stroke-dasharray": L, "stroke-dashoffset": L });
    return { g, set(pr) { path.setAttribute("stroke-dashoffset", L * (1 - pr)); op(g, pr > 0 ? 1 : 0); } };
  }

  // Balanza: pivote en (0,0); tita > 0 baja el plato derecho (auto).
  function balanza(p) {
    const g = el("g", {}, p);
    el("ellipse", { cx: 0, cy: 336, rx: 210, ry: 18, fill: "#000", opacity: 0.45 }, g);
    el("path", { d: "M-130 330 L130 330 L92 300 L-92 300 Z", fill: "#1A1E28", stroke: "#323848", "stroke-width": 2 }, g);
    el("rect", { x: -11, y: 0, width: 22, height: 305, rx: 6, fill: "#232835", stroke: "#323848", "stroke-width": 2 }, g);
    const viga = el("g", {}, g);
    el("rect", { x: -390, y: -9, width: 780, height: 18, rx: 9, fill: "#2B3142", stroke: "#3E465B", "stroke-width": 2 }, viga);
    el("rect", { x: -390, y: -9, width: 780, height: 18, rx: 9, fill: "url(#brillo)" }, viga);
    el("path", { d: "M-26 -30 L26 -30 L0 6 Z", fill: "#F2F3F5", opacity: 0.85 }, g);
    el("circle", { cx: 0, cy: 0, r: 14, fill: "#F2F3F5" }, g);
    const platos = [-1, 1].map((lado) => {
      const pg = el("g", {}, g);
      const cad = el("path", { d: "M0 0 L-118 190 M0 0 L118 190", stroke: "#5A6274", "stroke-width": 3 }, pg);
      el("circle", { cx: 0, cy: 0, r: 7, fill: "#8A90A0" }, pg);
      const brillo = el("ellipse", { cx: 0, cy: 182, rx: 150, ry: 46, fill: lado < 0 ? C.piloto : C.auto, opacity: 0, filter: "url(#glowF)" }, pg);
      const contenido = el("g", { transform: "translate(0 186)" }, pg);
      el("path", { d: "M-140 190 Q0 262 140 190 Z", fill: "#2B3142", stroke: "#3E465B", "stroke-width": 2 }, pg);
      el("path", { d: "M-140 190 L140 190", stroke: "#5A6274", "stroke-width": 4, "stroke-linecap": "round" }, pg);
      return { g: pg, contenido, brillo, cad };
    });
    return {
      g, viga, izq: platos[0], der: platos[1],
      set(tita) {
        const r = (tita * Math.PI) / 180;
        viga.setAttribute("transform", `rotate(${tita})`);
        tr(platos[0].g, -380 * Math.cos(r), -380 * Math.sin(r));
        tr(platos[1].g, 380 * Math.cos(r), 380 * Math.sin(r));
      },
    };
  }

  // ----------------------------------------------------------------- escenario
  const fondo = el("g");
  el("rect", { width: 1920, height: 1080, fill: C.bg }, fondo);
  for (let x = 0; x <= 1920; x += 80) el("path", { d: `M${x} 0 V1080`, stroke: "#141823", "stroke-width": 1 }, fondo);
  for (let y = 0; y <= 1080; y += 80) el("path", { d: `M0 ${y} H1920`, stroke: "#141823", "stroke-width": 1 }, fondo);
  el("ellipse", { cx: 960, cy: 470, rx: 900, ry: 520, fill: "url(#foco)" }, fondo);

  const ACTOS = [];
  function acto(desde, hasta, construir) {
    const clipId = "clip" + ACTOS.length;
    const cp = el("clipPath", { id: clipId }, defs);
    const rect = el("rect", { x: 0, y: 0, width: 1920, height: 1080 }, cp);
    const g = el("g", { "clip-path": `url(#${clipId})` });
    const a = { desde, hasta, g, rect, draw: construir(g) };
    ACTOS.push(a);
    return a;
  }

  // ============================================================ ACTO I: A1 + A2
  acto("A1", "A2", (g) => {
    // Semáforo de largada
    const sem = el("g", {}, g);
    el("rect", { x: -420, y: -150, width: 840, height: 26, rx: 6, fill: "#1A1E28" }, sem);
    const luces = [];
    for (let i = 0; i < 5; i++) {
      const cx = -300 + i * 150;
      el("rect", { x: cx - 8, y: -128, width: 16, height: 24, fill: "#1A1E28" }, sem);
      el("rect", { x: cx - 58, y: -104, width: 116, height: 236, rx: 20, fill: "#101218", stroke: "#262A36", "stroke-width": 3 }, sem);
      const par = [-42, 58].map((cy) => {
        el("circle", { cx, cy, r: 38, fill: "#2a0d10" }, sem);
        return el("circle", { cx, cy, r: 38, fill: C.auto, filter: "url(#glow)", opacity: 0 }, sem);
      });
      luces.push(par);
    }
    // Título 1
    const t1 = el("text", { x: 960, y: 175, "text-anchor": "middle", "font-family": DISP, "font-weight": 800, "font-style": "italic", "font-size": 112, fill: C.texto }, g);
    const t1a = el("tspan", {}, t1); t1a.textContent = "¿";
    const t1p = el("tspan", {}, t1); t1p.textContent = "Piloto";
    const t1b = el("tspan", {}, t1); t1b.textContent = " o ";
    const t1c = el("tspan", {}, t1); t1c.textContent = "auto";
    const t1d = el("tspan", {}, t1); t1d.textContent = "?";
    const t2 = el("text", { x: 960, y: 175, "text-anchor": "middle", "font-family": DISP, "font-weight": 800, "font-style": "italic", "font-size": 112, fill: C.texto }, g);
    const T2 = "¿Qué pesa más?";

    // Balanza con el casco y el auto
    const bal = balanza(g);
    const casc = casco(bal.izq.contenido, C.piloto, 150);
    tr(casc, 0, -62);
    const au = auto(bal.der.contenido, C.auto, 250);
    tr(au, 0, -40);
    // Datos que caen (puntos) y billetes
    const puntos = [];
    for (let i = 0; i < 36; i++) {
      const lado = i % 2 ? bal.der : bal.izq;
      const c = el("circle", { r: 7, fill: i % 2 ? C.auto : C.piloto, opacity: 0 }, lado.contenido);
      puntos.push({ c, x: ((i * 37) % 200) - 100, y: -8 - Math.floor(i / 12) * 13 - ((i * 13) % 7), d: (i % 18) * 0.035 });
    }
    const billetes = [];
    for (let i = 0; i < 26; i++) {
      const lado = i % 2 ? bal.der : bal.izq;
      const k = Math.floor(i / 2);
      const b = billete(lado.contenido);
      billetes.push({ b, x: [-62, 0, 62][k % 3] + ((k * 7) % 9) - 4, y: -6 - Math.floor(k / 3) * 22, r: ((k * 17) % 13) - 6, d: i * 0.05 });
    }
    const rebotes = [0, 1, 2, 3].map(() => billete(g));
    // Charla de fanáticos: globos
    const globos = [[330, 330, "?"], [1590, 330, "!"], [250, 600, "!?"], [1670, 610, "?"], [600, 290, "!"], [1330, 285, "?!"]].map(([x, y, s], i) => {
      const gg = el("g", {}, g);
      el("path", { d: "M-62 -42 H62 Q80 -42 80 -24 V18 Q80 36 62 36 H-6 L-30 62 L-26 36 H-62 Q-80 36 -80 18 V-24 Q-80 -42 -62 -42 Z", fill: "#1A1E28", stroke: i % 2 ? C.auto : C.piloto, "stroke-width": 4 }, gg);
      txt(gg, s, { y: 16, "font-size": 52, "font-weight": 800, "font-family": DISP, fill: C.texto });
      return { gg, x, y, d: i * 0.11 };
    });
    // Tope de gastos
    const tope = el("g", {}, g);
    [580, 1340].forEach((x) => el("rect", { x: x - 150, y: -9, width: 300, height: 18, rx: 4, fill: "url(#rayas)", stroke: C.texto, "stroke-width": 2 }, tope));
    el("path", { d: "M730 0 H1190", stroke: C.texto, "stroke-width": 2, "stroke-dasharray": "8 10", opacity: 0.5 }, tope);
    const topeTxt = el("g", {}, tope);
    txt(topeTxt, "Tope", { x: 1510, y: 12, "text-anchor": "start", "font-family": DISP, "font-weight": 800, "font-style": "italic", "font-size": 44 });
    txt(topeTxt, "2021", { x: 1630, y: 12, "text-anchor": "start", "font-family": MONO, "font-weight": 700, "font-size": 40, fill: C.tenue });
    // Flecha que duda
    const duda = el("g", {}, g);
    el("path", { d: "M-16 -70 H16 V-20 H40 L0 22 L-40 -20 H-16 Z", fill: C.texto }, duda);
    const dudaQ = el("g", {}, duda);
    el("circle", { cx: 0, cy: -112, r: 30, fill: "#1A1E28", stroke: C.texto, "stroke-width": 3 }, dudaQ);
    txt(dudaQ, "?", { y: -97, "font-size": 46, "font-weight": 800, "font-family": DISP });

    // Tiempos clave
    const tHola = G("A1", "hola"), tF1 = G("A1", "formula"), tDisc = G("A1", "discusion");
    const tPil = G("A1", "piloto"), tAut = G("A1", "auto"), tNos = G("A1", "nosotros"), tDat = G("A1", "datos");
    const tPreg = G("A2", "pregunta"), tQue = G("A2", "que"), tMasF = G("A2", "mas", 1, true);
    const tAut2 = G("A2", "auto"), tPil2 = G("A2", "piloto"), tCharla = G("A2", "charla"), tEquipos = G("A2", "equipos");
    const tFort = G("A2", "fortunas"), t2021 = G("A2", "2021"), tTope = G("A2", "tope");
    const tDonde = G("A2", "donde"), tPoner = G("A2", "poner"), tDinero = G("A2", "dinero");
    const tBal = tDisc + 0.15;

    return (T) => {
      // Semáforo: se prende de a una columna y se apaga en "discusión".
      tr(sem, 960, 300 - 520 * P(T, tDisc + 0.35, 0.7, E.in));
      op(sem, F(T, 0.1, tDisc + 0.55, 0.5, 0.5));
      luces.forEach((par, i) => {
        const on = T >= lerp(tHola, tF1 + 0.4, i / 4) && T < tDisc;
        par.forEach((c) => c.setAttribute("opacity", on ? 1 : 0));
      });
      // Título 1 y 2
      op(t1, F(T, tDisc + 0.25, tPreg, 0.5, 0.35));
      t1.setAttribute("transform", `translate(0 ${-30 * (1 - P(T, tDisc + 0.25, 0.5))})`);
      t1p.setAttribute("fill", T >= tPil ? C.piloto : C.texto);
      t1c.setAttribute("fill", T >= tAut ? C.auto : C.texto);
      const n2 = Math.round(T2.length * P(T, tQue - 0.05, Math.max(0.3, tMasF - tQue), E.lin));
      t2.textContent = T2.slice(0, n2);
      op(t2, T >= tQue - 0.05 ? 1 : 0);

      // Balanza
      const cae = P(T, tBal, 0.8, E.back);
      tr(bal.g, 960, lerp(-700, 470, cae));
      op(bal.g, T >= tBal ? 1 : 0);
      let tita = 0;
      const paso = (t0, a) => a * P(T, t0, 0.55, E.io);
      tita += paso(tPil - 0.1, -12) + paso(tAut - 0.1, 24) + paso(tNos, -12);
      tita += paso(tAut2 - 0.05, 5) + paso(tPil2 - 0.05, -10) + paso(tPil2 + 0.6, 5);
      const ultimo = [tBal, tPil, tAut, tNos, tAut2, tPil2].filter((x) => x <= T).pop() || tBal;
      tita += 2.2 * Math.sin((T - ultimo) * 9) * Math.exp(-(T - ultimo) * 2.2) * (T > tBal ? 1 : 0);
      bal.set(tita);
      bal.izq.brillo.setAttribute("opacity", 0.55 * (P(T, tPil, 0.3) - P(T, tAut, 0.3)) + 0.55 * (P(T, tPil2, 0.3) - P(T, tPil2 + 0.9, 0.4)));
      bal.der.brillo.setAttribute("opacity", 0.55 * (P(T, tAut, 0.3) - P(T, tNos, 0.4)) + 0.55 * (P(T, tAut2, 0.3) - P(T, tPil2, 0.3)));
      // Datos que llueven en "datos"
      const fueraDatos = 1 - P(T, tFort - 0.2, 0.5);
      puntos.forEach((pt) => {
        const pr = P(T, tDat - 0.15 + pt.d, 0.45, E.in);
        set(pt.c, { cx: pt.x, cy: lerp(-520, pt.y, pr), opacity: (pr > 0 ? 1 : 0) * fueraDatos });
      });
      // Billetes en "fortunas"
      billetes.forEach((bb) => {
        const pr = P(T, tFort - 0.1 + bb.d, 0.5, E.in);
        tr(bb.b, bb.x, lerp(-620, bb.y, pr), 1, bb.r * pr);
        op(bb.b, pr > 0 ? 1 : 0);
      });
      // Globos de charla
      globos.forEach((gl) => {
        const s = P(T, tCharla - 0.15 + gl.d, 0.4, E.back) * (1 - P(T, tEquipos - 0.1, 0.3, E.in));
        tr(gl.gg, gl.x, gl.y, Math.max(0.001, s));
        op(gl.gg, s > 0.01 ? 1 : 0);
      });
      // Tope: baja la barra en "2021" y aparece el rótulo en "tope"
      tr(tope, 0, lerp(-60, 545, P(T, t2021 - 0.1, 0.55, E.back)));
      op(tope, T >= t2021 - 0.1 ? 1 : 0);
      op(topeTxt, P(T, tTope - 0.05, 0.3));
      rebotes.forEach((b, i) => {
        const t0 = tTope + 0.05 + i * 0.12, pr = clamp((T - t0) / 0.9);
        const x = [530, 1290, 630, 1390][i];
        // cae hasta el tope y rebota hacia arriba
        const y = pr < 0.4 ? lerp(-60, 515, E.in(pr / 0.4)) : 515 - 220 * Math.sin(((pr - 0.4) / 0.6) * Math.PI * 0.5);
        tr(b, x, y, 1, i % 2 ? 18 * pr : -18 * pr);
        op(b, pr > 0 && pr < 1 ? (pr > 0.4 ? 1 - (pr - 0.4) / 0.6 : 1) : 0);
      });
      // Flecha que duda entre los dos platos
      const xd = lerp(lerp(lerp(960, 580, P(T, tDonde - 0.1, 0.4, E.io)), 1340, P(T, tPoner - 0.1, 0.45, E.io)), 960, P(T, tDinero - 0.05, 0.45, E.io));
      tr(duda, xd, 395 + 10 * Math.sin(T * 6));
      op(duda, P(T, tDonde - 0.2, 0.3));
      op(dudaQ, P(T, tDinero, 0.3));
    };
  });

  // ============================================================ ACTO II: J3 + J4
  acto("J3", "J4", (g) => {
    const U = 100; // píxeles por posición en la vista general
    // Base de datos
    const db = el("g", {}, g);
    for (let k = 2; k >= 0; k--) {
      el("path", { d: `M-150 ${k * 70 - 60} V${k * 70 + 10} A150 40 0 0 0 150 ${k * 70 + 10} V${k * 70 - 60}`, fill: "#1A1E28", stroke: C.tenue, "stroke-width": 3 }, db);
    }
    el("ellipse", { cx: 0, cy: -60, rx: 150, ry: 40, fill: "#232835", stroke: C.tenue, "stroke-width": 3 }, db);
    const filas = [];
    for (let i = 0; i < 14; i++) filas.push(el("rect", { width: 60, height: 10, rx: 3, fill: i % 3 ? C.tenue : C.piloto }, g));

    // Temporadas y carreras (305 en total)
    const CARRERAS = [19, 19, 20, 19, 19, 19, 21, 20, 21, 21, 17, 22, 22, 22, 24];
    const temp = el("g", {}, g);
    const cols = CARRERAS.map((n, i) => {
      const x = 362 + i * 85;
      const cg = el("g", {}, temp);
      el("rect", { x: -34, y: -6, width: 68, height: 6, rx: 3, fill: C.tenue }, cg);
      const anio = txt(cg, String(2010 + i), { y: 34, "font-family": MONO, "font-size": 21, fill: C.tenue });
      const cuad = [];
      for (let j = 0; j < n; j++) cuad.push(el("rect", { x: -9, y: -24 - j * 17, width: 18, height: 14, rx: 2, fill: C.texto, opacity: 0 }, cg));
      return { cg, x, anio, cuad };
    });
    const llave = el("path", { d: "", fill: "none", stroke: C.piloto, "stroke-width": 4, "stroke-linecap": "round" }, temp);
    const cont305 = txt(temp, "0", { x: 960, y: 260, "font-family": MONO, "font-weight": 800, "font-size": 120 });

    // Auto + casco que se separan
    const solo = el("g", {}, g);
    const cascoS = casco(g, C.piloto, 170);
    const tijera = el("g", {}, g);
    el("circle", { cx: -18, cy: -48, r: 16, fill: "none", stroke: C.texto, "stroke-width": 6 }, tijera);
    el("circle", { cx: 18, cy: -48, r: 16, fill: "none", stroke: C.texto, "stroke-width": 6 }, tijera);
    const hoja1 = el("path", { d: "M-8 -34 L10 40", stroke: C.texto, "stroke-width": 8, "stroke-linecap": "round" }, tijera);
    const hoja2 = el("path", { d: "M8 -34 L-10 40", stroke: C.texto, "stroke-width": 8, "stroke-linecap": "round" }, tijera);
    const corte = el("path", { d: "M0 0 V0", stroke: C.texto, "stroke-width": 3, "stroke-dasharray": "10 10" }, g);

    // Pilotos de la grilla: 10 equipos en filas, dos autos por equipo
    const EQ = [
      ["#3671C6", 0.6], ["#27F4D2", 1.3], ["#FF8000", 0.5], ["#64C4FF", 1.0], [C.violeta, 1.97],
      ["#FFD800", 0.8], ["#229971", 1.5], ["#B6BABD", 0.4], ["#52E252", 1.1], ["#FF87BC", 0.7],
    ];
    const FILA_Y = (r) => 196 + r * 72;
    const otrasMedias = [602.4, 690, 777.4, 865, 952.4, 1040, 1127.4, 1215, 1302.4].sort(() => 0);
    const MEDIA_CARRERA = 1005.2, X_VIO = 1480; // 1480 − 1005 = 4,75 posiciones (×100 px)
    const grilla = [];
    let k = 0;
    EQ.forEach(([color, gap], r) => {
      if (r === 4) return;
      const m = otrasMedias[[3, 7, 1, 5, 0, 8, 2, 6, 4][k++]];
      const par = [0, 1].map((j) => {
        const a = auto(g, color, 104);
        return { a, x: m + (j ? 0.5 : -0.5) * gap * 60, y: FILA_Y(r) + (j ? 15 : -15) };
      });
      grilla.push({ par, r });
    });
    const vio = [auto(g, C.violeta, 420), auto(g, C.violeta, 420)];
    const igual = el("g", {}, g);
    txt(igual, "=", { x: 0, y: 34, "font-family": MONO, "font-weight": 800, "font-size": 120 });
    txt(igual, "Mismo auto", { x: 70, y: 26, "text-anchor": "start", "font-family": DISP, "font-weight": 800, "font-style": "italic", "font-size": 64 });
    const lineaMedia = el("path", { d: `M${MEDIA_CARRERA} 150 V870`, stroke: C.tenue, "stroke-width": 3, "stroke-dasharray": "12 10" }, g);
    const fP = flecha(g, C.piloto, 14), fA = flecha(g, C.auto, 14);
    const lP = txt(g, "Piloto", { "font-family": DISP, "font-weight": 800, "font-style": "italic", "font-size": 52, fill: C.piloto });
    const lA = txt(g, "Auto", { "font-family": DISP, "font-weight": 800, "font-style": "italic", "font-size": 52, fill: C.auto });

    // 2.209 duelos: cuadrado de 47 × 47 puntos
    const grillaDuelos = el("g", {}, g);
    const puntos = [];
    for (let i = 0; i < 2209; i++) {
      const fx = i % 47, fy = Math.floor(i / 47);
      puntos.push({ c: el("circle", { cx: 1080 + fx * 14.4, cy: 186 + fy * 14.4, r: 4.6, fill: C.texto }, grillaDuelos), d: (fx + fy) / 92 });
    }
    const cont2209 = txt(g, "2.209", { x: 540, y: 820, "font-family": MONO, "font-weight": 800, "font-size": 132 });

    // ---- J4: barras a escala, réplicas y serie por temporada
    const X0 = 300, UB = 200; // regla de 0 a 6 posiciones
    const regla = el("g", {}, g);
    el("path", { d: `M${X0} 690 H${X0 + 6 * UB}`, stroke: C.tenue, "stroke-width": 3 }, regla);
    for (let i = 0; i <= 6; i++) {
      el("path", { d: `M${X0 + i * UB} 680 V700`, stroke: C.tenue, "stroke-width": 3 }, regla);
      txt(regla, String(i), { x: X0 + i * UB, y: 740, "font-family": MONO, "font-size": 30, fill: C.tenue });
    }
    for (let i = 1; i <= 6; i++) el("path", { d: `M${X0 + i * UB} 290 V680`, stroke: C.linea, "stroke-width": 2 }, regla);
    const barras = el("g", {}, g);
    const bA = el("rect", { x: X0, y: 300, height: 100, rx: 8, fill: C.auto }, barras);
    const bP = el("rect", { x: X0, y: 540, height: 100, rx: 8, fill: C.piloto }, barras);
    const vA = txt(barras, "4,75", { y: 372, "text-anchor": "start", "font-family": MONO, "font-weight": 800, "font-size": 54 });
    const vP = txt(barras, "1,97", { y: 612, "text-anchor": "start", "font-family": MONO, "font-weight": 800, "font-size": 54 });
    const copias = [0, 1, 2].map(() => el("rect", { y: 430, height: 70, rx: 6, fill: C.piloto, "fill-opacity": 0.55, stroke: C.piloto, "stroke-width": 3 }, barras));
    const ratio = el("g", {}, barras);
    txt(ratio, "2,4", { x: 0, y: 0, "text-anchor": "end", "font-family": MONO, "font-weight": 800, "font-size": 150 });
    txt(ratio, "×", { x: 8, y: 0, "text-anchor": "start", "font-family": MONO, "font-weight": 800, "font-size": 150, fill: C.auto });

    const serie = el("g", {}, g);
    const SX = (a) => 360 + (a - 2010) * 88.6, SY = (v) => 800 - v * 80;
    for (let v = 0; v <= 6; v++) {
      el("path", { d: `M340 ${SY(v)} H1620`, stroke: C.linea, "stroke-width": 2 }, serie);
      txt(serie, String(v), { x: 312, y: SY(v) + 10, "text-anchor": "end", "font-family": MONO, "font-size": 26, fill: C.tenue });
    }
    D.efectos.forEach((e) => txt(serie, "'" + String(e.year).slice(2), { x: SX(e.year), y: 842, "font-family": MONO, "font-size": 24, fill: C.tenue }));
    const ptsA = D.efectos.map((e) => [SX(e.year), SY(e.auto)]), ptsP = D.efectos.map((e) => [SX(e.year), SY(e.piloto)]);
    const largo = (pts) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
    const linA = el("path", { d: "M" + ptsA.map((p) => p.join(" ")).join(" L"), fill: "none", stroke: C.auto, "stroke-width": 7, "stroke-linejoin": "round" }, serie);
    const linP = el("path", { d: "M" + ptsP.map((p) => p.join(" ")).join(" L"), fill: "none", stroke: C.piloto, "stroke-width": 7, "stroke-linejoin": "round" }, serie);
    const LA = largo(ptsA), LP = largo(ptsP);
    set(linA, { "stroke-dasharray": LA }); set(linP, { "stroke-dasharray": LP });
    const dotsA = ptsA.map((p) => el("circle", { cx: p[0], cy: p[1], r: 9, fill: C.auto }, serie));
    const dotsP = ptsP.map((p) => el("circle", { cx: p[0], cy: p[1], r: 9, fill: C.piloto }, serie));
    const tildes = D.efectos.map((e) => { const t = tilde(serie, C.dinero, 1); tr(t.g, SX(e.year), 892); return t; });
    const quince = el("g", {}, g);
    txt(quince, "15/15", { x: 360, y: 250, "text-anchor": "start", "text-anchor": "end", "font-family": MONO, "font-weight": 800, "font-size": 96, fill: C.dinero });

    // tiempos
    const tBase = G("J3", "base"), tRes = G("J3", "resultados"), t15 = G("J3", "15"), t2010 = G("J3", "2010"), t2024 = G("J3", "2024");
    const t300 = G("J3", "300"), tCarrF = G("J3", "carreras", 1, true), tProb = G("J3", "problema");
    const tAuto1 = G("J3", "auto", 1), tPil1 = G("J3", "piloto", 1), tJunt = G("J3", "juntos"), tSep = G("J3", "separamos");
    const tComp = G("J3", "companero"), tMismo = G("J3", "mismo"), tGana = G("J3", "gana"), tPil2 = G("J3", "piloto", 2);
    const tEq3 = G("J3", "equipo", 3), tAdel = G("J3", "adelante"), tDemas = G("J3", "demas"), tAuto4 = G("J3", "auto", 4);
    const tCompar = G("J3", "comparamos"), tN1 = G("J3", "2.209", 1), tDuel = G("J3", "duelos");
    const tResu = G("J4", "resultado"), tCuatro = G("J4", "cuatro"), tMediaF = G("J4", "media", 1, true);
    const tDos1 = G("J4", "dos", 1), tDos2 = G("J4", "dos", 2), tVeces = G("J4", "veces"), tMedia2 = G("J4", "media", 2);
    const tPilJ4 = G("J4", "piloto", 2), tQuince = G("J4", "quince"), tTempF = G("J4", "temporadas", 1, true);
    const tSin = G("J4", "sin"), tExc = G("J4", "excepcion");

    return (T) => {
      // Base de datos
      const sDb = lerp(1, 0.45, P(T, t15 - 0.2, 0.6, E.io));
      tr(db, lerp(960, 200, P(T, t15 - 0.2, 0.6, E.io)), lerp(470, 230, P(T, t15 - 0.2, 0.6, E.io)), sDb * P(T, tBase - 0.2, 0.5, E.back));
      op(db, F(T, tBase - 0.2, tProb, 0.3, 0.4));
      filas.forEach((f, i) => {
        const pr = clamp((T - tRes - i * 0.07) / 0.5);
        set(f, { x: lerp(80, 930, E.io(pr)), y: 300 + ((i * 53) % 260) * (1 - pr) + 160 * pr });
        op(f, pr > 0 && pr < 1 ? 1 : 0);
      });
      // Temporadas
      op(temp, F(T, t15 - 0.1, tProb, 0.3, 0.4));
      cols.forEach((c, i) => {
        const s = P(T, t15 - 0.1 + i * 0.045, 0.35, E.back);
        tr(c.cg, c.x, 780, Math.max(0.001, s));
        c.cuad.forEach((q, j) => q.setAttribute("opacity", P(T, t300 - 0.1 + i * 0.05 + j * 0.018, 0.15)));
        const resalt = (i === 0 && T >= t2010) || (i === 14 && T >= t2024);
        c.anio.setAttribute("fill", resalt ? C.piloto : C.tenue);
        c.anio.setAttribute("font-weight", resalt ? 800 : 400);
      });
      const pl = P(T, t2024, 0.4, E.io);
      set(llave, { d: `M${362 - 40} 840 V856 H${lerp(362 - 40, 362 + 14 * 85 + 40, pl)} ${pl > 0.98 ? "V840" : ""}` });
      op(llave, T >= t2010 ? 1 : 0);
      const nCarr = Math.round(305 * P(T, t300 - 0.1, Math.max(0.6, tCarrF - t300 + 0.3), E.out));
      cont305.textContent = String(nCarr);
      op(cont305, F(T, t300 - 0.1, tProb, 0.2, 0.4));

      // Auto y casco juntos, y la tijera
      const enGrilla = P(T, tEq3 - 0.1, 0.9, E.io);
      const gana = P(T, tGana - 0.1, 0.6, E.io);
      const comp = P(T, tComp - 0.1, 0.6, E.io);
      // auto delantero (vio[0]) y su compañero (vio[1])
      const a0x = lerp(lerp(1000, 860, comp) + 473 * gana, X_VIO + 98.5 + (0 * enGrilla), enGrilla);
      const a0y = lerp(lerp(470, 380, comp), FILA_Y(4) - 15, enGrilla);
      const a1x = lerp(lerp(-400, 860, comp), X_VIO - 98.5, enGrilla);
      const a1y = lerp(600, FILA_Y(4) + 15, enGrilla);
      const sVio = lerp(1, 104 / 420, enGrilla);
      // antes de "adelante", el equipo violeta está en el medio del pelotón
      const adel = P(T, tAdel - 0.1, 0.8, E.io);
      const corrimiento = lerp(952.4 - X_VIO, 0, adel) * enGrilla;
      tr(vio[0], a0x + corrimiento, a0y, sVio * P(T, tAuto1 - 0.15, 0.5, E.back));
      tr(vio[1], a1x + corrimiento, a1y, sVio);
      const finVio = 1 - P(T, tCompar - 0.05, 0.5, E.in);
      op(vio[0], (T >= tAuto1 - 0.15 ? 1 : 0) * finVio);
      op(vio[1], (comp > 0 ? 1 : 0) * finVio);
      // casco: entra, se mete al auto en "juntos" y sale con la tijera
      const meter = P(T, tJunt - 0.15, 0.5, E.io), sacar = P(T, tSep + 0.35, 0.5, E.back);
      const cx = lerp(lerp(520, 1000, meter), 1000, sacar), cy = lerp(lerp(470, 470, meter), 250, sacar);
      tr(cascoS, cx, cy, lerp(lerp(1, 0.13, meter), 0.8, sacar) * P(T, tPil1 - 0.15, 0.4, E.back));
      op(cascoS, F(T, tPil1 - 0.15, tComp - 0.1, 0.2, 0.35));
      const pt = P(T, tSep - 0.1, 0.5, E.io);
      tr(tijera, 1000, lerp(260, 640, pt), 0.9, 0);
      const abre = 14 * Math.abs(Math.sin(T * 14));
      hoja1.setAttribute("transform", `rotate(${abre} 0 -34)`); hoja2.setAttribute("transform", `rotate(${-abre} 0 -34)`);
      op(tijera, F(T, tSep - 0.15, tSep + 0.55, 0.15, 0.25));
      set(corte, { d: `M1000 260 V${lerp(260, 640, pt)}` });
      op(corte, F(T, tSep - 0.1, tSep + 0.7, 0.1, 0.3));
      // "Mismo auto"
      tr(igual, 1150, 495);
      op(igual, F(T, tMismo - 0.1, tGana - 0.15, 0.3, 0.3));

      // Grilla de 10 equipos
      grilla.forEach((eq, i) => eq.par.forEach((p) => {
        const pr = P(T, tEq3 + 0.15 + i * 0.05, 0.5, E.out);
        tr(p.a, p.x + (1 - pr) * 260, p.y, 1);
        op(p.a, pr * finVio);
      }));
      op(lineaMedia, F(T, tDemas - 0.1, tCompar - 0.05, 0.3, 0.4));

      // Flechas: piloto (1,97) y auto (4,75), siempre a la misma escala
      const aLado = P(T, tCompar - 0.05, 0.7, E.io);
      const enBarra = P(T, tResu - 0.1, 0.6, E.io);
      // flecha del piloto
      let lenP = 473 * P(T, tPil2 - 0.15, 0.45, E.out);
      let pX = 860, pY = 480;
      pX = lerp(pX, X_VIO - 98.5 + (952.4 - X_VIO) * (1 - adel), enGrilla);
      pY = lerp(pY, FILA_Y(4), enGrilla);
      lenP = lerp(lenP, 1.97 * U, enGrilla);
      pX = lerp(pX, 170, aLado); pY = lerp(pY, 540, aLado);
      pX = lerp(pX, X0, enBarra); pY = lerp(pY, 590, enBarra); lenP = lerp(lenP, 1.97 * UB, enBarra);
      fP.set(pX, pY, lenP);
      op(fP.g, (T >= tPil2 - 0.15 ? 1 : 0) * lerp(1, 0.3, enBarra) * (T < tDos1 - 0.1 ? 1 : 0));
      set(lP, enBarra > 0.5 ? { x: X0 - 28, y: pY + 18, "text-anchor": "end" } : { x: pX + Math.max(lenP, 140) / 2, y: pY - 30, "text-anchor": "middle" });
      op(lP, P(T, tPil2 - 0.1, 0.3) * (1 - P(T, tQuince - 0.2, 0.3)));
      // flecha del auto
      let lenA = 4.75 * U * P(T, tAuto4 - 0.2, 0.5, E.out);
      let aX = lerp(MEDIA_CARRERA, 170, aLado), aY = lerp(FILA_Y(4) - 44, 400, aLado);
      aX = lerp(aX, X0, enBarra); aY = lerp(aY, 350, enBarra); lenA = lerp(lenA, 4.75 * UB, enBarra);
      fA.set(aX, aY, lenA);
      op(fA.g, (T >= tAuto4 - 0.2 ? 1 : 0) * lerp(1, 0.3, enBarra) * (T < tCuatro - 0.1 ? 1 : 0));
      set(lA, enBarra > 0.5 ? { x: X0 - 28, y: aY + 18, "text-anchor": "end" } : { x: aX + Math.max(lenA, 120) / 2, y: aY - 30, "text-anchor": "middle" });
      op(lA, P(T, tAuto4 - 0.1, 0.3) * (1 - P(T, tQuince - 0.2, 0.3)));

      // 2.209 duelos
      op(grillaDuelos, F(T, tN1 - 0.2, tResu - 0.2, 0.2, 0.5));
      if (T > tN1 - 0.3 && T < tResu + 0.5) {
        puntos.forEach((p) => {
          const pr = P(T, tN1 - 0.1 + p.d * 1.3, 0.25);
          p.c.setAttribute("r", 4.6 * pr);
          p.c.setAttribute("fill", T >= tDuel + p.d * 0.6 ? C.piloto : C.texto);
        });
      }
      cont2209.textContent = (Math.round(2209 * P(T, tN1 - 0.1, 1.4, E.out))).toLocaleString("es-AR");
      op(cont2209, F(T, tN1 - 0.1, tResu - 0.2, 0.2, 0.4));
      cont2209.setAttribute("fill", T >= tDuel ? C.piloto : C.texto);

      // ---- J4
      const chico = P(T, tQuince - 0.15, 0.7, E.io); // las barras se achican arriba a la izquierda
      const gBar = `translate(${lerp(0, 1240, chico)} ${lerp(0, 40, chico)}) scale(${lerp(1, 0.3, chico)})`;
      regla.setAttribute("transform", gBar); barras.setAttribute("transform", gBar);
      op(regla, F(T, tResu - 0.1, null, 0.5));
      const wA = 4.75 * UB * P(T, tCuatro - 0.1, Math.max(0.5, tMediaF - tCuatro), E.out);
      const wP = 1.97 * UB * P(T, tDos1 - 0.1, 0.5, E.out);
      set(bA, { width: wA }); set(bP, { width: wP });
      op(barras, T >= tResu ? 1 : 0);
      set(vA, { x: X0 + wA + 24 }); op(vA, P(T, tMediaF - 0.2, 0.3));
      set(vP, { x: X0 + wP + 24 }); op(vP, P(T, tDos1 + 0.2, 0.3));
      bA.setAttribute("opacity", T >= tCuatro - 0.1 ? 1 : 0);
      bP.setAttribute("opacity", T >= tDos1 - 0.1 ? 1 : 0);
      [tDos2, tVeces, tMedia2].forEach((t0, i) => {
        const pr = P(T, t0 - 0.12, 0.45, E.io);
        const w = i < 2 ? 1.97 * UB : (4.75 - 2 * 1.97) * UB;
        set(copias[i], { x: X0 + i * 1.97 * UB, width: w, y: lerp(540, 435, pr), opacity: pr > 0 ? 1 : 0 });
      });
      tr(ratio, X0 + 4.75 * UB + 400, 560, P(T, tPilJ4 - 0.2, 0.5, E.back));
      op(ratio, T >= tPilJ4 - 0.2 ? 1 : 0);
      // la serie se dibuja de 2010 a 2024 en "quince temporadas"
      op(serie, P(T, tQuince - 0.1, 0.4));
      const dib = P(T, tQuince, Math.max(0.9, tTempF - tQuince + 0.3), E.io);
      linA.setAttribute("stroke-dashoffset", LA * (1 - dib));
      linP.setAttribute("stroke-dashoffset", LP * (1 - dib));
      dotsA.forEach((d, i) => d.setAttribute("opacity", dib * 14 >= i ? 1 : 0));
      dotsP.forEach((d, i) => d.setAttribute("opacity", dib * 14 >= i ? 1 : 0));
      tildes.forEach((t, i) => t.set(P(T, tSin - 0.2 + i * 0.045, 0.2)));
      tr(quince, 0, 0, 1);
      op(quince, P(T, tExc - 0.1, 0.35));
    };
  });

  // ================================================================= ACTO III: A5
  acto("A5", "A5", (g) => {
    const ojo = el("g", {}, g);
    const parpado = el("g", {}, ojo);
    el("path", { d: "M-230 0 Q0 -170 230 0 Q0 170 -230 0 Z", fill: "#EDEFF3" }, parpado);
    el("circle", { r: 92, fill: C.piloto }, parpado);
    el("circle", { r: 40, fill: "#07080a" }, parpado);
    el("circle", { cx: 24, cy: -26, r: 15, fill: "#fff" }, parpado);
    el("path", { d: "M-230 0 Q0 -170 230 0 Q0 170 -230 0 Z", fill: "none", stroke: C.texto, "stroke-width": 10 }, ojo);
    const cascoGrande = casco(g, C.piloto, 300);

    // Par de autos: Verstappen (Red Bull) y Alonso en cuatro equipos
    const EQUIPOS = [[C.rb, "#FFD800"], [C.fer, "#FFD800"], [C.mcl, "#1a1a1a"], [C.alp, "#2B6BD8"], [C.amr, "#CEDC00"]];
    const pares = EQUIPOS.map(([c, a]) => ({ front: auto(g, c, 340, a), back: auto(g, c, 340, a) }));
    const nombreV = txt(g, "Verstappen", { x: 640, y: 250, "font-family": DISP, "font-weight": 800, "font-style": "italic", "font-size": 64, fill: "#6E9BEA" });
    const nombreA = txt(g, "Alonso", { x: 640, y: 250, "font-family": DISP, "font-weight": 800, "font-style": "italic", "font-size": 64, fill: C.texto });
    const fichas = EQUIPOS.slice(1).map(([c]) => el("rect", { width: 70, height: 16, rx: 8, fill: c }, g));

    // 10 duelos: 8 ganados
    const duelos = [];
    for (let i = 0; i < 10; i++) {
      const dg = el("g", {}, g);
      const x = 200 + (i % 5) * 132, y = 690 + Math.floor(i / 5) * 92;
      const gano = i !== 3 && i !== 8;
      el("rect", { x: -54, y: -26, width: 108, height: 52, rx: 12, fill: "#141823", stroke: "#262A36", "stroke-width": 2 }, dg);
      el("path", { d: "M-40 0 H40", stroke: "#3A4050", "stroke-width": 4, "stroke-linecap": "round" }, dg);
      el("circle", { cx: gano ? -20 : 22, cy: 0, r: 10, fill: "#6B7385" }, dg);
      const yo = el("circle", { cx: gano ? 22 : -20, cy: 0, r: 13, fill: C.rb }, dg);
      tr(dg, x, y);
      duelos.push({ dg, yo, gano, x, y });
    }

    // Ranking de 39 pilotos (mínimo 33 duelos), con la línea del 50 %
    const rank = el("g", {}, g);
    const RX = (i) => 1010 + i * 20.5, RY = (v) => 800 - v * 4.6;
    [0, 50, 100].forEach((v) => {
      el("path", { d: `M995 ${RY(v)} H1815`, stroke: v === 50 ? C.texto : C.linea, "stroke-width": v === 50 ? 3 : 2, "stroke-dasharray": v === 50 ? "12 9" : "" }, rank);
      txt(rank, v + "%", { x: 982, y: RY(v) + 9, "text-anchor": "end", "font-family": MONO, "font-size": 26, fill: C.tenue });
    });
    const barrasR = D.duelos.map((d, i) => el("rect", { x: RX(i), width: 16, rx: 3, fill: C.gris }, rank));
    const etV = txt(rank, fmt(D.duelos[0].pct, 1) + "%", { "font-family": MONO, "font-weight": 800, "font-size": 40, fill: "#6E9BEA", "text-anchor": "start" });
    const etA = txt(rank, fmt(D.duelos[1].pct, 1) + "%", { "font-family": MONO, "font-weight": 800, "font-size": 40, fill: C.texto, "text-anchor": "start" });
    const sello = el("g", {}, g);
    el("rect", { x: -250, y: -78, width: 500, height: 140, rx: 14, fill: C.bg, "fill-opacity": 0.75, stroke: C.piloto, "stroke-width": 9 }, sello);
    txt(sello, "Talento", { y: 30, "font-family": DISP, "font-weight": 800, "font-style": "italic", "font-size": 104, fill: C.piloto });

    const tOjo = G("A5", "ojo"), tEso = G("A5", "eso"), tPil = G("A5", "piloto"), tImp = G("A5", "importe");
    const tMismo = G("A5", "mismo"), tVer = G("A5", "verstappen"), tOcho = G("A5", "ocho"), tDiezF = G("A5", "diez", 1, true);
    const tCarr = G("A5", "carreras"), tAlo = G("A5", "alonso"), tCuatro = G("A5", "cuatro"), tEquipos = G("A5", "equipos"), tDist = G("A5", "distintos");
    const tCamb = G("A5", "cambiando"), tTal = G("A5", "talento");
    const cambios = [-1e9, tAlo - 0.1, tCuatro - 0.05, tEquipos - 0.05, tDist - 0.05];

    return (T) => {
      const t0 = S0("A5");
      // Ojo que parpadea
      const sOjo = P(T, tOjo - 0.25, 0.4, E.back);
      tr(ojo, 960, 440, Math.max(0.001, sOjo));
      const pp = Math.abs(T - (tOjo + 0.35)) < 0.12 ? 0.08 : 1;
      parpado.setAttribute("transform", `scale(1 ${pp})`);
      op(ojo, F(T, t0, tPil - 0.2, 0.2, 0.3));
      tr(cascoGrande, 960, 440, P(T, tPil - 0.2, 0.45, E.back) * lerp(1, 0.4, P(T, tMismo - 0.2, 0.5, E.io)));
      op(cascoGrande, F(T, tPil - 0.2, tMismo - 0.1, 0.2, 0.4));
      // Autos
      let actual = 0;
      cambios.forEach((tc, i) => { if (T >= tc) actual = i; });
      const entra = P(T, tMismo - 0.1, 0.6, E.io);
      const adel = P(T, tVer - 0.1, 0.6, E.io);
      const shake = (T > tCamb - 0.1 && T < tCamb + 0.5) ? Math.sin(T * 60) * 4 : 0;
      pares.forEach((pz, i) => {
        const vis = i === actual ? 1 : 0;
        const flash = i === actual ? P(T, cambios[i], 0.2) : 0;
        tr(pz.front, lerp(-300, 520, entra) + 190 * adel + shake, 360, 1);
        tr(pz.back, lerp(-300, 520, entra) - 40, 520, 1);
        op(pz.front, vis * (i === 0 ? entra : flash));
        op(pz.back, vis * (i === 0 ? entra : flash));
      });
      op(nombreV, F(T, tVer - 0.1, tAlo - 0.15, 0.3, 0.2));
      op(nombreA, P(T, tAlo - 0.1, 0.3));
      fichas.forEach((f, i) => { set(f, { x: 320 + i * 86, y: 585 }); op(f, P(T, cambios[i + 1], 0.25)); });
      // Duelos
      duelos.forEach((d, i) => {
        const pr = P(T, tOcho - 0.2 + i * 0.05, 0.3, E.back);
        tr(d.dg, d.x, d.y, Math.max(0.001, pr));
        op(d.dg, pr > 0 ? (d.gano || T < tDiezF ? 1 : 0.35) : 0);
        d.yo.setAttribute("filter", d.gano && T >= tDiezF ? "url(#glow)" : "");
      });
      // Ranking
      op(rank, P(T, tCarr - 0.2, 0.4));
      barrasR.forEach((b, i) => {
        const v = D.duelos[i].pct * P(T, tCarr - 0.1 + i * 0.02, 0.6, E.out);
        set(b, { y: RY(v), height: Math.max(0, 800 - RY(v)), fill: i === 0 ? C.rb : i === 1 && T >= tAlo ? C.texto : C.gris });
      });
      set(etV, { x: RX(0) - 4, y: RY(D.duelos[0].pct) - 18 }); op(etV, P(T, tCarr + 0.4, 0.3));
      set(etA, { x: RX(1) + 26, y: RY(D.duelos[1].pct) + 30 }); op(etA, P(T, tAlo + 0.1, 0.3));
      // Sello de talento
      const ps = P(T, tTal - 0.1, 0.35, E.out);
      tr(sello, 560, 470, lerp(2.4, 1, ps), -8);
      op(sello, ps);
    };
  });

  // ================================================================= ACTO IV: J6
  acto("J6", "J6", (g) => {
    const X = (a) => 330 + (a - 2010) * 236, Y = (v) => 820 - v * 5.1;
    const ejes = el("g", {}, g);
    [0, 50, 100].forEach((v) => {
      el("path", { d: `M300 ${Y(v)} H1560`, stroke: v === 50 ? C.texto : C.linea, "stroke-width": v === 50 ? 3 : 2, "stroke-dasharray": v === 50 ? "12 9" : "" }, ejes);
      txt(ejes, v + "%", { x: 280, y: Y(v) + 9, "text-anchor": "end", "font-family": MONO, "font-size": 26, fill: C.tenue });
    });
    for (let a = 2010; a <= 2015; a++) txt(ejes, String(a), { x: X(a), y: 864, "font-family": MONO, "font-size": 26, fill: C.tenue });
    const banda14 = el("rect", { x: X(2014) - 70, y: Y(100) - 20, width: 140, height: Y(0) - Y(100) + 40, rx: 14, fill: C.texto, "fill-opacity": 0.06 }, g);
    const bandaF = el("rect", { x: X(2010) - 30, y: Y(100), width: X(2014) - X(2010) + 60, height: Y(81) - Y(100), rx: 10, fill: C.fer, "fill-opacity": 0.18 }, g);
    const da = (p) => D.duelos_anio.find((r) => r.piloto === p.n && r.year === p.y).pct;
    const vet = [2010, 2011, 2012, 2013, 2014].map((y) => [X(y), Y(da({ n: "Sebastian Vettel", y }))]);
    const alo = [2010, 2011, 2012, 2013, 2014, 2015].map((y) => [X(y), Y(da({ n: "Fernando Alonso", y }))]);
    function linea(pts, color) {
      const gl = el("g", {}, g);
      const segs = pts.slice(1).map((p, i) => el("path", { d: `M${pts[i][0]} ${pts[i][1]} L${p[0]} ${p[1]}`, stroke: color, "stroke-width": 8, "stroke-linecap": "round" }, gl));
      const dots = pts.map((p) => el("circle", { cx: p[0], cy: p[1], r: 11, fill: color, stroke: C.bg, "stroke-width": 4 }, gl));
      return { gl, segs, dots };
    }
    const lv = linea(vet, C.rb), lf = linea(alo.slice(0, 5), C.fer);
    const lm = el("path", { d: `M${alo[4][0]} ${alo[4][1]} L${alo[5][0]} ${alo[5][1]}`, stroke: C.mcl, "stroke-width": 8, "stroke-linecap": "round" }, g);
    const dm = el("circle", { cx: alo[5][0], cy: alo[5][1], r: 13, fill: C.mcl, stroke: C.bg, "stroke-width": 4 }, g);
    const estilo = { "font-family": DISP, "font-weight": 800, "font-style": "italic", "font-size": 50 };
    const nV = txt(g, "Vettel", Object.assign({ x: X(2010) - 36, y: vet[0][1] + 16, "text-anchor": "end", fill: "#6E9BEA" }, estilo));
    const nA = txt(g, "Alonso", Object.assign({ x: X(2010) - 36, y: alo[0][1] + 16, "text-anchor": "end" }, estilo));
    // Se ajusta para que no choquen: Vettel abajo de Alonso
    const nFer = txt(g, "Ferrari", Object.assign({ x: (X(2010) + X(2014)) / 2, y: Y(100) - 34, fill: C.fer }, estilo));
    const nMcl = txt(g, "McLaren", Object.assign({ x: X(2015) + 30, y: alo[5][1] + 70, fill: C.mcl }, estilo));
    const est = { "font-family": MONO, "font-weight": 800, "font-size": 40 };
    const v100 = txt(g, "100%", Object.assign({ x: vet[3][0], y: vet[3][1] - 34, fill: "#6E9BEA" }, est));
    const v21 = txt(g, "21%", Object.assign({ x: vet[4][0] - 30, y: vet[4][1] + 14, "text-anchor": "end", fill: "#6E9BEA" }, est));
    const a44 = txt(g, "44%", Object.assign({ x: alo[5][0] + 34, y: alo[5][1] + 12, "text-anchor": "start", fill: C.mcl }, est));
    // Autos nuevos en 2014
    const cambio = el("g", {}, g);
    const viejo = auto(cambio, C.rb, 220, "#FFD800");
    const nuevo = auto(cambio, "#1E3A8A", 220, "#E8002D");
    const yV = txt(cambio, "2013", { y: 80, "font-family": MONO, "font-size": 28, fill: C.tenue });
    const yN = txt(cambio, "2014", { y: 80, "font-family": MONO, "font-size": 28, fill: C.texto, "font-weight": 800 });
    // 1 de cada 5
    const cinco = [0, 1, 2, 3, 4].map((i) => {
      const c = el("circle", { r: 15, fill: i === 0 ? "#6E9BEA" : "#3A4050" }, g);
      return c;
    });

    const tMej = G("J6", "mejores"), tAuto = G("J6", "auto"), tVet = G("J6", "vettel"), t2013 = G("J6", "2013");
    const tSig = G("J6", "siguiente"), tNuev = G("J6", "nuevos"), tUna = G("J6", "una"), tCinco = G("J6", "cinco");
    const tAlo = G("J6", "alonso"), tDom = G("J6", "dominar"), tFer = G("J6", "ferrari"), tPerd = G("J6", "perder");
    const tMay = G("J6", "mayoria"), tMcl = G("J6", "mclaren");
    const segT = (t0, t1, n) => Array.from({ length: n }, (_, i) => lerp(t0, t1, i / n));

    return (T) => {
      op(ejes, P(T, tMej - 0.3, 0.5));
      // Vettel 2010→2013
      const tv = segT(tVet - 0.1, t2013 - 0.1, 3);
      lv.segs.forEach((s, i) => {
        const t0 = i < 3 ? tv[i] : tUna - 0.1;
        const pr = P(T, t0, i < 3 ? (t2013 - tVet) / 3 : 0.5, E.io);
        const [a, b] = [vet[i], vet[i + 1]];
        set(s, { d: `M${a[0]} ${a[1]} L${lerp(a[0], b[0], pr)} ${lerp(a[1], b[1], pr)}`, opacity: pr > 0 ? 1 : 0 });
      });
      lv.dots.forEach((d, i) => d.setAttribute("opacity", T >= (i === 0 ? tVet - 0.1 : i < 4 ? tv[i - 1] + (t2013 - tVet) / 3 : tUna + 0.35) ? 1 : 0));
      op(lv.gl, T < tAlo - 0.1 ? 1 : lerp(1, 0.3, P(T, tAlo - 0.1, 0.4)));
      op(nV, P(T, tVet - 0.1, 0.3) * (T < tAlo - 0.1 ? 1 : lerp(1, 0.4, P(T, tAlo - 0.1, 0.4))));
      op(v100, P(T, t2013 - 0.05, 0.3) * (T < tAlo ? 1 : 0.4));
      v100.setAttribute("transform", `translate(0 ${-10 * Math.sin(clamp((T - t2013) / 0.4) * Math.PI)})`);
      op(banda14, F(T, tSig - 0.2, tAlo - 0.1, 0.3, 0.4));
      op(v21, P(T, tCinco - 0.1, 0.3) * (T < tAlo ? 1 : 0.4));
      // Auto viejo → auto nuevo
      tr(cambio, 1720, 210);
      op(cambio, F(T, tAuto - 0.2, tAlo - 0.2, 0.3, 0.4));
      const sw = P(T, tNuev - 0.15, 0.5, E.io);
      tr(viejo, -260 * sw, 0); op(viejo, 1 - sw); op(yV, 1 - sw);
      tr(nuevo, 260 * (1 - sw), 0); op(nuevo, sw); op(yN, sw);
      cinco.forEach((c, i) => {
        set(c, { cx: vet[4][0] + 64 + i * 42, cy: vet[4][1] });
        c.setAttribute("opacity", P(T, tUna - 0.1 + i * 0.07, 0.2) * (T < tAlo ? 1 : 0.3));
        c.setAttribute("filter", i === 0 && T >= tCinco ? "url(#glow)" : "");
      });
      // Alonso: Ferrari 2010-2014 y McLaren 2015
      const ta = segT(tAlo, tFer, 4);
      lf.segs.forEach((s, i) => {
        const pr = P(T, ta[i], (tFer - tAlo) / 4, E.io);
        const [a, b] = [alo[i], alo[i + 1]];
        set(s, { d: `M${a[0]} ${a[1]} L${lerp(a[0], b[0], pr)} ${lerp(a[1], b[1], pr)}`, opacity: pr > 0 ? 1 : 0 });
      });
      lf.dots.forEach((d, i) => d.setAttribute("opacity", T >= (i === 0 ? tAlo - 0.05 : ta[i - 1] + (tFer - tAlo) / 4) ? 1 : 0));
      op(nA, P(T, tAlo - 0.1, 0.3));
      op(bandaF, P(T, tDom - 0.1, 0.4) * 1);
      op(nFer, P(T, tFer - 0.1, 0.3));
      const pm = P(T, tPerd - 0.1, 0.6, E.io);
      set(lm, { d: `M${alo[4][0]} ${alo[4][1]} L${lerp(alo[4][0], alo[5][0], pm)} ${lerp(alo[4][1], alo[5][1], pm)}`, opacity: pm > 0 ? 1 : 0 });
      dm.setAttribute("opacity", pm >= 1 ? 1 : 0);
      op(nMcl, P(T, tMcl - 0.1, 0.3));
      op(a44, P(T, tMcl, 0.3));
    };
  });

  // ================================================================= ACTO V: A7
  acto("A7", "A7", (g) => {
    const bal = balanza(g);
    const pesoP = el("g", {}, bal.izq.contenido), pesoA = el("g", {}, bal.der.contenido);
    const HP = 1.97 * 34, HA = 4.75 * 34;
    el("rect", { x: -60, y: -HP, width: 120, height: HP, rx: 8, fill: C.piloto }, pesoP);
    txt(pesoP, "1,97", { y: -HP / 2 + 13, "font-family": MONO, "font-weight": 800, "font-size": 36, fill: C.bg });
    el("rect", { x: -60, y: -HA, width: 120, height: HA, rx: 8, fill: C.auto }, pesoA);
    txt(pesoA, "4,75", { y: -HA / 2 + 13, "font-family": MONO, "font-weight": 800, "font-size": 36, fill: C.bg });
    const cascoB = casco(bal.izq.contenido, C.piloto, 130);
    const autoB = auto(bal.der.contenido, C.auto, 240);
    const ratio = el("g", {}, g);
    txt(ratio, "2,4", { x: 0, y: 0, "text-anchor": "end", "font-family": MONO, "font-weight": 800, "font-size": 110 });
    txt(ratio, "×", { x: 6, y: 0, "text-anchor": "start", "font-family": MONO, "font-weight": 800, "font-size": 110, fill: C.auto });

    // Carril: el piloto se mueve dentro de lo que el auto permite
    const carril = el("g", {}, g);
    el("rect", { x: 1010, y: 360, width: 800, height: 150, rx: 18, fill: "#141823", stroke: "#262A36", "stroke-width": 3 }, carril);
    for (let x = 1040; x < 1800; x += 60) el("rect", { x, y: 431, width: 30, height: 8, rx: 3, fill: "#262A36" }, carril);
    const paredes = [1240, 1580].map((x) => el("rect", { x: x - 8, y: 345, width: 16, height: 180, rx: 6, fill: C.auto }, carril));
    el("rect", { x: 1240, y: 360, width: 340, height: 150, fill: C.auto, opacity: 0.12 }, carril);
    const cascoC = casco(carril, C.piloto, 110);

    // Podio
    const podio = el("g", {}, g);
    [[-230, 120, "2"], [0, 190, "1"], [230, 80, "3"]].forEach(([x, h, n]) => {
      el("rect", { x: x - 110, y: -h, width: 220, height: h, rx: 6, fill: n === "1" ? "#2B3142" : "#1E2330", stroke: "#3E465B", "stroke-width": 2 }, podio);
      txt(podio, n, { x, y: -h + 70, "font-family": MONO, "font-weight": 800, "font-size": 60, fill: n === "1" ? "#E8C341" : C.tenue });
    });
    const autoPod = auto(podio, C.auto, 250);
    const cascoPod = casco(podio, C.piloto, 100);
    const titulo = el("text", { "text-anchor": "middle", "font-family": DISP, "font-weight": 800, "font-style": "italic", "font-size": 92, fill: C.texto }, g);
    const tw1 = el("tspan", {}, titulo); tw1.textContent = "Primero ";
    const tw2 = el("tspan", { fill: C.auto }, titulo); tw2.textContent = "el auto";

    // Línea de tiempo 1950–2024 y épocas
    const TX = (a) => 330 + (a - 1950) * (1260 / 74);
    const tiempo = el("g", {}, g);
    el("path", { d: `M${TX(1950)} 840 H${TX(2024)}`, stroke: "#3A4050", "stroke-width": 10, "stroke-linecap": "round" }, tiempo);
    [1950, 1970, 1990, 2010, 2024].forEach((a) => {
      el("path", { d: `M${TX(a)} 826 V854`, stroke: C.tenue, "stroke-width": 3 }, tiempo);
      txt(tiempo, String(a), { x: TX(a), y: 892, "font-family": MONO, "font-size": 26, fill: a >= 2010 ? C.texto : C.tenue });
    });
    const tramo = el("path", { d: "", stroke: C.piloto, "stroke-width": 16, "stroke-linecap": "round" }, tiempo);
    const viejo = autoViejo(g, 230), nuevo = auto(g, C.auto, 230);
    const distinto = txt(g, "≠", { "font-family": MONO, "font-weight": 800, "font-size": 110 });

    const tEnt = G("A7", "entonces"), tPesa = G("A7", "pesa"), tMas = G("A7", "mas", 1), tDos = G("A7", "dos");
    const tDif = G("A7", "diferencia"), tPerm = G("A7", "permite"), tEquipo = G("A7", "equipo"), tPrim = G("A7", "primero");
    const tAuto4 = G("A7", "auto", 4), tMed = G("A7", "medimos"), t2010 = G("A7", "2010"), t2024 = G("A7", "2024");
    const tEpo = G("A7", "epocas"), tComparar = G("A7", "comparar");

    return (T) => {
      const t0 = S0("A7");
      const ent = P(T, t0 + 0.1, 0.7, E.back);
      const lado = P(T, tDif - 0.2, 0.7, E.io);
      tr(bal.g, lerp(960, 520, lado), lerp(-600, 380, ent) + lerp(0, 20, lado), lerp(1, 0.72, lado));
      op(bal.g, 1 - P(T, tMed - 0.2, 0.5, E.in));
      // pesas que caen en "pesa"
      const caeP = P(T, tPesa - 0.15, 0.45, E.in), caeA = P(T, tPesa - 0.05, 0.45, E.in);
      tr(pesoP, 0, lerp(-500, 0, caeP)); op(pesoP, caeP > 0 ? 1 : 0);
      tr(pesoA, 0, lerp(-500, 0, caeA)); op(pesoA, caeA > 0 ? 1 : 0);
      tr(cascoB, 0, lerp(-58, -58 - HP, caeP));
      tr(autoB, 0, lerp(-40, -40 - HA, caeA));
      let tita = 14 * P(T, tMas - 0.15, 0.6, E.io);
      tita += 2 * Math.sin((T - tMas) * 9) * Math.exp(-(T - tMas) * 2.2) * (T > tMas ? 1 : 0);
      bal.set(tita);
      bal.der.brillo.setAttribute("opacity", 0.5 * P(T, tMas, 0.4));
      tr(ratio, lerp(1160, 690, lado), lerp(230, 220, lado), lerp(1, 0.75, lado) * P(T, tDos - 0.1, 0.45, E.back));
      op(ratio, (T >= tDos - 0.1 ? 1 : 0) * (1 - P(T, tMed - 0.2, 0.5, E.in)));
      // Carril
      op(carril, F(T, tDif - 0.1, tEquipo - 0.1, 0.4, 0.4));
      const fase = (T - tDif) * 5.2;
      const xC = 1410 + 140 * Math.sin(fase);
      tr(cascoC, xC, 435);
      const golpe = Math.abs(Math.sin(fase)) > 0.97 || (T > tPerm - 0.1 && T < tPerm + 0.5);
      paredes.forEach((p) => p.setAttribute("filter", golpe ? "url(#glowF)" : ""));
      // Podio y título
      const cen = P(T, tMed - 0.2, 0.7, E.io);
      tr(podio, lerp(1410, 960, cen), lerp(720, 620, cen), lerp(1, 0.9, cen));
      op(podio, P(T, tPrim - 0.3, 0.4));
      tr(autoPod, 0, lerp(-700, -190 - 48, P(T, tAuto4 - 0.25, 0.5, E.back)));
      op(autoPod, T >= tAuto4 - 0.25 ? 1 : 0);
      tr(cascoPod, -230, lerp(-700, -120 - 50, P(T, tPrim - 0.05, 0.5, E.back)));
      op(cascoPod, T >= tPrim - 0.05 ? 1 : 0);
      set(titulo, { x: lerp(1410, 960, cen), y: lerp(280, 205, cen) });
      op(tw1, P(T, tPrim - 0.1, 0.25)); op(tw2, P(T, tAuto4 - 0.1, 0.25));
      titulo.style.display = T >= tPrim - 0.1 ? "" : "none";
      // Tiempo
      op(tiempo, P(T, tMed - 0.1, 0.4));
      const tr0 = P(T, t2010 - 0.1, 0.25);
      set(tramo, { d: `M${TX(2010)} 840 H${lerp(TX(2010), TX(2024), P(T, t2024 - 0.15, 0.4, E.io)) + 0.1}`, opacity: tr0 });
      const ep = P(T, tComparar - 0.2, 0.5, E.back);
      tr(viejo, TX(1958), 740, ep); op(viejo, ep > 0 ? 1 : 0);
      tr(nuevo, TX(2017), 740, P(T, tComparar, 0.5, E.back)); op(nuevo, T >= tComparar ? 1 : 0);
      set(distinto, { x: (TX(1958) + TX(2017)) / 2, y: 776 });
      op(distinto, P(T, tEpo - 0.1, 0.3));
    };
  });

  // ================================================================= ACTO VI: J8
  acto("J8", "J8", (g) => {
    // Ventana de código y asistente
    const code = el("g", {}, g);
    el("rect", { x: -280, y: -180, width: 560, height: 360, rx: 22, fill: "#141823", stroke: "#2E3442", "stroke-width": 3 }, code);
    el("rect", { x: -280, y: -180, width: 560, height: 52, rx: 22, fill: "#1E2330" }, code);
    ["#FF5F57", "#FEBC2E", "#28C840"].forEach((c, i) => el("circle", { cx: -246 + i * 30, cy: -154, r: 9, fill: c }, code));
    const lineas = [[-240, 200, C.piloto], [-200, 260, C.texto], [-200, 170, C.auto], [-240, 230, "#E8C341"], [-200, 300, C.texto], [-200, 140, C.piloto]]
      .map(([x, w, c], i) => ({ r: el("rect", { x, y: -96 + i * 44, height: 16, rx: 8, fill: c, opacity: 0.85 }, code), w }));
    const chispa = el("g", {}, g);
    for (let i = 0; i < 6; i++) el("path", { d: "M0 -70 C8 -20 8 -20 0 0 C-8 -20 -8 -20 0 -70 Z", fill: C.claude, transform: `rotate(${i * 30})` }, chispa);
    for (let i = 0; i < 6; i++) el("path", { d: "M0 -70 C8 -20 8 -20 0 0 C-8 -20 -8 -20 0 -70 Z", fill: C.claude, transform: `rotate(${180 + i * 30})` }, chispa);
    const enlace = el("path", { d: "M940 430 C1000 430 1020 330 1080 330", fill: "none", stroke: C.claude, "stroke-width": 4, "stroke-dasharray": "10 10" }, g);
    // Cifras que se tildan
    const CIFRAS = [["4,75", C.auto], ["1,97", C.piloto], ["2,4×", C.texto], ["81,9%", "#6E9BEA"], ["77,7%", C.texto]];
    const cifras = CIFRAS.map(([s, c], i) => {
      const cg = el("g", {}, g);
      txt(cg, s, { x: 0, y: 0, "text-anchor": "end", "font-family": MONO, "font-weight": 800, "font-size": 58, fill: c });
      const t = tilde(cg, C.dinero, 1.5); tr(t.g, 60, -20);
      return { cg, t, y: 270 + i * 92 };
    });
    // Íconos: notebook, informe y web
    const iconos = [0, 1, 2].map((i) => {
      const ig = el("g", {}, g);
      el("rect", { x: -120, y: -150, width: 240, height: 300, rx: 18, fill: "#141823", stroke: [C.piloto, C.texto, C.auto][i], "stroke-width": 5 }, ig);
      if (i === 0) { // notebook: celdas con código y un gráfico
        [-100, -40].forEach((y, k) => { el("rect", { x: -92, y, width: 184, height: 46, rx: 8, fill: "#1E2330" }, ig); el("path", { d: `M-80 ${y + 23} l12 -10 v20 z`, fill: C.piloto }, ig); el("rect", { x: -56, y: y + 18, width: 110 - k * 30, height: 10, rx: 5, fill: C.tenue }, ig); });
        [30, 60, 45, 85].forEach((h, k) => el("rect", { x: -80 + k * 44, y: 120 - h, width: 30, height: h, rx: 4, fill: k === 3 ? C.auto : C.piloto }, ig));
      } else if (i === 1) { // informe: hoja con texto y figura
        el("rect", { x: -80, y: -118, width: 160, height: 18, rx: 6, fill: C.texto }, ig);
        for (let k = 0; k < 4; k++) el("rect", { x: -80, y: -82 + k * 24, width: 160 - (k % 2) * 40, height: 10, rx: 5, fill: C.tenue }, ig);
        el("path", { d: "M-80 110 L-40 60 L0 80 L40 30 L80 50", fill: "none", stroke: C.auto, "stroke-width": 6, "stroke-linejoin": "round" }, ig);
        el("path", { d: "M-80 120 L-40 100 L0 105 L40 92 L80 98", fill: "none", stroke: C.piloto, "stroke-width": 6, "stroke-linejoin": "round" }, ig);
      } else { // web: navegador con barras
        el("rect", { x: -120, y: -150, width: 240, height: 40, rx: 18, fill: "#1E2330" }, ig);
        el("rect", { x: -70, y: -138, width: 170, height: 16, rx: 8, fill: "#2E3442" }, ig);
        el("circle", { cx: -96, cy: -130, r: 8, fill: C.auto }, ig);
        const a = auto(ig, C.auto, 170); tr(a, 0, -50);
        [70, 110, 50].forEach((h, k) => el("rect", { x: -80 + k * 60, y: 125 - h, width: 40, height: h, rx: 5, fill: k === 1 ? C.auto : C.piloto }, ig));
      }
      return ig;
    });
    const carpeta = el("g", {}, g);
    el("path", { d: "M-170 -110 H-50 L-20 -80 H170 Q186 -80 186 -64 V110 Q186 126 170 126 H-170 Q-186 126 -186 110 V-94 Q-186 -110 -170 -110 Z", fill: "#232835", stroke: C.tenue, "stroke-width": 4 }, carpeta);
    el("path", { d: "M-186 -40 H186", stroke: C.tenue, "stroke-width": 3 }, carpeta);
    const links = el("g", {}, g);
    txt(links, "github.com/Joaquin-Lobato-Adinolfi/TP_LMC_F1_Analysis", { x: 960, y: 0, "font-family": MONO, "font-size": 32, fill: C.texto });
    txt(links, "piloto-o-auto-f1.vercel.app", { x: 960, y: 54, "font-family": MONO, "font-size": 32, fill: C.piloto });
    // Bandera a cuadros y gracias
    const bandera = el("g", {}, g);
    el("rect", { x: -6, y: -10, width: 12, height: 240, rx: 4, fill: C.tenue }, bandera);
    const celdas = [];
    for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++)
      celdas.push({ r: el("rect", { width: 27, height: 27, fill: (i + j) % 2 ? C.bg : C.texto }, bandera), i, j });
    const gracias = txt(g, "¡Gracias!", { x: 960, y: 520, "font-family": DISP, "font-weight": 800, "font-style": "italic", "font-size": 140 });
    const nombres = txt(g, "Agustín  ·  Joaquín", { x: 960, y: 600, "font-family": SANS, "font-weight": 600, "font-size": 44, fill: C.tenue });

    const tPy = G("J8", "python"), tCl = G("J8", "claude"), tRev2 = G("J8", "revisamos", 2), tCada = G("J8", "cada");
    const tManoF = G("J8", "mano", 1, true), tNb = G("J8", "notebook"), tInf = G("J8", "informe"), tWeb = G("J8", "web");
    const tRepo = G("J8", "repositorio"), tGr = G("J8", "gracias");

    return (T) => {
      const t0 = S0("J8");
      const salida1 = tNb - 0.25;
      tr(code, 660, 450, P(T, Math.min(tPy - 0.3, t0 + 0.6), 0.5, E.back));
      op(code, F(T, Math.min(tPy - 0.3, t0 + 0.6), salida1, 0.3, 0.35));
      lineas.forEach((l, i) => set(l.r, { width: l.w * P(T, tPy - 0.2 + i * 0.12, 0.35) }));
      tr(chispa, 1110, 330, 0.9 * P(T, tCl - 0.15, 0.4, E.back), (T - tCl) * 40);
      op(chispa, F(T, tCl - 0.15, salida1, 0.2, 0.35));
      enlace.setAttribute("stroke-dashoffset", -T * 40);
      op(enlace, F(T, tCl, salida1, 0.3, 0.35));
      cifras.forEach((c, i) => {
        tr(c.cg, 1600, c.y);
        op(c.cg, F(T, tRev2 - 0.1 + i * 0.06, salida1, 0.25, 0.35));
        c.t.set(P(T, lerp(tCada - 0.1, tManoF - 0.1, i / 4), 0.25));
      });
      // Íconos
      const junta = P(T, tRepo - 0.15, 0.6, E.io);
      [tNb, tInf, tWeb].forEach((tc, i) => {
        const x = 540 + i * 420;
        tr(iconos[i], lerp(x, 960 + (i - 1) * 60, junta), lerp(450, 430, junta), lerp(1, 0.32, junta) * P(T, tc - 0.15, 0.45, E.back));
        op(iconos[i], (T >= tc - 0.15 ? 1 : 0) * (1 - P(T, tRepo + 0.35, 0.25)));
      });
      const ac = P(T, tGr - 0.2, 0.6, E.io);
      tr(carpeta, lerp(960, 420, ac), lerp(470, 735, ac), lerp(1, 0.38, ac) * P(T, tRepo - 0.05, 0.45, E.back));
      op(carpeta, T >= tRepo - 0.05 ? 1 : 0);
      tr(links, lerp(0, 90, ac), lerp(700, 725, ac));
      op(links, P(T, tRepo + 0.3, 0.4));
      // Bandera
      tr(bandera, 860, 160, P(T, tGr - 0.25, 0.5, E.back));
      op(bandera, T >= tGr - 0.25 ? 1 : 0);
      celdas.forEach((c) => {
        const ola = Math.sin(c.i * 0.7 - T * 6) * 9 * (c.i / 8);
        set(c.r, { x: 6 + c.i * 27, y: c.j * 27 + ola });
      });
      op(gracias, P(T, tGr - 0.1, 0.4)); gracias.setAttribute("transform", `translate(0 ${20 * (1 - P(T, tGr - 0.1, 0.4))})`);
      op(nombres, P(T, tGr + 0.3, 0.4));
    };
  });

  // ------------------------------------------------- barrido a cuadros entre actos
  const barrido = el("g");
  const franja = el("rect", { x: 0, y: 0, width: 160, height: 1080, fill: "url(#cuadros)" }, barrido);
  const viñeta = el("rect", { width: 1920, height: 1080, fill: "url(#vineta)", "pointer-events": "none" });
  const CORTES = ACTOS.slice(1).map((a) => S0(a.desde));
  const BARRIDO = 0.75;

  // ----------------------------------------------------------- vuelta (progreso)
  const vuelta = el("g");
  el("path", { d: "M80 38 H1840", stroke: "#1E2330", "stroke-width": 6, "stroke-linecap": "round" }, vuelta);
  const avance = el("path", { d: "", stroke: C.auto, "stroke-width": 6, "stroke-linecap": "round" }, vuelta);
  TI.forEach((e) => el("path", { d: `M${80 + (1760 * e.inicio) / TOTAL} 30 V46`, stroke: "#3A4050", "stroke-width": 3 }, vuelta));
  const autito = auto(vuelta, C.auto, 64);

  // ----------------------------------------------------------------- subtítulos
  const sub = el("g");
  const subFondo = el("rect", { y: 952, height: 76, rx: 16, fill: "#000", "fill-opacity": 0.55 }, sub);
  const subTxt = el("text", { x: 960, y: 1004, "text-anchor": "middle", "font-family": SANS, "font-weight": 600, "font-size": 42, fill: C.texto }, sub);
  const subVoz = el("text", { x: 960, y: 940, "text-anchor": "middle", "font-family": MONO, "font-size": 20, "letter-spacing": 4, fill: C.tenue }, sub);
  let subActual = "";
  let spans = [];
  function subtitulos(T) {
    const e = TI.find((x) => T >= x.inicio && T < x.inicio + x.dur) || TI[TI.length - 1];
    const t = T - e.inicio;
    let idx = -1;
    e.subs.forEach((s, i) => { if (t >= e.palabras[s[0]].t - 0.15) idx = i; });
    const s = idx >= 0 ? e.subs[idx] : null;
    const finS = s ? e.palabras[s[s.length - 1]].f + 0.7 : 0;
    if (!s || t > finS) { op(sub, 0); return; }
    const clave = e.id + idx;
    if (clave !== subActual) {
      subActual = clave;
      while (subTxt.firstChild) subTxt.removeChild(subTxt.firstChild);
      spans = s.map((i, k) => {
        const sp = el("tspan", {}, subTxt);
        sp.textContent = (k ? " " : "") + e.palabras[i].w;
        return { sp, t: e.palabras[i].t };
      });
      const w = subTxt.getComputedTextLength();
      set(subFondo, { x: 960 - w / 2 - 30, width: w + 60 });
      subVoz.textContent = e.voz.toUpperCase();
    }
    spans.forEach((x) => x.sp.setAttribute("fill-opacity", t >= x.t - 0.05 ? 1 : 0.5));
    op(sub, 1);
  }

  // ------------------------------------------------------------------ render(T)
  window.TOTAL = TOTAL;
  window.render = function (T) {
    ACTOS.forEach((a, i) => {
      const ini = S0(a.desde), fin = S1(a.hasta);
      const visible = T >= ini - BARRIDO && T < fin + BARRIDO;
      a.g.style.display = visible ? "" : "none";
      if (!visible) return;
      // recorte durante el barrido: el acto nuevo entra desde la izquierda
      let x0 = 0, x1 = 1920;
      if (i > 0) x1 = lerp(-160, 2080, P(T, ini - BARRIDO / 2, BARRIDO, E.io));
      if (i < ACTOS.length - 1) x0 = lerp(-160, 2080, P(T, fin - BARRIDO / 2, BARRIDO, E.io));
      // x1: borde derecho visible del acto (entrando); x0: borde izquierdo (saliendo)
      const izq = Math.max(0, x0), der = Math.min(1920, i > 0 && T < ini + BARRIDO / 2 ? x1 : 1920);
      set(a.rect, { x: izq, width: Math.max(0, der - izq) });
      a.draw(T);
    });
    // franja a cuadros
    let fx = null;
    CORTES.forEach((c) => { if (T >= c - BARRIDO / 2 && T <= c + BARRIDO / 2) fx = lerp(-160, 2080, P(T, c - BARRIDO / 2, BARRIDO, E.io)); });
    op(barrido, fx === null ? 0 : 1);
    if (fx !== null) set(franja, { x: fx - 80 });
    // progreso
    const pr = clamp(T / TOTAL);
    set(avance, { d: `M80 38 H${80 + 1760 * pr}` });
    tr(autito, 80 + 1760 * pr, 38);
    subtitulos(T);
  };
  window.render(0);
})();
