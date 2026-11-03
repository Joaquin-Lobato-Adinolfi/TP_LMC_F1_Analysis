/* Web del TP: ¿pesa más el piloto o el auto? (F1 2010-2024)
   Datos: window.F1_DATA (docs/data/f1_data.js), escuderías: window.F1_EQUIPOS / F1_LOGOS. */
(function () {
  "use strict";

  const D = window.F1_DATA;
  const EQ = window.F1_EQUIPOS;
  const LOGOS = window.F1_LOGOS;
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nf1 = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nf0 = new Intl.NumberFormat("es-AR");
  const nf2 = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const $ = (s) => document.querySelector(s);
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  const ERAS = [
    { desde: 2010, hasta: 2013, nombre: "V8 atmosféricos" },
    { desde: 2014, hasta: 2021, nombre: "Turbo híbrido" },
    { desde: 2022, hasta: 2024, nombre: "Efecto suelo" },
  ];
  const era = (y) => ERAS.find((e) => y >= e.desde && y <= e.hasta).nombre;

  const ISO = {
    American: "US", Argentinian: "AR", Australian: "AU", Belgian: "BE", Brazilian: "BR", British: "GB", Canadian: "CA",
    Chinese: "CN", Danish: "DK", Dutch: "NL", Finnish: "FI", French: "FR", German: "DE", Indian: "IN", Indonesian: "ID",
    Italian: "IT", Japanese: "JP", Mexican: "MX", Monegasque: "MC", "New Zealander": "NZ", Polish: "PL", Russian: "RU",
    Spanish: "ES", Swedish: "SE", Swiss: "CH", Thai: "TH", Venezuelan: "VE",
  };
  const bandera = (nac) => {
    const c = ISO[(nac || "").trim()];
    return c ? String.fromCodePoint(...[...c].map((ch) => 0x1f1a5 + ch.charCodeAt(0))) : "🏁";
  };
  const codigo = (p) => p.codigo || p.piloto.split(" ").slice(-1)[0].slice(0, 3).toUpperCase();

  // Texto oscuro o claro según el color de fondo
  const contraste = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return l > 0.55 ? "#0d0f14" : "#ffffff";
  };

  function logo(ref, size = 20) {
    const e = EQ[ref];
    if (!e) return "";
    if (e.logo && LOGOS[e.logo]) {
      const regla = e.logo === "mercedes" ? ' fill-rule="evenodd"' : "";
      return `<svg class="logo" viewBox="0 0 24 24" width="${size}" height="${size}" role="img" aria-label="${e.nombre}" style="color:${e.color}"><title>${e.nombre}</title><path fill="currentColor"${regla} d="${LOGOS[e.logo]}"/></svg>`;
    }
    return `<span class="chapa" title="${e.nombre}" style="background:${e.color};color:${contraste(e.color)}">${e.sigla}</span>`;
  }

  // Auto de F1 visto desde arriba (dibujo en js/auto.js), con un acento por equipo
  const ACENTO = { "#3671C6": "#f5c518", "#E8002D": "#ffe14d", "#27F4D2": "#c9ccd3", "#FF8000": "#47c7fc" };
  function autoSVG(color, id) {
    return window.F1_AUTO(color, id, ACENTO[color] || "#f5f6f8");
  }

  // Animación al entrar en pantalla. El contenido queda visible si no hay IntersectionObserver.
  function alEntrar(el, fn, umbral = 0.25) {
    if (!el) return;
    if (quieto || !("IntersectionObserver" in window)) { fn(true); return; }
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => { if (e.isIntersecting) { io.disconnect(); fn(false); } });
    }, { threshold: umbral });
    io.observe(el);
  }

  /* ---------------- Logo F1 en la barra ---------------- */
  $("#logo-f1").innerHTML = `<path fill="currentColor" d="${LOGOS.f1}"/>`;

  /* ---------------- Largada ---------------- */
  function largada(listo) {
    const caja = $("#largada");
    let ya = false;
    let saltada = false;
    try { saltada = sessionStorage.getItem("largada-vista") === "1"; } catch (e) { /* sin storage */ }
    const terminar = () => {
      if (ya) return; ya = true;
      try { sessionStorage.setItem("largada-vista", "1"); } catch (e) { /* sin storage */ }
      caja.classList.add("fuera");
      setTimeout(() => { document.documentElement.classList.remove("js-largada"); }, 650);
      listo();
    };
    if (quieto || saltada || location.hash) { listo(); return; }
    document.documentElement.classList.add("js-largada");
    $("#saltar").addEventListener("click", terminar);
    const cols = caja.querySelectorAll(".columna-luz");
    const ley = $("#leyenda-largada");
    cols.forEach((c, i) => setTimeout(() => { if (!ya) c.classList.add("on"); }, 500 + i * 650));
    const apagar = 500 + 5 * 650 + 300 + Math.random() * 600;
    setTimeout(() => {
      if (ya) return;
      cols.forEach((c) => c.classList.remove("on"));
      ley.textContent = "¡Luces fuera!";
      setTimeout(terminar, 650);
    }, apagar);
  }

  /* ---------------- Hero ---------------- */
  function hero(animar) {
    const r = D.resumen;
    const pa = (r.efecto_auto / (r.efecto_auto + r.efecto_piloto)) * 100;
    $("#pct-auto").textContent = nf2.format(r.efecto_auto);
    $("#pct-piloto").textContent = nf2.format(r.efecto_piloto);
    $("#ratio-hero").textContent = nf1.format(r.ratio);
    $("#seg-auto").style.width = pa + "%";

    const fichas = [
      [r.carreras, "Grandes Premios"],
      [r.pilotos, "Pilotos"],
      [r.escuderias, "Escuderías"],
      [r.resultados, "Resultados de carrera"],
      [r.pares, "Duelos entre compañeros", "morado"],
      [r.pct_terminaron, "% de autos que terminaron", "verde"],
    ];
    $("#tablero").innerHTML = fichas.map(([v, t, c]) =>
      `<div><span class="valor num ${c || ""}" data-v="${v}">${nf0.format(v)}</span><span class="etiqueta">${t}</span></div>`).join("");

    const autoHero = $("#auto-hero");
    if (!autoHero.querySelector("svg")) autoHero.insertAdjacentHTML("beforeend", autoSVG(css("--rojo"), "hero"));

    if (!animar) return;
    // Contadores y barra que se llenan
    const seg = $("#seg-auto");
    seg.style.transition = "none"; seg.style.width = "50%";
    document.querySelectorAll("#tablero .valor").forEach((el) => {
      const v = +el.dataset.v; const t0 = performance.now(); const dur = 1400;
      const paso = (t) => {
        const k = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - k, 3);
        el.textContent = v % 1 ? nf1.format(v * e) : nf0.format(Math.round(v * e));
        if (k < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    });
    requestAnimationFrame(() => requestAnimationFrame(() => { seg.style.transition = ""; seg.style.width = pa + "%"; }));
    autoHero.classList.add("corre");
  }

  // Estelas de velocidad de fondo
  function estelas() {
    const cv = $("#estelas");
    const ctx = cv.getContext("2d");
    let w, h, lineas;
    const medir = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lineas = Array.from({ length: Math.round(w / 18) }, () => nueva(true));
    };
    const colores = ["#e10600", "#3671C6", "#27F4D2", "#FF8000", "#ffffff"];
    const nueva = (inicio) => ({
      x: inicio ? Math.random() * w : -200, y: Math.random() * h, v: 4 + Math.random() * 14,
      l: 40 + Math.random() * 180, c: colores[Math.floor(Math.random() * colores.length)], a: 0.08 + Math.random() * 0.25,
    });
    const dibujar = () => {
      ctx.clearRect(0, 0, w, h);
      for (const s of lineas) {
        const gr = ctx.createLinearGradient(s.x - s.l, 0, s.x, 0);
        gr.addColorStop(0, "transparent"); gr.addColorStop(1, s.c);
        ctx.globalAlpha = s.a; ctx.strokeStyle = gr; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(s.x - s.l, s.y); ctx.lineTo(s.x, s.y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    medir();
    addEventListener("resize", medir);
    if (quieto) { dibujar(); return; }
    let visible = true;
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(cv);
    const bucle = () => {
      if (visible) {
        for (const s of lineas) { s.x += s.v; if (s.x - s.l > w) Object.assign(s, nueva(false)); }
        dibujar();
      }
      requestAnimationFrame(bucle);
    };
    bucle();
  }

  /* ---------------- Barra superior: progreso y sección activa ---------------- */
  function barra() {
    const prog = $("#progreso");
    const links = [...document.querySelectorAll(".barra nav a")];
    const secciones = links.map((a) => document.querySelector(a.getAttribute("href")));
    const act = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      prog.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      let i = -1;
      secciones.forEach((s, k) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) i = k; });
      links.forEach((a, k) => a.classList.toggle("activo", k === i));
    };
    addEventListener("scroll", act, { passive: true });
    act();
  }

  /* ---------------- Vuelta 1: torre de tiempos ---------------- */
  function torre() {
    const anios = [...new Set(D.temporadas.map((t) => t.year))].sort();
    const filasEl = $("#filas");
    const panel = $("#panel-anio");
    const ALTO = 34;
    const nodos = new Map();
    let anioActual = 2010;
    let reproduciendo = null;

    $("#anios").innerHTML = anios.map((y) => `<button type="button" data-y="${y}" aria-pressed="false">${y}</button>`).join("");
    $("#anios").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      parar(); mostrar(+b.dataset.y);
    });

    function mostrar(y) {
      anioActual = y;
      document.querySelectorAll("#anios button").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.y === y)));
      const filas = D.temporadas.filter((t) => t.year === y).sort((a, b) => a.pos - b.pos);
      filasEl.style.height = filas.length * ALTO + "px";
      const vivos = new Set();
      filas.forEach((f, i) => {
        const clave = f.piloto + "|" + f.equipo;
        vivos.add(clave);
        let n = nodos.get(clave);
        const e = EQ[f.equipo];
        const dif = f.pos - f.pos_comp;
        if (!n) {
          n = document.createElement("div");
          n.className = "fila";
          n.dataset.equipo = f.equipo;
          n.style.transform = `translateY(${filas.length * ALTO}px)`;
          n.style.opacity = "0";
          filasEl.appendChild(n);
          nodos.set(clave, n);
        }
        n.innerHTML = `<span class="p">${i + 1}</span><span class="franja" style="background:${e.color}"></span>${logo(f.equipo, 22)}
          <span class="quien"><span class="cod">${codigo(f)}</span><span class="nom">${f.piloto} · ${e.nombre}</span></span>
          <span class="pos">${nf1.format(f.pos)}</span>
          <span class="vs ${dif < 0 ? "adelante" : "atras"}">${dif < 0 ? "▲" : "▼"} ${nf1.format(Math.abs(dif))}</span>`;
        n.title = `${f.piloto} (${e.nombre}): ${nf1.format(f.pos)} de media; su compañero ${f.comp}: ${nf1.format(f.pos_comp)}`;
        requestAnimationFrame(() => { n.style.transform = `translateY(${i * ALTO}px)`; n.style.opacity = ""; });
      });
      nodos.forEach((n, clave) => {
        if (!vivos.has(clave)) { n.style.opacity = "0"; setTimeout(() => { if (n.style.opacity === "0") { n.remove(); nodos.delete(clave); } }, 500); }
      });

      // Panel lateral del año
      const p = D.efectos.find((d) => d.year === y);
      const autosAnio = D.autos.filter((a) => a.year === y).sort((a, b) => a.pos - b.pos);
      const mejor = autosAnio[0];
      const pegados = (() => {
        const porEquipo = {};
        filas.forEach((f, i) => { (porEquipo[f.equipo] = porEquipo[f.equipo] || []).push(i); });
        const pares = Object.values(porEquipo).filter((v) => v.length === 2);
        return { n: pares.filter((v) => Math.abs(v[0] - v[1]) <= 3).length, de: pares.length };
      })();
      panel.innerHTML = `
        <div><span class="grande">${y}</span><br><span class="era">${era(y)}</span></div>
        <div class="dato"><span class="etiqueta">Efecto del auto / del piloto</span><span class="num"><span style="color:var(--rojo-luz)">${nf2.format(p.auto)}</span> / <span style="color:var(--celeste)">${nf2.format(p.piloto)}</span></span><span class="etiqueta">el auto pesa ${nf1.format(p.ratio)} veces más</span></div>
        <div class="dato"><span class="etiqueta">Mejor auto del año</span><span style="display:flex;align-items:center;gap:10px;font-size:1.2rem;font-weight:700">${logo(mejor.equipo, 28)} ${EQ[mejor.equipo].nombre}</span><span class="etiqueta">posición media ${nf1.format(mejor.pos)}</span></div>
        <div class="dato"><span class="etiqueta">Compañeros a 3 lugares o menos</span><span class="num" style="color:var(--verde)">${pegados.n} de ${pegados.de}</span></div>`;
    }

    // Resaltar compañeros
    filasEl.addEventListener("pointerover", (e) => {
      const f = e.target.closest(".fila"); if (!f) return;
      filasEl.querySelectorAll(".fila").forEach((n) => n.classList.toggle("atenuada", n.dataset.equipo !== f.dataset.equipo));
    });
    filasEl.addEventListener("pointerleave", () => filasEl.querySelectorAll(".fila").forEach((n) => n.classList.remove("atenuada")));

    const play = $("#play");
    function parar() { clearInterval(reproduciendo); reproduciendo = null; play.textContent = "▶ Play 2010 → 2024"; }
    play.addEventListener("click", () => {
      if (reproduciendo) { parar(); return; }
      let i = anioActual === anios[anios.length - 1] ? 0 : anios.indexOf(anioActual);
      mostrar(anios[i]);
      play.textContent = "❚❚ Pausa";
      reproduciendo = setInterval(() => {
        i += 1;
        if (i >= anios.length) { parar(); return; }
        mostrar(anios[i]);
      }, 1700);
    });

    mostrar(2010);
  }

  /* ---------------- Tooltip compartido ---------------- */
  function tooltip(cont) {
    const t = document.createElement("div");
    t.className = "tooltip"; cont.appendChild(t);
    return {
      mostrar(html, x, y) {
        t.innerHTML = html; t.classList.add("visible");
        const w = cont.clientWidth; const tw = t.offsetWidth;
        t.style.left = Math.max(0, Math.min(w - tw, x + 14)) + "px";
        t.style.top = Math.max(0, y - t.offsetHeight - 10) + "px";
      },
      ocultar() { t.classList.remove("visible"); },
    };
  }

  /* ---------------- Vuelta 0: los datos (exploración y filtros del notebook) ---------------- */
  function formacion() {
    const X = D.exploracion;
    $("#tablas").innerHTML = X.tablas.map((t) =>
      `<div><span class="nom">${t.nombre}.csv</span><span class="dim">${nf0.format(t.filas)} <small>× ${t.columnas} col.</small></span><p>${t.descripcion}</p></div>`).join("");

    const f = X.filtro;
    $("#estados-validos").textContent = f.estados_validos;
    const pct = (f.terminaron / f.total) * 100;
    $("#embudo").innerHTML = `
      <div class="barra-emb" role="img" aria-label="${nf0.format(f.terminaron)} de ${nf0.format(f.total)} resultados terminaron la carrera">
        <div class="si" id="emb-si" style="width:${pct}%"></div><div class="no"></div></div>
      <div class="cifras"><span style="color:var(--verde)"><b>${nf0.format(f.terminaron)}</b>terminaron (${nf1.format(pct)}%)</span>
        <span style="color:#ff6b6b;text-align:right"><b>${nf0.format(f.no_terminaron)}</b>no terminaron</span></div>
      <span class="etiqueta">de ${nf0.format(f.total)} resultados de carrera</span>`;
    const maxM = Math.max(...f.motivos.map((m) => m.n));
    $("#motivos").innerHTML = f.motivos.map((m) =>
      `<div class="motivo"><span>${m.motivo}</span><span class="rielm"><span style="width:${(m.n / maxM) * 100}%"></span></span><span class="n">${m.n}</span></div>`).join("");
    alEntrar($("#embudo"), (est) => {
      if (est) return;
      const b = $("#emb-si"); b.style.transition = "none"; b.style.width = "0%";
      requestAnimationFrame(() => requestAnimationFrame(() => { b.style.transition = ""; b.style.width = pct + "%"; }));
    });

    const a = X.atipicos[0];
    if (a) {
      $("#atipico").innerHTML = `<span class="etiqueta">El piloto que sobra</span>
        <div class="cara"><span class="cod">${codigo(a)}</span><span><b>${a.piloto}</b> ${bandera(a.nac)}</span></div>
        <p>En clasificación hay ${X.pilotos_quali} pilotos, pero en carreras terminadas hay ${X.pilotos_carrera}. El que falta es ${a.piloto}: corrió solo el GP de Bélgica 2014 con Caterham y abandonó en la primera vuelta por una falla de la unidad de potencia. Lo encontramos con <span class="mono">np.setdiff1d</span> y queda como dato atípico.</p>`;
    }
    const r = X.carreras_por_piloto_resumen;
    $("#n-pilotos").textContent = r.count;
    $("#tf-carreras").textContent = `${nf0.format(f.terminaron)} filas × 11 col.`;
    $("#tf-quali").textContent = `${nf0.format(X.tablas.find((t) => t.nombre === "qualifying").filas)} filas × 11 col.`;
    const top = X.carreras_por_piloto;
    $("#lectura-carreras").innerHTML = `<b>Lectura.</b> La mitad de los pilotos terminó ${nf0.format(r["50%"])} carreras o menos, pero el promedio es ${nf1.format(r.mean)}. ` +
      `La media supera a la mediana porque unos pocos pilotos con carreras muy largas, como ${top[0].piloto} (${top[0].n}) o ${top[1].piloto} (${top[1].n}), tiran el promedio para arriba: la distribución tiene cola a la derecha. ` +
      `Por eso, para comparar pilotos el notebook exige después un mínimo de ${D.resumen.min_duelos} duelos con el compañero (la mediana).`;

    document.querySelectorAll("[data-cp]").forEach((b) => b.addEventListener("click", () => {
      document.querySelectorAll("[data-cp]").forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
      modoCarreras = b.dataset.cp; graficoCarreras(!quieto);
    }));
  }

  function graficoTerminaron(animar) {
    const cont = $("#g-terminaron");
    cont.innerHTML = "";
    const datos = D.exploracion.terminaron_por_anio;
    const W = cont.clientWidth; const H = Math.max(220, Math.min(280, W * 0.55));
    const m = { t: 20, r: 12, b: 30, l: 42 };
    const x = d3.scaleLinear().domain([2010, 2024]).range([m.l, W - m.r]);
    const y = d3.scaleLinear().domain([60, 100]).range([H - m.b, m.t]);
    const svg = d3.select(cont).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img")
      .attr("aria-label", "Porcentaje de autos que terminaron la carrera por temporada");
    svg.append("g").attr("class", "grilla").attr("transform", `translate(${m.l},0)`)
      .call(d3.axisLeft(y).ticks(4).tickSize(-(W - m.l - m.r)).tickFormat("")).call((g) => g.select(".domain").remove());
    svg.append("g").attr("class", "eje").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(W < 420 ? 4 : 8).tickFormat(d3.format("d")));
    svg.append("g").attr("class", "eje").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(4).tickFormat((d) => d + "%"));
    const area = d3.area().x((d) => x(d.year)).y0(y(60)).y1((d) => y(d.pct)).curve(d3.curveMonotoneX);
    svg.append("path").datum(datos).attr("d", area).attr("fill", css("--verde")).attr("fill-opacity", 0.12);
    const p = svg.append("path").datum(datos).attr("fill", "none").attr("stroke", css("--verde")).attr("stroke-width", 2.5)
      .attr("d", d3.line().x((d) => x(d.year)).y((d) => y(d.pct)).curve(d3.curveMonotoneX));
    if (animar) { const L = p.node().getTotalLength(); p.attr("stroke-dasharray", `${L} ${L}`).attr("stroke-dashoffset", L).transition().duration(1600).attr("stroke-dashoffset", 0); }
    [datos[0], datos[datos.length - 1]].forEach((d, i) => {
      svg.append("circle").attr("cx", x(d.year)).attr("cy", y(d.pct)).attr("r", 4).attr("fill", css("--verde"));
      svg.append("text").attr("x", x(d.year) + (i ? -6 : 6)).attr("y", y(d.pct) - 10).attr("text-anchor", i ? "end" : "start")
        .attr("fill", css("--tiza")).style("font-family", css("--f-tiempo")).style("font-size", "12px").text(`${d.year}: ${nf1.format(d.pct)}%`);
    });
    const tip = tooltip(cont); const esc = cont.clientWidth / W;
    svg.append("g").selectAll("rect").data(datos).enter().append("rect")
      .attr("x", (d) => x(d.year) - (x(2011) - x(2010)) / 2).attr("width", x(2011) - x(2010)).attr("y", m.t).attr("height", H - m.t - m.b).attr("fill", "transparent")
      .on("pointerenter", (ev, d) => tip.mostrar(`<div class="t">${d.year}</div>Terminaron: <b>${nf1.format(d.pct)}%</b><br>${d.n} autos largaron`, x(d.year) * esc, y(d.pct) * esc))
      .on("pointerleave", () => tip.ocultar());
  }

  let modoCarreras = "20";
  function graficoCarreras(animar) {
    const cont = $("#g-carreras");
    cont.innerHTML = "";
    const todos = D.exploracion.carreras_por_piloto;
    const datos = modoCarreras === "20" ? todos.slice(0, 20) : todos;
    const W = cont.clientWidth; const fila = modoCarreras === "20" ? 22 : 15;
    const m = { t: 8, r: 40, b: 26, l: W < 480 ? 104 : 140 };
    const H = m.t + m.b + datos.length * fila;
    const x = d3.scaleLinear().domain([0, d3.max(todos, (d) => d.n)]).nice().range([m.l, W - m.r]);
    const y = d3.scaleBand().domain(datos.map((d) => d.piloto)).range([m.t, H - m.b]).padding(0.22);
    const svg = d3.select(cont).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img")
      .attr("aria-label", "Carreras terminadas por piloto, 2010 a 2024");
    svg.append("g").attr("class", "grilla").attr("transform", `translate(0,${H - m.b})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(-(H - m.t - m.b)).tickFormat("")).call((g) => g.select(".domain").remove());
    svg.append("g").attr("class", "eje").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(5));
    svg.append("g").attr("class", "eje").attr("transform", `translate(${m.l},0)`)
      .call(d3.axisLeft(y).tickSize(0).tickPadding(8).tickFormat((n) => (W < 480 ? n.split(" ").slice(-1)[0] : n)))
      .call((g) => g.select(".domain").remove()).selectAll("text").style("font-family", css("--f-texto")).style("font-size", fila > 18 ? "12px" : "10px");
    const barras = svg.append("g").selectAll("rect").data(datos).enter().append("rect")
      .attr("x", m.l).attr("y", (d) => y(d.piloto)).attr("height", y.bandwidth()).attr("rx", 1)
      .attr("width", (d) => x(d.n) - m.l).attr("fill", (d) => EQ[d.equipo].color);
    if (fila > 18) svg.append("g").selectAll("text").data(datos).enter().append("text")
      .attr("x", (d) => x(d.n) + 5).attr("y", (d) => y(d.piloto) + y.bandwidth() / 2).attr("dy", "0.35em")
      .attr("fill", css("--niebla")).style("font-family", css("--f-tiempo")).style("font-size", "11px").text((d) => d.n);
    const tip = tooltip(cont); const esc = cont.clientWidth / W;
    barras.on("pointerenter", (ev, d) => tip.mostrar(`<div class="t" style="color:${EQ[d.equipo].color}">${d.piloto}</div>${d.n} carreras terminadas<br><span class="etiqueta">Equipo con más carreras: ${EQ[d.equipo].nombre}</span>`, x(d.n) * esc, y(d.piloto) * esc))
      .on("pointerleave", () => tip.ocultar());
    if (animar) barras.attr("width", 0).transition().delay((d, i) => i * 18).duration(700).ease(d3.easeCubicOut).attr("width", (d) => x(d.n) - m.l);
  }

  function graficoHisto() {
    const cont = $("#g-histo");
    cont.innerHTML = "";
    const valores = D.exploracion.carreras_por_piloto.map((d) => d.n);
    const r = D.exploracion.carreras_por_piloto_resumen;
    const W = cont.clientWidth; const H = Math.max(220, Math.min(280, W * 0.6));
    const m = { t: 30, r: 12, b: 38, l: 36 };
    const x = d3.scaleLinear().domain([0, 280]).range([m.l, W - m.r]);
    const bins = d3.bin().domain([0, 280]).thresholds(d3.range(0, 281, 20))(valores);
    const y = d3.scaleLinear().domain([0, d3.max(bins, (b) => b.length)]).nice().range([H - m.b, m.t]);
    const svg = d3.select(cont).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img")
      .attr("aria-label", "Histograma de carreras terminadas por piloto");
    svg.append("g").attr("class", "eje").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues([0, 40, 80, 120, 160, 200, 240, 280]));
    svg.append("g").attr("class", "eje").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(4));
    svg.append("text").attr("class", "titulo-eje").attr("x", (m.l + W - m.r) / 2).attr("y", H - 4).attr("text-anchor", "middle").text("Carreras terminadas (cantidad de pilotos por rango)");
    svg.append("g").selectAll("rect").data(bins).enter().append("rect")
      .attr("x", (b) => x(b.x0) + 1).attr("width", (b) => Math.max(0, x(b.x1) - x(b.x0) - 2))
      .attr("y", (b) => y(b.length)).attr("height", (b) => y(0) - y(b.length)).attr("fill", css("--celeste")).attr("fill-opacity", 0.75);
    [[r["50%"], "mediana " + nf0.format(r["50%"]), css("--amarillo"), "end"], [r.mean, "media " + nf1.format(r.mean), css("--morado"), "start"]].forEach(([v, t, c, anc]) => {
      svg.append("line").attr("x1", x(v)).attr("x2", x(v)).attr("y1", m.t - 6).attr("y2", H - m.b).attr("stroke", c).attr("stroke-width", 2).attr("stroke-dasharray", "4 3");
      svg.append("text").attr("x", x(v) + (anc === "end" ? -5 : 5)).attr("y", m.t - 10).attr("text-anchor", anc).attr("fill", c)
        .style("font-family", css("--f-tiempo")).style("font-size", "12px").text(t);
    });
  }

  /* ---------------- Vuelta 2: efecto del auto y del piloto ---------------- */
  function graficoPeso(animar) {
    const cont = $("#g-peso");
    cont.innerHTML = "";
    const W = cont.clientWidth; const H = Math.max(300, Math.min(440, W * 0.5));
    const m = { t: 30, r: 16, b: 40, l: 48 };
    const datos = D.efectos;
    const x = d3.scaleLinear().domain([2010, 2024]).range([m.l, W - m.r]);
    const y = d3.scaleLinear().domain([0, 6.5]).range([H - m.b, m.t]);
    const svg = d3.select(cont).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img")
      .attr("aria-label", "Efecto típico del auto y del piloto sobre la posición final, por año, 2010 a 2024");

    ERAS.forEach((e, i) => {
      svg.append("rect").attr("x", x(e.desde - (i ? 0.5 : 0))).attr("width", x(e.hasta + (i < 2 ? 0.5 : 0)) - x(e.desde - (i ? 0.5 : 0)))
        .attr("y", m.t - 22).attr("height", H - m.b - m.t + 22).attr("fill", i % 2 ? "#ffffff06" : "#ffffff00");
      svg.append("text").attr("x", (x(e.desde) + x(e.hasta)) / 2).attr("y", m.t - 8).attr("text-anchor", "middle")
        .attr("fill", css("--niebla")).style("font-family", css("--f-tiempo")).style("font-size", "11px").style("letter-spacing", ".08em")
        .text(e.nombre.toUpperCase());
    });
    svg.append("g").attr("class", "grilla").attr("transform", `translate(${m.l},0)`)
      .call(d3.axisLeft(y).ticks(6).tickSize(-(W - m.l - m.r)).tickFormat("")).call((g) => g.select(".domain").remove());
    svg.append("g").attr("class", "eje").attr("transform", `translate(0,${H - m.b})`)
      .call(d3.axisBottom(x).ticks(W < 560 ? 7 : 15).tickFormat(d3.format("d")));
    svg.append("g").attr("class", "eje").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6));
    svg.append("text").attr("class", "titulo-eje").attr("transform", `translate(14,${(m.t + H - m.b) / 2}) rotate(-90)`).attr("text-anchor", "middle").text("Posiciones");
    // Tope presupuestario
    svg.append("line").attr("x1", x(2021)).attr("x2", x(2021)).attr("y1", m.t).attr("y2", H - m.b).attr("stroke", css("--verde")).attr("stroke-opacity", 0.6);
    svg.append("text").attr("x", x(2021) - 6).attr("y", y(0.4)).attr("text-anchor", "end").attr("fill", css("--verde")).style("font-size", "12px").text("Tope presupuestario");

    const series = [["auto", css("--rojo-luz")], ["piloto", css("--celeste")]];
    series.forEach(([k, c]) => {
      const linea = d3.line().x((d) => x(d.year)).y((d) => y(d[k])).curve(d3.curveMonotoneX);
      const p = svg.append("path").datum(datos).attr("fill", "none").attr("stroke", c).attr("stroke-width", 3).attr("d", linea);
      const pts = svg.selectAll(null).data(datos).enter().append("circle").attr("cx", (d) => x(d.year)).attr("cy", (d) => y(d[k]))
        .attr("r", 4).attr("fill", css("--asfalto")).attr("stroke", c).attr("stroke-width", 2);
      if (animar) {
        const L = p.node().getTotalLength();
        p.attr("stroke-dasharray", `${L} ${L}`).attr("stroke-dashoffset", L).transition().duration(2200).ease(d3.easeCubicOut).attr("stroke-dashoffset", 0);
        pts.attr("opacity", 0).transition().delay((d, i) => 150 * i).duration(300).attr("opacity", 1);
      }
    });
    // Año de mayor cociente
    const max = datos.reduce((a, b) => (b.ratio > a.ratio ? b : a));
    svg.append("text").attr("x", x(max.year)).attr("y", y(max.auto) - 14).attr("text-anchor", "middle").attr("fill", css("--rojo-luz"))
      .style("font-family", css("--f-tiempo")).style("font-size", "12px").text(`${max.year}: ${nf1.format(max.ratio)}×`);

    const tip = tooltip(cont);
    const guia = svg.append("line").attr("y1", m.t).attr("y2", H - m.b).attr("stroke", "#ffffff40").attr("opacity", 0);
    svg.append("rect").attr("x", m.l).attr("y", m.t).attr("width", W - m.l - m.r).attr("height", H - m.t - m.b).attr("fill", "transparent")
      .on("pointermove", (ev) => {
        const [px] = d3.pointer(ev);
        const yr = Math.round(x.invert(px)); const d = datos.find((v) => v.year === yr); if (!d) return;
        guia.attr("x1", x(yr)).attr("x2", x(yr)).attr("opacity", 1);
        tip.mostrar(`<div class="t">${yr}</div>Auto: <b style="color:var(--rojo-luz)">${nf2.format(d.auto)}</b> posiciones<br>Piloto: <b style="color:var(--celeste)">${nf2.format(d.piloto)}</b> posiciones<br>El auto pesa <b>${nf2.format(d.ratio)}</b> veces más<br><span class="etiqueta">${era(yr)}</span>`, x(yr) * cont.clientWidth / W, y(d.auto) * cont.clientWidth / W);
      })
      .on("pointerleave", () => { guia.attr("opacity", 0); tip.ocultar(); });

    const r = D.resumen;
    const minA = Math.min(...datos.map((d) => d.auto)); const maxP = Math.max(...datos.map((d) => d.piloto));
    const minR = datos.reduce((a, b) => (b.ratio < a.ratio ? b : a));
    $("#lectura-peso").innerHTML = `<b>Lectura.</b> En todo el período el auto mueve en promedio <b>${nf2.format(r.efecto_auto)}</b> posiciones y el piloto <b>${nf2.format(r.efecto_piloto)}</b>: el auto pesa <b>${nf1.format(r.ratio)} veces más</b>. ` +
      `La línea roja nunca baja de ${nf1.format(minA)} y la celeste nunca pasa de ${nf1.format(maxP)}, así que el auto gana en los 15 años. ` +
      `El cociente máximo es ${nf2.format(max.ratio)} (${max.year}) y el mínimo ${nf2.format(minR.ratio)} (${minR.year}): desde el tope presupuestario los autos están algo más parejos, pero el piloto nunca se acerca. Si los autos fueran todos iguales, el cociente sería cercano a 1.`;
  }

  /* ---------------- Vuelta 3: duelos ---------------- */
  function duelos() {
    const lista = $("#lista-duelos");
    const todos = D.duelos;
    function pintar(modo, animar) {
      let datos = todos;
      if (modo === "top") datos = todos.slice(0, 15);
      if (modo === "fondo") datos = todos.slice(-10).reverse();
      lista.innerHTML = datos.map((d) => {
        const e = EQ[d.equipo];
        return `<div class="duelo">
          <span class="bandera" title="${d.nac.trim()}">${bandera(d.nac)}</span>
          <span class="cod" style="color:${e.color}">${codigo(d)}</span>
          <span class="nombre"><b>${d.piloto}</b><span class="equipos">${d.equipos.map((q) => logo(q, 16)).join("")}</span></span>
          <span class="riel"><span class="relleno" data-w="${d.pct}" style="width:${animar ? 0 : d.pct}%;background:linear-gradient(90deg, ${e.color}55, ${e.color})"></span><span class="mitad"></span></span>
          <span class="pct">${nf1.format(d.pct)}%<small>${d.duelos} duelos</small></span>
        </div>`;
      }).join("");
      if (animar) requestAnimationFrame(() => requestAnimationFrame(() =>
        lista.querySelectorAll(".relleno").forEach((r, i) => { r.style.transitionDelay = i * 40 + "ms"; r.style.width = r.dataset.w + "%"; })));
    }
    document.querySelectorAll("[data-duelos]").forEach((b) => b.addEventListener("click", () => {
      document.querySelectorAll("[data-duelos]").forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
      pintar(b.dataset.duelos, !quieto);
    }));
    const [v1, v2] = todos;
    const ult = todos[todos.length - 1];
    $("#lectura-duelos").innerHTML = `<b>Lectura.</b> ${v1.piloto} (${nf1.format(v1.pct)}%) y ${v2.piloto} (${nf1.format(v2.pct)}%) le ganan a su compañero cerca de 4 de cada 5 carreras, en distintos equipos y contra distintos compañeros: el talento existe y es persistente. ` +
      `Pero ganarle al compañero no es lo mismo que ganar la carrera: ellos dos le sacan en promedio ${nf1.format(-v1.dif * 2)} lugares al compañero, mucho menos que lo que separa a un auto de otro. En el otro extremo, ${ult.piloto} gana el ${nf1.format(ult.pct)}%.`;
    pintar("top", false);
    alEntrar(lista, (estatico) => { if (!estatico) pintar("top", true); }, 0.15);
  }

  /* ---------------- Vuelta 4: trayectorias (gráfico 3 del notebook) ---------------- */
  const TRAY = ["Fernando Alonso", "Lewis Hamilton", "Sebastian Vettel", "Max Verstappen"];
  let pilotoTray = TRAY[0];
  const LECTURA_TRAY = {
    "Fernando Alonso": "Entre el 81% y el 100% de duelos ganados en Ferrari (2010–2014), con un 100% en 2012. Cae al 44% en su primer año en McLaren y vuelve a superar el 80% después: el talento se sostiene aunque cambie el auto.",
    "Lewis Hamilton": "Siempre fuerte, pero con mucha variación de un año a otro: entre el 35% (2024) y el 84% (2018), según el auto y el compañero de turno.",
    "Sebastian Vettel": "Del 100% en 2013 al 21% en 2014, con el reglamento nuevo y un compañero nuevo. Se recupera en Ferrari (77% a 87%), vuelve a caer al 23% en 2020 y cambia de equipo.",
    "Max Verstappen": "Crece año a año en Red Bull, hasta ganar el 100% de los duelos en 2020, 2021 y 2024.",
  };
  function trayectorias() {
    const cont = $("#tray-pilotos");
    cont.innerHTML = TRAY.map((p, i) => `<button class="boton" type="button" data-p="${p}" aria-pressed="${i === 0}">${p}</button>`).join("");
    cont.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      pilotoTray = b.dataset.p;
      cont.querySelectorAll("button").forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
      graficoTray(!quieto);
    });
  }
  function graficoTray(animar) {
    const cont = $("#g-tray");
    cont.innerHTML = "";
    const datos = D.duelos_anio.filter((d) => d.piloto === pilotoTray).sort((a, b) => a.year - b.year);
    const W = cont.clientWidth; const H = Math.max(280, Math.min(400, W * 0.45));
    const m = { t: 20, r: 16, b: 40, l: 50 };
    const x = d3.scaleLinear().domain([2009.5, 2024.5]).range([m.l, W - m.r]);
    const y = d3.scaleLinear().domain([0, 105]).range([H - m.b, m.t]);
    const svg = d3.select(cont).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img")
      .attr("aria-label", `Porcentaje de duelos ganados al compañero por temporada: ${pilotoTray}`);
    svg.append("g").attr("class", "grilla").attr("transform", `translate(${m.l},0)`)
      .call(d3.axisLeft(y).tickValues([0, 25, 50, 75, 100]).tickSize(-(W - m.l - m.r)).tickFormat("")).call((g) => g.select(".domain").remove());
    svg.append("g").attr("class", "eje").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(W < 560 ? 7 : 15).tickFormat(d3.format("d")));
    svg.append("g").attr("class", "eje").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).tickValues([0, 25, 50, 75, 100]).tickFormat((d) => d + "%"));
    svg.append("line").attr("x1", m.l).attr("x2", W - m.r).attr("y1", y(50)).attr("y2", y(50)).attr("stroke", css("--niebla")).attr("stroke-dasharray", "5 5");
    svg.append("text").attr("x", W - m.r).attr("y", y(50) - 6).attr("text-anchor", "end").attr("fill", css("--niebla")).style("font-size", "12px").text("50%: empate con el compañero");
    for (let i = 1; i < datos.length; i++) {
      const a = datos[i - 1]; const b = datos[i];
      const l = svg.append("line").attr("x1", x(a.year)).attr("y1", y(a.pct)).attr("x2", x(b.year)).attr("y2", y(b.pct))
        .attr("stroke", EQ[b.equipo].color).attr("stroke-width", 3).attr("stroke-dasharray", b.year - a.year > 1 ? "4 5" : null);
      if (animar) l.attr("opacity", 0).transition().delay(i * 90).duration(250).attr("opacity", 1);
    }
    const tip = tooltip(cont); const esc = cont.clientWidth / W;
    const pts = svg.append("g").selectAll("circle").data(datos).enter().append("circle")
      .attr("cx", (d) => x(d.year)).attr("cy", (d) => y(d.pct)).attr("r", 7)
      .attr("fill", (d) => EQ[d.equipo].color).attr("stroke", css("--asfalto")).attr("stroke-width", 2)
      .on("pointerenter", (ev, d) => tip.mostrar(`<div class="t" style="color:${EQ[d.equipo].color}">${d.year} · ${EQ[d.equipo].nombre}</div>Ganó <b>${nf1.format(d.pct)}%</b> de ${d.duelos} duelos`, x(d.year) * esc, y(d.pct) * esc))
      .on("pointerleave", () => tip.ocultar());
    if (animar) pts.attr("r", 0).transition().delay((d, i) => i * 90).duration(300).attr("r", 7);
    const eqs = [...new Set(datos.map((d) => d.equipo))];
    $("#lectura-tray").innerHTML = `<span class="equipos-tray">${eqs.map((q) => `${logo(q, 18)} ${EQ[q].nombre}`).join(" &nbsp; ")}</span><br><b>Lectura.</b> ${LECTURA_TRAY[pilotoTray]}`;
  }

  /* ---------------- Vuelta 5: dispersión ---------------- */
  let filtroFamilia = null;
  function graficoDispersion(animar) {
    const cont = $("#g-dispersion");
    cont.innerHTML = "";
    const W = cont.clientWidth; const H = Math.min(W, 560);
    const m = { t: 14, r: 14, b: 46, l: 50 };
    const x = d3.scaleLinear().domain([22.5, 0.5]).range([m.l, W - m.r]);
    const y = d3.scaleLinear().domain([22.5, 0.5]).range([H - m.b, m.t]);
    const svg = d3.select(cont).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img")
      .attr("aria-label", `Dispersión: posición media del piloto contra la de su compañero, r = ${D.resumen.correlacion}`);
    svg.append("g").attr("class", "grilla").attr("transform", `translate(${m.l},0)`)
      .call(d3.axisLeft(y).tickValues([1, 5, 10, 15, 20]).tickSize(-(W - m.l - m.r)).tickFormat("")).call((g) => g.select(".domain").remove());
    svg.append("g").attr("class", "eje").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues([1, 5, 10, 15, 20]).tickFormat((d) => "P" + d));
    svg.append("g").attr("class", "eje").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).tickValues([1, 5, 10, 15, 20]).tickFormat((d) => "P" + d));
    svg.append("text").attr("class", "titulo-eje").attr("x", (m.l + W - m.r) / 2).attr("y", H - 8).attr("text-anchor", "middle").text("Posición media del compañero (mismo auto)");
    svg.append("text").attr("class", "titulo-eje").attr("transform", `translate(14,${(m.t + H - m.b) / 2}) rotate(-90)`).attr("text-anchor", "middle").text("Posición media del piloto");
    svg.append("line").attr("x1", x(1)).attr("y1", y(1)).attr("x2", x(22)).attr("y2", y(22)).attr("stroke", css("--niebla")).attr("stroke-dasharray", "5 5");
    svg.append("text").attr("x", x(21.5)).attr("y", y(20.5) - 16).attr("fill", css("--niebla")).style("font-size", "11px").text("misma posición que el compañero");

    const tip = tooltip(cont);
    const escala = cont.clientWidth / W;
    const pts = svg.append("g").selectAll("circle").data(D.temporadas).enter().append("circle")
      .attr("cx", (d) => x(d.pos_comp)).attr("cy", (d) => y(d.pos)).attr("r", W < 500 ? 4 : 5.5)
      .attr("fill", (d) => EQ[d.equipo].color).attr("stroke", css("--asfalto")).attr("stroke-width", 1)
      .attr("opacity", (d) => (!filtroFamilia || EQ[d.equipo].familia === filtroFamilia ? 0.85 : 0.08))
      .on("pointerenter", function (ev, d) {
        d3.select(this).raise().attr("r", 9);
        const e = EQ[d.equipo];
        tip.mostrar(`<div class="t" style="color:${e.color}">${d.piloto}</div>${e.nombre} ${d.year}<br>Él: <b>P${nf1.format(d.pos)}</b> · ${d.comp}: <b>P${nf1.format(d.pos_comp)}</b>`, x(d.pos_comp) * escala, y(d.pos) * escala);
      })
      .on("pointerleave", function () { d3.select(this).attr("r", W < 500 ? 4 : 5.5); tip.ocultar(); });
    if (animar) {
      pts.attr("cx", x(11)).attr("cy", y(11)).attr("opacity", 0)
        .transition().delay((d, i) => i * 4).duration(900).ease(d3.easeCubicOut)
        .attr("cx", (d) => x(d.pos_comp)).attr("cy", (d) => y(d.pos)).attr("opacity", 0.85);
    }
  }
  function filtrosEquipo() {
    const fams = {};
    Object.entries(EQ).forEach(([ref, e]) => { if (!fams[e.familia]) fams[e.familia] = ref; });
    // Representante actual de cada familia (último nombre usado)
    const rep = { Enstone: "alpine", Silverstone: "aston_martin", Faenza: "rb", Hinwil: "sauber", Leafield: "caterham", Banbury: "virgin" };
    const nombres = { Enstone: "Renault · Lotus · Alpine", Silverstone: "Force India · Racing Point · Aston Martin", Faenza: "Toro Rosso · AlphaTauri · RB", Hinwil: "Sauber · Alfa Romeo", Leafield: "Lotus · Caterham", Banbury: "Virgin · Marussia · Manor" };
    const cont = $("#filtros-equipo");
    cont.innerHTML = `<button type="button" data-f="" aria-pressed="true">Todas</button>` +
      Object.keys(fams).map((f) => `<button type="button" data-f="${f}" aria-pressed="false">${logo(rep[f] || fams[f], 16)} ${nombres[f] || EQ[fams[f]].nombre}</button>`).join("");
    cont.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      filtroFamilia = b.dataset.f || null;
      cont.querySelectorAll("button").forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
      d3.select("#g-dispersion").selectAll("circle").transition().duration(400)
        .attr("opacity", (d) => (d && (!filtroFamilia || EQ[d.equipo].familia === filtroFamilia) ? 0.85 : 0.08));
    });
    $("#r-grande").textContent = D.resumen.correlacion.toLocaleString("es-AR", { minimumFractionDigits: 2 });
  }

  /* ---------------- Vuelta 5: brecha (boxplot) ---------------- */
  function graficoBrecha(animar) {
    const cont = $("#g-brecha");
    cont.innerHTML = "";
    const W = cont.clientWidth; const H = Math.max(280, Math.min(400, W * 0.45));
    const m = { t: 16, r: 12, b: 40, l: 50 };
    const datos = D.brecha;
    const x = d3.scaleBand().domain(datos.map((d) => d.year)).range([m.l, W - m.r]).padding(0.35);
    const y = d3.scaleLinear().domain([0, Math.max(...datos.map((d) => d.hi)) + 1]).range([H - m.b, m.t]);
    const svg = d3.select(cont).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img")
      .attr("aria-label", "Diagrama de caja de la distancia entre compañeros por temporada");
    svg.append("g").attr("class", "grilla").attr("transform", `translate(${m.l},0)`)
      .call(d3.axisLeft(y).ticks(6).tickSize(-(W - m.l - m.r)).tickFormat("")).call((g) => g.select(".domain").remove());
    svg.append("g").attr("class", "eje").attr("transform", `translate(0,${H - m.b})`)
      .call(d3.axisBottom(x).tickFormat((d) => (W < 560 ? "'" + String(d).slice(2) : d)));
    svg.append("g").attr("class", "eje").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6));
    svg.append("text").attr("class", "titulo-eje").attr("transform", `translate(14,${(m.t + H - m.b) / 2}) rotate(-90)`).attr("text-anchor", "middle").text("Lugares entre compañeros");

    const g = svg.append("g").selectAll("g").data(datos).enter().append("g").attr("transform", (d) => `translate(${x(d.year)},0)`);
    const bw = x.bandwidth();
    const color = (d) => (d.year >= 2022 ? css("--verde") : css("--celeste"));
    g.append("line").attr("x1", bw / 2).attr("x2", bw / 2).attr("y1", (d) => y(d.lo)).attr("y2", (d) => y(d.hi)).attr("stroke", color).attr("stroke-opacity", 0.6);
    g.append("line").attr("x1", bw * 0.25).attr("x2", bw * 0.75).attr("y1", (d) => y(d.hi)).attr("y2", (d) => y(d.hi)).attr("stroke", color);
    const cajas = g.append("rect").attr("x", 0).attr("width", bw).attr("y", (d) => y(d.q3)).attr("height", (d) => Math.max(2, y(d.q1) - y(d.q3)))
      .attr("fill", (d) => color(d) + "33").attr("stroke", color).attr("rx", 2);
    const med = g.append("line").attr("x1", -2).attr("x2", bw + 2).attr("y1", (d) => y(d.med)).attr("y2", (d) => y(d.med)).attr("stroke", css("--amarillo")).attr("stroke-width", 3);
    if (animar) {
      cajas.attr("y", y(0)).attr("height", 0).transition().delay((d, i) => i * 60).duration(700).attr("y", (d) => y(d.q3)).attr("height", (d) => Math.max(2, y(d.q1) - y(d.q3)));
      med.attr("opacity", 0).transition().delay((d, i) => 400 + i * 60).attr("opacity", 1);
    }
    const tip = tooltip(cont); const esc = cont.clientWidth / W;
    g.append("rect").attr("x", 0).attr("width", bw).attr("y", m.t).attr("height", H - m.t - m.b).attr("fill", "transparent")
      .on("pointerenter", (ev, d) => tip.mostrar(`<div class="t">${d.year}</div>Mediana: <b>${nf0.format(d.med)}</b> lugares<br>50% central: ${nf0.format(d.q1)} a ${nf0.format(d.q3)}<br>Promedio: ${nf1.format(d.media)} · ${d.n} pares`, (x(d.year) + bw / 2) * esc, y(d.q3) * esc))
      .on("pointerleave", () => tip.ocultar());
    svg.append("text").attr("x", W - m.r).attr("y", m.t + 4).attr("text-anchor", "end").attr("fill", css("--verde")).style("font-size", "12px").text("Desde 2022 la mediana sube a 3");
  }

  /* ---------------- Vuelta 6: simulador ---------------- */
  function simulador() {
    const selP = $("#sim-piloto"); const selA = $("#sim-anio"); const selE = $("#sim-equipo");
    const pilotos = [...D.duelos].sort((a, b) => a.piloto.localeCompare(b.piloto, "es"));
    selP.innerHTML = pilotos.map((p) => `<option value="${p.piloto}">${p.piloto}</option>`).join("");
    const anios = [...new Set(D.autos.map((a) => a.year))].sort();
    selA.innerHTML = anios.map((y) => `<option value="${y}">${y}</option>`).join("");
    const llenarEquipos = (pref) => {
      const lista = D.autos.filter((a) => a.year === +selA.value).sort((a, b) => a.pos - b.pos);
      selE.innerHTML = lista.map((a) => `<option value="${a.equipo}">${EQ[a.equipo].nombre} (P${nf1.format(a.pos)})</option>`).join("");
      if (pref && lista.some((a) => a.equipo === pref)) selE.value = pref;
    };
    const MAXP = 24;
    $("#marcas").innerHTML = [1, 5, 10, 15, 20, 24].map((n) => `<span>P${n}</span>`).join("");
    const pos = (p) => `calc(${14 + 104 / 2}px + (100% - ${28 + 104}px) * ${(p - 1) / (MAXP - 1)})`;

    function calcular() {
      const p = D.duelos.find((d) => d.piloto === selP.value);
      const a = D.autos.find((x) => x.year === +selA.value && x.equipo === selE.value);
      if (!p || !a) return;
      const e = EQ[a.equipo];
      const total = Math.min(MAXP, Math.max(1, a.pos + p.dif));
      $("#coche-auto").innerHTML = autoSVG(e.color, "sa");
      $("#coche-piloto").innerHTML = autoSVG(e.color, "sp");
      $("#coche-auto").style.left = pos(a.pos);
      $("#coche-piloto").style.left = pos(total);
      $("#rot-auto").style.left = `calc(${pos(a.pos)} + 64px)`;
      $("#rot-piloto").style.left = `calc(${pos(total)} + 64px)`;
      $("#rot-auto").textContent = "auto promedio";
      $("#rot-piloto").textContent = "con " + codigo(p);
      $("#c-auto").textContent = "P" + nf1.format(a.pos);
      $("#c-piloto").textContent = (p.dif < 0 ? "gana " : "pierde ") + nf1.format(Math.abs(p.dif));
      $("#c-piloto").style.color = p.dif < 0 ? css("--verde") : "#ff6b6b";
      $("#c-total").textContent = "P" + nf1.format(total);
      const zona = a.pos <= 4 ? "pelea arriba igual" : a.pos >= 14 ? "ni así sale del fondo de la grilla" : "sigue en la zona media que marca el auto";
      $("#sim-texto").innerHTML = `<b>${p.piloto}</b> en el <b style="color:${e.color}">${e.nombre} ${a.year}</b> terminaría en promedio cerca del <b>P${Math.round(total)}</b>. ` +
        (Math.abs(p.dif) < 0.3
          ? "Rinde casi igual que sus compañeros, así que el auto decide todo."
          : `El auto lo deja en P${nf1.format(a.pos)} y él ${p.dif < 0 ? "le gana" : "le pierde"} ${nf1.format(Math.abs(p.dif))} lugares: ${zona}.`);
    }

    selP.addEventListener("change", calcular);
    selA.addEventListener("change", () => { llenarEquipos(selE.value); calcular(); });
    selE.addEventListener("change", calcular);

    const presets = [
      ["Max Verstappen", 2012, "hrt", "Verstappen en el HRT 2012"],
      ["Nicholas Latifi", 2023, "red_bull", "Latifi en el Red Bull 2023"],
      ["Fernando Alonso", 2014, "mercedes", "Alonso en el Mercedes 2014"],
      ["Lewis Hamilton", 2019, "williams", "Hamilton en el Williams 2019"],
    ];
    $("#presets").innerHTML = presets.map((p, i) => `<button class="boton" type="button" data-i="${i}">${p[3]}</button>`).join("");
    $("#presets").addEventListener("click", (ev) => {
      const b = ev.target.closest("button"); if (!b) return;
      const [pi, y, eq] = presets[+b.dataset.i];
      selP.value = pi; selA.value = y; llenarEquipos(eq); calcular();
    });
    selP.value = "Max Verstappen"; selA.value = 2019; llenarEquipos("williams");
    calcular();
  }

  /* ---------------- Arranque ---------------- */
  function dibujarGraficos(animar) {
    graficoTerminaron(animar); graficoCarreras(animar); graficoHisto();
    graficoPeso(animar); graficoTray(animar); graficoDispersion(animar); graficoBrecha(animar);
  }

  hero(false);
  estelas();
  barra();
  formacion();
  torre();
  duelos();
  trayectorias();
  filtrosEquipo();
  simulador();
  dibujarGraficos(false);

  // Animaciones al entrar en pantalla
  alEntrar($("#g-terminaron"), (est) => { if (!est) graficoTerminaron(true); });
  alEntrar($("#g-carreras"), (est) => { if (!est) graficoCarreras(true); });
  alEntrar($("#g-peso"), (est) => { if (!est) graficoPeso(true); });
  alEntrar($("#g-tray"), (est) => { if (!est) graficoTray(true); });
  alEntrar($("#g-dispersion"), (est) => { if (!est) graficoDispersion(true); });
  alEntrar($("#g-brecha"), (est) => { if (!est) graficoBrecha(true); });

  let anchoPrevio = innerWidth;
  let espera;
  addEventListener("resize", () => {
    if (innerWidth === anchoPrevio) return;
    anchoPrevio = innerWidth;
    clearTimeout(espera); espera = setTimeout(() => dibujarGraficos(false), 200);
  });

  largada(() => hero(true));
})();
