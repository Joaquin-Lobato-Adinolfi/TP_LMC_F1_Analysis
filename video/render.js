// Arma el video del TP: captura video/escenas.html cuadro por cuadro con Playwright,
// une el audio de las 8 escenas (recortado según video/tiempos.json) y genera el MP4.
//
//   node video/render.js                      -> video/Video_TP_F1.mp4
//   node video/render.js --cuadros 12.5,40    -> PNG de esos segundos en video/cuadros/
//   node video/render.js --desde 30 --hasta 45 -> solo ese tramo (para revisar)
const { chromium } = require("playwright");
const { spawn, spawnSync, execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const FPS = 30;
const HILOS = 4;
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };

async function abrir(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => { console.error("Error en la página:", e.message); process.exit(1); });
  await page.goto("file://" + path.join(DIR, "escenas.html"));
  await page.evaluate(() => document.fonts.ready);
  return page;
}

function audio(tiempos, salida) {
  // Cada audio se recorta, se lleva a -16 LUFS (con la ganancia medida antes, para no
  // correrlo en el tiempo) y se ubica en el segundo exacto en que empieza su escena.
  const entradas = [], filtros = [];
  tiempos.forEach((e, i) => {
    const archivo = path.join(DIR, "audio", e.id + ".m4a");
    const [a, b] = e.recorte;
    const r = spawnSync("ffmpeg", ["-hide_banner", "-i", archivo, "-af", `atrim=start=${a}:end=${b},loudnorm=print_format=json`,
      "-f", "null", "-"], { encoding: "utf8" });
    const m = r.stderr.match(/\{[^{}]*"input_i"[^{}]*\}/);
    const info = m ? JSON.parse(m[0]) : null;
    const ganancia = info ? Math.min(12, -16 - Number(info.input_i)) : 0;
    entradas.push("-i", archivo);
    const ms = Math.round(e.inicio * 1000);
    filtros.push(`[${i}:a]atrim=start=${a}:end=${Math.min(b, a + e.dur)},asetpts=PTS-STARTPTS,aresample=48000,` +
      `volume=${ganancia.toFixed(2)}dB,afade=t=in:d=0.05,afade=t=out:st=${Math.max(0, e.dur - 0.25)}:d=0.25,` +
      `adelay=${ms}|${ms}[a${i}]`);
  });
  const total = tiempos.reduce((s, e) => s + e.dur, 0);
  const mezcla = tiempos.map((_, i) => `[a${i}]`).join("") +
    `amix=inputs=${tiempos.length}:normalize=0,alimiter=limit=0.89,apad,atrim=end=${total}[out]`;
  execFileSync("ffmpeg", ["-v", "error", "-y", ...entradas, "-filter_complex", filtros.join(";") + ";" + mezcla,
    "-map", "[out]", "-ac", "2", "-c:a", "pcm_s16le", salida]);
}

async function tramo(browser, desde, hasta, salida) {
  const page = await abrir(browser);
  const ff = spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", salida], { stdio: ["pipe", "inherit", "inherit"] });
  const n0 = Math.round(desde * FPS), n1 = Math.round(hasta * FPS);
  for (let n = n0; n < n1; n++) {
    await page.evaluate((t) => window.render(t), n / FPS);
    const buf = await page.screenshot({ type: "png" });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if ((n - n0) % 300 === 0) console.log(`  ${path.basename(salida)}: ${((n - n0) / FPS).toFixed(0)} s de ${((n1 - n0) / FPS).toFixed(0)}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await page.close();
}

(async () => {
  const tiempos = JSON.parse(fs.readFileSync(path.join(DIR, "tiempos.json"), "utf8"));
  const total = tiempos.reduce((s, e) => s + e.dur, 0);
  const browser = await chromium.launch();

  const cuadros = opt("--cuadros");
  if (cuadros) {
    const page = await abrir(browser);
    fs.mkdirSync(path.join(DIR, "cuadros"), { recursive: true });
    for (const t of cuadros.split(",").map(Number)) {
      await page.evaluate((x) => window.render(x), t);
      await page.screenshot({ path: path.join(DIR, "cuadros", `t${t.toFixed(2).padStart(6, "0")}.png`) });
    }
    await browser.close();
    return;
  }

  if (args.includes("--solo-audio")) {
    // Rehace el audio y lo vuelve a unir con el video ya capturado.
    await browser.close();
    const mp4 = path.join(DIR, "Video_TP_F1.mp4"), tmpA = path.join(require("os").tmpdir(), "audio_tp.wav");
    audio(tiempos, tmpA);
    const tmpV = mp4.replace(".mp4", ".tmp.mp4");
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", mp4, "-i", tmpA, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
      "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", tmpV]);
    fs.renameSync(tmpV, mp4);
    console.log("Listo:", mp4);
    return;
  }
  const desde = Number(opt("--desde") || 0), hasta = Number(opt("--hasta") || total);
  const tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "video-"));
  const paso = (hasta - desde) / HILOS;
  console.log(`Capturando ${(hasta - desde).toFixed(1)} s en ${HILOS} partes…`);
  await Promise.all(Array.from({ length: HILOS }, (_, i) =>
    tramo(browser, desde + i * paso, desde + (i + 1) * paso, path.join(tmp, `p${i}.mp4`))));
  await browser.close();
  fs.writeFileSync(path.join(tmp, "lista.txt"), Array.from({ length: HILOS }, (_, i) => `file 'p${i}.mp4'`).join("\n"));
  execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", path.join(tmp, "lista.txt"), "-c", "copy", path.join(tmp, "video.mp4")]);
  console.log("Armando el audio…");
  audio(tiempos, path.join(tmp, "audio.wav"));
  const salida = opt("--salida") || path.join(DIR, desde === 0 && hasta === total ? "Video_TP_F1.mp4" : "tramo.mp4");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", path.join(tmp, "video.mp4"), "-ss", String(desde), "-t", String(hasta - desde),
    "-i", path.join(tmp, "audio.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
    "-movflags", "+faststart", "-shortest", salida]);
  fs.rmSync(tmp, { recursive: true });
  console.log("Listo:", salida);
})();
