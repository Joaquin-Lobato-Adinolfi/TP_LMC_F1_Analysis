"""Genera la presentación del TP (8 diapositivas 16:9) como HTML y la exporta a PDF.

Los gráficos se dibujan en SVG a partir de docs/data/f1_data.js, el mismo archivo
que usa la web. Cuando el notebook final esté listo, se regenera ese archivo con
docs/scripts/exportar_datos.py y se vuelve a correr este script:

    python3 presentacion/generar_presentacion.py
    node presentacion/exportar_pdf.js

Mientras los resultados no sean los definitivos, PROVISORIO = True agrega un
aviso en las diapositivas de resultados.
"""

import json
from pathlib import Path

PROVISORIO = True

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = Path(__file__).resolve().parent / "presentacion.html"

AUTO = "#FF2D2D"
PILOTO = "#3EE0FF"
AUTO_CLARO = "#FFA08F"
TEXTO = "#F2F3F5"
TENUE = "#8A90A0"
LINEA = "#262A36"

REPO = "github.com/Joaquin-Lobato-Adinolfi/TP_LMC_F1_Analysis"
WEB = "joaquin-lobato-adinolfi.github.io/TP_LMC_F1_Analysis"


def cargar_js(ruta, variable):
    texto = ruta.read_text(encoding="utf-8")
    inicio = texto.index("{", texto.index(variable))
    return json.JSONDecoder().raw_decode(texto[inicio:])[0]


DATOS = cargar_js(RAIZ / "docs/data/f1_data.js", "F1_DATA")
EQUIPOS = cargar_js(RAIZ / "docs/js/equipos.js", "F1_EQUIPOS")
RES = DATOS["resumen"]


def miles(n):
    return f"{n:,}".replace(",", ".")


# ---------------------------------------------------------------------------
# Gráficos en SVG
# ---------------------------------------------------------------------------

def grafico_peso_auto(ancho=760, alto=380):
    """Líneas: % de la variación explicada por la escudería, por temporada."""
    m = dict(izq=48, der=20, arr=20, aba=36)
    serie = DATOS["peso_auto"]
    anios = [d["year"] for d in serie]
    x0, x1 = min(anios), max(anios)
    y0, y1 = 40, 100

    def px(a):
        return m["izq"] + (a - x0) / (x1 - x0) * (ancho - m["izq"] - m["der"])

    def py(v):
        return m["arr"] + (y1 - v) / (y1 - y0) * (alto - m["arr"] - m["aba"])

    partes = [f'<svg viewBox="0 0 {ancho} {alto}" width="{ancho}" height="{alto}">']
    # zona 2021+
    xa = px(2020.5)
    partes.append(f'<rect x="{xa}" y="{m["arr"]}" width="{ancho - m["der"] - xa + 10}" '
                  f'height="{py(y0) - m["arr"]}" fill="#ffffff" opacity="0.04"/>')
    partes.append(f'<text x="{xa + 10}" y="{m["arr"] + 16}" class="nota">tope presupuestario</text>')
    partes.append(f'<text x="{xa + 10}" y="{m["arr"] + 32}" class="nota">+ reglamento 2022</text>')
    for v in range(40, 101, 20):
        partes.append(f'<line x1="{m["izq"]}" x2="{ancho - m["der"]}" y1="{py(v)}" y2="{py(v)}" '
                      f'stroke="{LINEA}"/>')
        partes.append(f'<text x="{m["izq"] - 10}" y="{py(v) + 4}" class="eje" text-anchor="end">{v}%</text>')
    for a in anios:
        if a % 2 == 0:
            partes.append(f'<text x="{px(a)}" y="{alto - 10}" class="eje" text-anchor="middle">{a}</text>')
    # referencia: el auto no importa
    partes.append(f'<line x1="{m["izq"]}" x2="{ancho - m["der"]}" y1="{py(47)}" y2="{py(47)}" '
                  f'stroke="{TENUE}" stroke-dasharray="5 6"/>')
    partes.append(f'<text x="{m["izq"] + 8}" y="{py(47) - 8}" class="nota">≈47%: lo esperable si el auto no importara</text>')
    for clave, color in (("carrera", AUTO), ("clasificacion", AUTO_CLARO)):
        pts = " ".join(f"{px(d['year']):.1f},{py(d[clave]):.1f}" for d in serie)
        partes.append(f'<polyline points="{pts}" fill="none" stroke="{color}" stroke-width="3.5" '
                      f'stroke-linejoin="round" stroke-linecap="round"/>')
        for d in serie:
            partes.append(f'<circle cx="{px(d["year"]):.1f}" cy="{py(d[clave]):.1f}" r="4" fill="#0B0D12" '
                          f'stroke="{color}" stroke-width="2.5"/>')
    partes.append("</svg>")
    return "".join(partes)


def grafico_duelos(n=8, ancho=720):
    """Barras: % de clasificaciones ganadas al compañero (pilotos con más de 100 duelos)."""
    top = [d for d in DATOS["duelos"] if d["duelos"] >= 100][:n]
    filas = []
    for i, d in enumerate(top, 1):
        color = EQUIPOS.get(d["equipo"], {}).get("color", PILOTO)
        filas.append(f"""
        <div class="fila">
          <div class="pos">P{i}</div>
          <div class="cod" style="border-color:{color}">{d['codigo']}</div>
          <div class="nombre">{d['piloto']}<span>{d['duelos']} duelos</span></div>
          <div class="pista">
            <div class="mitad"></div>
            <div class="barra" style="width:{d['pct']}%;background:linear-gradient(90deg,{color}33,{color})"></div>
          </div>
          <div class="pct">{d['pct']:.0f}%</div>
        </div>""")
    return "".join(filas)


def grafico_brecha(ancho=760, alto=360):
    """Cajas: distancia en la grilla entre compañeros, por temporada."""
    m = dict(izq=40, der=10, arr=14, aba=34)
    serie = DATOS["brecha"]
    y1 = 14
    paso = (ancho - m["izq"] - m["der"]) / len(serie)

    def py(v):
        return m["arr"] + (y1 - v) / y1 * (alto - m["arr"] - m["aba"])

    partes = [f'<svg viewBox="0 0 {ancho} {alto}" width="{ancho}" height="{alto}">']
    for v in range(0, 15, 2):
        partes.append(f'<line x1="{m["izq"]}" x2="{ancho - m["der"]}" y1="{py(v)}" y2="{py(v)}" stroke="{LINEA}"/>')
        partes.append(f'<text x="{m["izq"] - 10}" y="{py(v) + 4}" class="eje" text-anchor="end">{v}</text>')
    for i, d in enumerate(serie):
        cx = m["izq"] + paso * (i + 0.5)
        nuevo = d["year"] >= 2021
        color = PILOTO if nuevo else TENUE
        w = paso * 0.5
        partes.append(f'<line x1="{cx}" x2="{cx}" y1="{py(d["hi"])}" y2="{py(d["lo"])}" stroke="{color}" stroke-width="1.5"/>')
        partes.append(f'<rect x="{cx - w / 2}" y="{py(d["q3"])}" width="{w}" height="{py(d["q1"]) - py(d["q3"])}" '
                      f'fill="{color}" fill-opacity="{0.28 if nuevo else 0.12}" stroke="{color}" stroke-width="1.5" rx="3"/>')
        partes.append(f'<line x1="{cx - w / 2}" x2="{cx + w / 2}" y1="{py(d["med"])}" y2="{py(d["med"])}" '
                      f'stroke="{AUTO if nuevo else TEXTO}" stroke-width="3.5"/>')
        partes.append(f'<text x="{cx}" y="{alto - 10}" class="eje" text-anchor="middle">{str(d["year"])[2:]}</text>')
    partes.append("</svg>")
    return "".join(partes)


# ---------------------------------------------------------------------------
# Diapositivas
# ---------------------------------------------------------------------------

def marco(n, titulo_corto, cuerpo, clase="", provisorio=False):
    aviso = '<div class="aviso">● Datos provisorios</div>' if (provisorio and PROVISORIO) else ""
    return f"""
<section class="slide {clase}">
  <div class="bandera"></div>
  <header>
    <div class="vuelta">VUELTA <b>{n:02d}</b><span>/08</span></div>
    <div class="seccion">{titulo_corto}</div>
    {aviso}
  </header>
  {cuerpo}
  <footer>
    <span>¿Piloto o auto? · F1 2010–2024</span>
    <span class="sectores"><i class="{'on' if n >= 1 else ''}"></i><i class="{'on' if n >= 4 else ''}"></i><i class="{'on' if n >= 7 else ''}"></i></span>
  </footer>
</section>"""


peso = DATOS["peso_auto"]
auto_total = RES["auto_total_clasificacion"]
min_auto = min(min(d["carrera"], d["clasificacion"]) for d in peso)
max_auto = max(max(d["carrera"], d["clasificacion"]) for d in peso)
lider = DATOS["duelos"][0]
alonso = next(d for d in DATOS["duelos"] if d["codigo"] == "ALO")
brecha = {d["year"]: d for d in DATOS["brecha"]}
med_antes = brecha[2020]["med"]
med_despues = brecha[2023]["med"]

SLIDES = []

SLIDES.append(f"""
<section class="slide portada">
  <div class="bandera"></div>
  <div class="grilla-fondo"></div>
  <div class="portada-texto">
    <div class="kicker">TP grupal · Laboratorio de Métodos Cuantitativos · FCE UBA</div>
    <h1><span class="p">¿Piloto</span><br><span class="o">o</span> <span class="a">auto?</span></h1>
    <p class="bajada">Qué pesa más en el resultado de una carrera de Fórmula 1, 2010–2024</p>
  </div>
  <div class="semaforo"><i></i><i></i><i></i><i></i><i></i></div>
  <div class="portada-pie">
    <div><b>Agustín Mier Torre</b><b>Joaquín Lobato Adinolfi</b></div>
    <div class="cifras">
      <span><b>{RES['carreras']}</b>carreras</span>
      <span><b>{RES['pilotos']}</b>pilotos</span>
      <span><b>15</b>temporadas</span>
    </div>
  </div>
</section>""")

SLIDES.append(marco(2, "La pregunta", f"""
  <div class="pregunta">
    <h2>¿Qué parte del resultado se explica por el <em class="a">auto</em> y qué parte por el <em class="p">piloto</em>?</h2>
    <div class="tarjetas">
      <div class="tarjeta"><div class="num">01</div><h3>Una decisión de presupuesto</h3><p>Para una escudería: ¿pagar un piloto estrella o invertir en el auto?</p></div>
      <div class="tarjeta"><div class="num">02</div><h3>Desde 2021, cada peso cuenta</h3><p>El tope presupuestario limita cuánto se puede gastar en desarrollo.</p></div>
      <div class="tarjeta"><div class="num">03</div><h3>El debate de siempre</h3><p>Todo fanático tiene una opinión. Nosotros lo medimos con datos.</p></div>
    </div>
  </div>"""))

SLIDES.append(marco(3, "Datos y método", f"""
  <div class="metodo">
    <div class="metodo-izq">
      <h2>El compañero de equipo es el <em class="p">grupo de control</em></h2>
      <div class="garage">
        <div class="auto-box"><div class="casco" style="background:{PILOTO}"></div><span>Piloto A</span></div>
        <div class="igual">mismo auto<br><b>=</b><br>misma carrera</div>
        <div class="auto-box"><div class="casco" style="background:#C77DFF"></div><span>Piloto B</span></div>
      </div>
      <div class="ecuacion">diferencia entre A y B &nbsp;→&nbsp; <b class="p">efecto piloto</b></div>
      <ul class="pasos">
        <li>Se sacan los abandonos por fallas mecánicas: no son culpa del piloto.</li>
        <li>Se arma un duelo por carrera y por clasificación entre los dos pilotos de cada equipo.</li>
        <li>Se clasifica cada temporada en su era de reglamento.</li>
      </ul>
    </div>
    <div class="metodo-der">
      <div class="dato"><b>{miles(RES['resultados'])}</b><span>resultados de carrera</span></div>
      <div class="dato"><b>{miles(RES['pares_clasificacion'])}</b><span>duelos de clasificación</span></div>
      <div class="dato"><b>{miles(RES['pares_carrera'])}</b><span>duelos de carrera</span></div>
      <div class="fuente">Kaggle · Rohan Rao · <i>Formula 1 World Championship (1950–2024)</i></div>
    </div>
  </div>
  <div class="eras">
    <div style="flex:4"><b>V8</b><span>2010–2013</span></div>
    <div style="flex:8"><b>Turbo híbrido</b><span>2014–2021</span></div>
    <div style="flex:3"><b>Efecto suelo</b><span>2022–2024</span></div>
  </div>"""))

SLIDES.append(marco(4, "Resultado 1", f"""
  <div class="resultado">
    <div class="res-texto">
      <div class="enorme a">{auto_total:.0f}<small>%</small></div>
      <h2>de la diferencia entre pilotos la explica <em class="a">la escudería</em></h2>
      <p>Todos los años queda entre el {min_auto:.0f}% y el {max_auto:.0f}%, muy por encima del 47% que daría si el auto no importara.</p>
      <p>Desde 2021 la curva baja: con el tope presupuestario y los autos de 2022, <b>el auto pesa un poco menos</b>.</p>
      <div class="leyenda"><span><i style="background:{AUTO}"></i>Carrera</span><span><i style="background:{AUTO_CLARO}"></i>Clasificación</span></div>
    </div>
    <div class="res-grafico">{grafico_peso_auto()}</div>
  </div>""", provisorio=True))

SLIDES.append(marco(5, "Resultado 2", f"""
  <div class="resultado duelos">
    <div class="res-texto">
      <h2>Igual hay pilotos que <em class="p">marcan la diferencia</em></h2>
      <p>Porcentaje de clasificaciones en las que le ganaron a su compañero, con el mismo auto.</p>
      <p><b>{lider['piloto'].split()[-1]}</b> le gana {lider['pct']:.0f} de cada 100. Alonso lo hizo en {len(alonso["equipos"])} equipos distintos: eso es el piloto, no el auto.</p>
      <p class="chico">Pilotos con 100 duelos o más · la línea marca el empate (50%).</p>
    </div>
    <div class="tabla-tiempos">{grafico_duelos()}</div>
  </div>""", provisorio=True))

SLIDES.append(marco(6, "Resultado 3", f"""
  <div class="resultado">
    <div class="res-texto">
      <div class="enorme p">{med_antes:.0f}<small>→</small>{med_despues:.0f}</div>
      <h2>posiciones separan a los compañeros en la grilla</h2>
      <p>Distancia típica entre los dos pilotos de un equipo en clasificación, por temporada.</p>
      <p>Desde 2021 la mediana sube y las cajas se estiran: <b>cuando los autos se emparejan, el piloto se nota más</b>.</p>
    </div>
    <div class="res-grafico">{grafico_brecha()}</div>
  </div>""", provisorio=True))

SLIDES.append(marco(7, "Conclusión", f"""
  <div class="conclusion">
    <h2>Pesa más el <em class="a">auto</em>. Pero el <em class="p">piloto</em> decide quién lo aprovecha.</h2>
    <div class="medidor">
      <div class="m-auto" style="flex:{auto_total}">AUTO {auto_total:.0f}%</div>
      <div class="m-piloto" style="flex:{100 - auto_total}">PILOTO Y AZAR {100 - auto_total:.0f}%</div>
    </div>
    <div class="col2">
      <div>
        <h3>Lo que encontramos</h3>
        <ol>
          <li>La escudería explica la mayor parte de la diferencia, todos los años.</li>
          <li>Dentro de un mismo auto, algunos pilotos ganan siempre.</li>
          <li>Con autos más parejos (desde 2021) el piloto pesa más.</li>
        </ol>
      </div>
      <div class="limites">
        <h3>Limitaciones</h3>
        <ul>
          <li>Solo 2010–2024: no se generaliza a otras épocas.</li>
          <li>Pocos equipos por temporada (10 a 12).</li>
          <li>El compañero es otro piloto, no una vara absoluta.</li>
        </ul>
      </div>
    </div>
  </div>""", provisorio=True))

SLIDES.append(f"""
<section class="slide cierre">
  <div class="bandera"></div>
  <div class="cuadros"></div>
  <div class="cierre-texto">
    <div class="kicker">Vuelta 08/08 · Bandera a cuadros</div>
    <h1>¿Preguntas?</h1>
    <div class="ia">
      <h3>Uso de IA en el flujo de trabajo</h3>
      <ul>
        <li><b>Modelo:</b> Claude (Anthropic), usado como agente con contexto del proyecto: consigna, diccionario del dataset y repositorio.</li>
        <li><b>Análisis:</b> generación y depuración del pipeline en pandas (joins por raceId, driverId y constructorId; construcción de duelos; agregaciones con groupby; descomposición de la varianza).</li>
        <li><b>Comunicación:</b> estructura del informe en LaTeX, visualizaciones (matplotlib y SVG) y esta presentación, generada por código.</li>
        <li><b>Validación:</b> cada salida se contrastó contra los datos crudos; las celdas asistidas están marcadas con su prompt.</li>
      </ul>
    </div>
    <div class="links">
      <div><span>Repositorio</span>{REPO}</div>
      <div><span>Sitio web</span>{WEB}</div>
    </div>
  </div>
</section>""")


CSS = f"""
@page {{ size: 1280px 720px; margin: 0; }}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
html, body {{ background: #0B0D12; }}
body {{ font-family: 'Inter', sans-serif; color: {TEXTO}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
.slide {{ width: 1280px; height: 720px; position: relative; overflow: hidden; page-break-after: always;
  background: radial-gradient(1200px 600px at 100% 0%, #1A1E2A 0%, #0B0D12 60%); padding: 92px 72px 64px 88px; }}
.bandera {{ position: absolute; left: 0; top: 0; bottom: 0; width: 22px;
  background: repeating-conic-gradient(#F2F3F5 0 25%, #0B0D12 0 50%) 0 0 / 22px 22px; opacity: .9; }}
.bandera::after {{ content: ""; position: absolute; left: 22px; top: 0; bottom: 0; width: 6px; background: {AUTO}; }}
header {{ position: absolute; top: 30px; left: 88px; right: 72px; display: flex; align-items: center; gap: 22px; }}
.vuelta {{ font-family: 'JetBrains Mono'; font-size: 15px; letter-spacing: .12em; color: {TENUE};
  background: #151821; border: 1px solid {LINEA}; padding: 7px 12px; border-radius: 6px; }}
.vuelta b {{ color: {TEXTO}; font-weight: 700; }}
.vuelta span {{ color: #4A5060; }}
.seccion {{ font-family: 'Inter Display'; font-weight: 800; font-style: italic; text-transform: uppercase;
  letter-spacing: .14em; font-size: 15px; color: {AUTO}; }}
.aviso {{ margin-left: auto; font-family: 'JetBrains Mono'; font-size: 12px; letter-spacing: .1em; text-transform: uppercase;
  color: #FFC53D; border: 1px solid #FFC53D55; background: #FFC53D12; padding: 6px 10px; border-radius: 999px; }}
footer {{ position: absolute; bottom: 24px; left: 88px; right: 72px; display: flex; justify-content: space-between; align-items: center;
  font-size: 12px; color: #4A5060; letter-spacing: .08em; text-transform: uppercase; }}
.sectores {{ display: flex; gap: 6px; }}
.sectores i {{ width: 46px; height: 5px; border-radius: 3px; background: #262A36; }}
.sectores i.on {{ background: #B44DFF; }}
h1, h2, h3 {{ font-family: 'Inter Display'; }}
h2 {{ font-weight: 800; font-size: 44px; line-height: 1.08; letter-spacing: -.02em; }}
em {{ font-style: italic; }}
.a {{ color: {AUTO}; }} .p {{ color: {PILOTO}; }}
b.p {{ color: {PILOTO}; }}

/* portada */
.portada {{ padding: 0; background: #0B0D12; }}
.grilla-fondo {{ position: absolute; inset: 0;
  background:
    linear-gradient(115deg, transparent 0 56%, {AUTO} 56% 56.6%, transparent 56.6% 58%, {AUTO}66 58% 58.4%, transparent 58.4%),
    radial-gradient(900px 500px at 90% 110%, #3EE0FF22, transparent 60%),
    radial-gradient(700px 500px at 10% -10%, #FF2D2D22, transparent 60%); }}
.portada-texto {{ position: absolute; left: 96px; top: 118px; }}
.kicker {{ font-family: 'JetBrains Mono'; font-size: 14px; letter-spacing: .14em; text-transform: uppercase; color: {TENUE}; }}
.portada h1 {{ font-weight: 900; font-style: italic; font-size: 168px; line-height: .9; letter-spacing: -.045em; margin-top: 26px; }}
.portada h1 .o {{ font-weight: 300; color: {TENUE}; font-size: 120px; }}
.portada h1 .p {{ color: {TEXTO}; }}
.bajada {{ margin-top: 28px; font-size: 24px; color: #C4C8D2; max-width: 620px; line-height: 1.35; }}
.semaforo {{ position: absolute; right: 86px; top: 92px; display: flex; gap: 14px; padding: 14px 18px; background: #151821;
  border-radius: 16px; border: 1px solid {LINEA}; }}
.semaforo i {{ width: 30px; height: 30px; border-radius: 50%; background: {AUTO}; box-shadow: 0 0 18px {AUTO}AA; }}
.portada-pie {{ position: absolute; left: 96px; right: 86px; bottom: 56px; display: flex; justify-content: space-between; align-items: flex-end; }}
.portada-pie > div:first-child b {{ display: block; font-size: 20px; font-weight: 600; line-height: 1.5; }}
.cifras {{ display: flex; gap: 40px; }}
.cifras span {{ font-size: 13px; color: {TENUE}; text-transform: uppercase; letter-spacing: .1em; text-align: right; }}
.cifras b {{ display: block; font-family: 'JetBrains Mono'; font-size: 44px; color: {TEXTO}; letter-spacing: -.02em; }}

/* pregunta */
.pregunta h2 {{ font-size: 62px; max-width: 1000px; margin-top: 18px; }}
.tarjetas {{ display: flex; gap: 22px; margin-top: 90px; }}
.tarjeta {{ flex: 1; background: #151821; border: 1px solid {LINEA}; border-radius: 16px; padding: 30px 28px 34px; min-height: 250px; position: relative; overflow: hidden; }}
.tarjeta::before {{ content: ""; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, {AUTO}, {PILOTO}); }}
.tarjeta .num {{ font-family: 'JetBrains Mono'; color: {AUTO}; font-size: 40px; font-weight: 800; }}
.tarjeta h3 {{ font-size: 28px; margin: 40px 0 14px; font-weight: 700; }}
.tarjeta p {{ color: #AEB3BF; font-size: 19px; line-height: 1.45; }}

/* método */
.metodo {{ display: flex; gap: 56px; }}
.metodo-izq {{ flex: 1.55; }}
.metodo-izq h2 {{ font-size: 40px; }}
.garage {{ display: flex; align-items: center; gap: 22px; margin: 30px 0 18px; }}
.auto-box {{ width: 170px; height: 92px; border-radius: 14px; background: #151821; border: 1px solid {LINEA};
  display: flex; align-items: center; gap: 14px; padding: 0 20px; font-weight: 600; font-size: 18px; }}
.casco {{ width: 34px; height: 34px; border-radius: 50% 50% 40% 40%; }}
.igual {{ text-align: center; font-family: 'JetBrains Mono'; font-size: 13px; color: {TENUE}; line-height: 1.5; text-transform: uppercase; letter-spacing: .08em; }}
.igual b {{ font-size: 30px; color: {TEXTO}; }}
.ecuacion {{ font-family: 'JetBrains Mono'; font-size: 18px; color: #C4C8D2; padding: 12px 16px; border-left: 4px solid {PILOTO}; background: #3EE0FF10; display: inline-block; }}
.pasos {{ margin-top: 22px; list-style: none; }}
.pasos li {{ font-size: 17px; color: #AEB3BF; padding: 7px 0 7px 26px; position: relative; line-height: 1.35; }}
.pasos li::before {{ content: ""; position: absolute; left: 0; top: 15px; width: 12px; height: 3px; background: {AUTO}; }}
.metodo-der {{ flex: 1; display: flex; flex-direction: column; gap: 14px; padding-top: 6px; }}
.dato {{ background: #151821; border: 1px solid {LINEA}; border-radius: 14px; padding: 16px 22px; }}
.dato b {{ font-family: 'JetBrains Mono'; font-size: 40px; display: block; letter-spacing: -.02em; }}
.dato span {{ color: {TENUE}; font-size: 14px; text-transform: uppercase; letter-spacing: .08em; }}
.fuente {{ font-size: 13px; color: {TENUE}; margin-top: 4px; }}
.eras {{ position: absolute; left: 88px; right: 72px; bottom: 62px; display: flex; gap: 4px; }}
.eras div {{ background: #151821; border-top: 4px solid #B44DFF; padding: 8px 12px; border-radius: 0 0 8px 8px; display: flex; justify-content: space-between; font-size: 14px; }}
.eras div:nth-child(2) {{ border-color: {PILOTO}; }} .eras div:nth-child(3) {{ border-color: {AUTO}; }}
.eras span {{ font-family: 'JetBrains Mono'; color: {TENUE}; font-size: 13px; }}

/* resultados */
.resultado {{ display: flex; gap: 36px; align-items: center; height: 100%; padding-bottom: 20px; }}
.res-texto {{ flex: 0 0 360px; }}
.res-texto h2 {{ font-size: 30px; line-height: 1.15; }}
.res-texto p {{ color: #AEB3BF; font-size: 17px; line-height: 1.45; margin-top: 16px; }}
.res-texto p b {{ color: {TEXTO}; }}
.res-texto .chico {{ font-size: 13px; color: {TENUE}; }}
.enorme {{ font-family: 'Inter Display'; font-weight: 900; font-style: italic; font-size: 150px; line-height: .9; letter-spacing: -.05em; margin-bottom: 14px; }}
.enorme small {{ font-size: 70px; font-weight: 400; margin: 0 6px; }}
.res-grafico {{ flex: 1; background: #12151D; border: 1px solid {LINEA}; border-radius: 18px; padding: 22px 18px 10px; }}
.res-grafico svg {{ width: 100%; height: auto; display: block; }}
.eje {{ font-family: 'JetBrains Mono'; font-size: 12px; fill: {TENUE}; }}
.nota {{ font-family: 'Inter'; font-size: 12px; fill: {TENUE}; }}
.leyenda {{ display: flex; gap: 22px; margin-top: 22px; font-size: 14px; color: #C4C8D2; }}
.leyenda i {{ display: inline-block; width: 22px; height: 4px; border-radius: 2px; vertical-align: middle; margin-right: 8px; }}
.duelos .res-texto h2 {{ font-size: 36px; }}
.tabla-tiempos {{ flex: 1; background: #12151D; border: 1px solid {LINEA}; border-radius: 18px; padding: 12px 22px; }}
.fila {{ display: flex; align-items: center; gap: 14px; height: 54px; border-bottom: 1px solid #1D212C; }}
.fila:last-child {{ border-bottom: 0; }}
.fila .pos {{ font-family: 'JetBrains Mono'; color: {TENUE}; width: 28px; font-size: 14px; }}
.fila .cod {{ font-family: 'JetBrains Mono'; font-weight: 700; font-size: 15px; width: 58px; padding-left: 10px; border-left: 4px solid; }}
.fila .nombre {{ width: 170px; font-size: 15px; font-weight: 600; line-height: 1.15; }}
.fila .nombre span {{ display: block; font-size: 11px; color: {TENUE}; font-weight: 400; font-family: 'JetBrains Mono'; }}
.pista {{ flex: 1; height: 14px; background: #1A1E28; border-radius: 7px; position: relative; overflow: hidden; }}
.barra {{ height: 100%; border-radius: 7px; }}
.mitad {{ position: absolute; left: 50%; top: -4px; bottom: -4px; width: 2px; background: #FFFFFF55; z-index: 2; }}
.fila .pct {{ font-family: 'JetBrains Mono'; font-weight: 700; font-size: 20px; width: 56px; text-align: right; }}

/* conclusión */
.conclusion h2 {{ font-size: 50px; max-width: 1080px; margin-top: 16px; }}
.medidor {{ display: flex; margin: 40px 0 44px; height: 72px; border-radius: 12px; overflow: hidden; font-family: 'JetBrains Mono'; font-weight: 800; font-size: 20px; letter-spacing: .06em; }}
.medidor div {{ display: flex; align-items: center; padding: 0 20px; }}
.m-auto {{ background: repeating-linear-gradient(115deg, {AUTO} 0 22px, #E52222 22px 44px); }}
.m-piloto {{ background: {PILOTO}; color: #0B0D12; justify-content: center; white-space: nowrap; font-size: 16px; }}
.col2 {{ display: flex; gap: 40px; }}
.col2 > div {{ flex: 1; }}
.col2 h3 {{ font-size: 15px; text-transform: uppercase; letter-spacing: .14em; color: {TENUE}; margin-bottom: 12px; font-weight: 700; }}
.col2 li {{ font-size: 20px; line-height: 1.4; margin: 0 0 8px 22px; color: #D5D8DF; }}
.col2 ol li::marker {{ font-family: 'JetBrains Mono'; color: {AUTO}; font-weight: 700; }}
.limites {{ background: #151821; border: 1px solid {LINEA}; border-radius: 14px; padding: 20px 22px; }}
.limites li {{ font-size: 18px; color: #AEB3BF; }}

/* cierre */
.cierre {{ padding: 0; background: #0B0D12; }}
.cuadros {{ position: absolute; right: -60px; top: -40px; width: 560px; height: 820px; transform: rotate(8deg);
  background: repeating-conic-gradient(#F2F3F5 0 25%, #0B0D12 0 50%) 0 0 / 70px 70px; opacity: .1;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 60%); }}
.cierre-texto {{ position: absolute; left: 96px; top: 64px; right: 96px; }}
.cierre h1 {{ font-weight: 900; font-style: italic; font-size: 140px; letter-spacing: -.045em; margin: 14px 0 26px; line-height: .95; }}
.ia {{ max-width: 760px; border-left: 4px solid {PILOTO}; padding-left: 20px; }}
.ia h3 {{ font-size: 15px; text-transform: uppercase; letter-spacing: .14em; color: {PILOTO}; margin-bottom: 8px; }}
.ia ul {{ list-style: none; }}
.ia li {{ font-size: 16px; line-height: 1.4; color: #C4C8D2; margin-bottom: 7px; }}
.ia li b {{ color: {TEXTO}; font-weight: 600; }}
.links {{ display: flex; gap: 18px; margin-top: 28px; }}
.links div {{ background: #151821; border: 1px solid {LINEA}; border-radius: 12px; padding: 14px 18px; font-family: 'JetBrains Mono'; font-size: 14px; }}
.links span {{ display: block; font-family: 'Inter'; font-size: 12px; color: {TENUE}; text-transform: uppercase; letter-spacing: .1em; margin-bottom: 4px; }}
"""

HTML = f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>¿Piloto o auto?</title>
<style>{CSS}</style></head>
<body>{''.join(SLIDES)}</body></html>"""

SALIDA.write_text(HTML, encoding="utf-8")
print(f"HTML generado: {SALIDA}")
