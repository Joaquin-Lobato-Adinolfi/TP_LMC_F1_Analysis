"""Genera la presentación del TP (8 diapositivas 16:9) como HTML y la exporta a PDF.

Los gráficos se dibujan en SVG a partir de docs/data/f1_data.js, el mismo archivo
que usa la web, que reproduce los cálculos del notebook final. Si cambia el
análisis, se regenera ese archivo con docs/scripts/exportar_datos.py y se vuelve
a correr este script:

    python3 presentacion/generar_presentacion.py
    node presentacion/exportar_pdf.js

PROVISORIO = True agrega un aviso en las diapositivas de resultados (ya no hace
falta: los números son los del notebook final).
"""

import json
from pathlib import Path

PROVISORIO = False

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


_PLANTILLA = (RAIZ / "docs/js/auto.js").read_text(encoding="utf-8")
_PLANTILLA = _PLANTILLA[_PLANTILLA.index("`") + 1:_PLANTILLA.index("`;")]


def auto(color, ident, acento="#F5F6F8"):
    """Auto de F1 visto desde arriba (el mismo dibujo que usa la web)."""
    return _PLANTILLA.replace("__C__", color).replace("__A__", acento).replace("__ID__", ident)


def miles(n):
    return f"{n:,}".replace(",", ".")


# ---------------------------------------------------------------------------
# Gráficos en SVG
# ---------------------------------------------------------------------------

def grafico_efectos(ancho=760, alto=400):
    """Líneas: efecto típico del auto y del piloto sobre la posición final, por temporada."""
    m = dict(izq=44, der=26, arr=30, aba=34)
    serie = DATOS["efectos"]
    y1 = 6.5
    x0, x1 = 2010, 2024

    def px(a):
        return m["izq"] + (a - x0) / (x1 - x0) * (ancho - m["izq"] - m["der"])

    def py(v):
        return m["arr"] + (y1 - v) / y1 * (alto - m["arr"] - m["aba"])

    partes = [f'<svg viewBox="0 0 {ancho} {alto}" width="{ancho}" height="{alto}">']
    for e0, e1, nom in ((2010, 2013, "V8"), (2014, 2021, "TURBO HÍBRIDO"), (2022, 2024, "EFECTO SUELO")):
        partes.append(f'<text x="{(px(e0) + px(e1)) / 2}" y="{m["arr"] - 12}" class="eje" text-anchor="middle">{nom}</text>')
    for v in range(0, 7):
        partes.append(f'<line x1="{m["izq"]}" x2="{ancho - m["der"]}" y1="{py(v)}" y2="{py(v)}" stroke="{LINEA}"/>')
        partes.append(f'<text x="{m["izq"] - 10}" y="{py(v) + 4}" class="eje" text-anchor="end">{v}</text>')
    for a in range(x0, x1 + 1):
        partes.append(f'<text x="{px(a)}" y="{alto - 10}" class="eje" text-anchor="middle">{str(a)[2:]}</text>')
    partes.append(f'<line x1="{px(2021)}" x2="{px(2021)}" y1="{m["arr"]}" y2="{alto - m["aba"]}" stroke="#2BD47D" stroke-opacity=".5" stroke-dasharray="4 4"/>')
    partes.append(f'<text x="{px(2021) - 6}" y="{py(0.35)}" class="nota" text-anchor="end" style="fill:#2BD47D">tope presupuestario</text>')
    banda = " ".join(f"{px(d['year']):.1f},{py(d['auto']):.1f}" for d in serie) + " " + \
        " ".join(f"{px(d['year']):.1f},{py(d['piloto']):.1f}" for d in reversed(serie))
    partes.append(f'<defs><linearGradient id="banda" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{AUTO}" stop-opacity=".28"/>'
                  f'<stop offset="1" stop-color="{PILOTO}" stop-opacity=".12"/></linearGradient></defs>')
    partes.append(f'<polygon points="{banda}" fill="url(#banda)"/>')
    u = serie[-1]
    partes.append(f'<path d="M{px(2024) + 2} {py(u["auto"])} h6 V{py(u["piloto"])} h-6" fill="none" stroke="{TEXTO}" stroke-width="1.5"/>')
    for clave, color in (("auto", AUTO), ("piloto", PILOTO)):
        pts = " ".join(f"{px(d['year']):.1f},{py(d[clave]):.1f}" for d in serie)
        partes.append(f'<polyline points="{pts}" fill="none" stroke="{color}" stroke-width="4" stroke-linejoin="round"/>')
        for d in serie:
            partes.append(f'<circle cx="{px(d["year"]):.1f}" cy="{py(d[clave]):.1f}" r="5" fill="#0B0D12" stroke="{color}" stroke-width="2.5"/>')
    partes.append(f'<text x="{px(2017)}" y="{py(4.11) + 26}" class="rotulo" style="fill:{AUTO}" text-anchor="middle">auto</text>')
    partes.append(f'<text x="{px(2017)}" y="{py(1.58) + 26}" class="rotulo" style="fill:{PILOTO}" text-anchor="middle">piloto</text>')
    partes.append("</svg>")
    return "".join(partes)


def grafico_duelos(n=8, ancho=720):
    """Barras: % de carreras ganadas al compañero (pilotos con al menos 33 duelos)."""
    top = DATOS["duelos"][:n]
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


def grafico_tray(ancho=380, alto=200, piloto=""):
    """Líneas: % de duelos ganados al compañero por temporada, con el color del equipo."""
    m = dict(izq=34, der=20, arr=26, aba=22)
    d = sorted((x for x in DATOS["duelos_anio"] if x["piloto"] == piloto), key=lambda x: x["year"])

    def px(a):
        return m["izq"] + (a - 2010) / 14 * (ancho - m["izq"] - m["der"])

    def py(v):
        return m["arr"] + (100 - v) / 100 * (alto - m["arr"] - m["aba"])

    color = lambda ref: EQUIPOS.get(ref, {}).get("color", TENUE)
    partes = [f'<svg viewBox="0 0 {ancho} {alto}" width="{ancho}" height="{alto}">',
              f'<text x="{m["izq"]}" y="16" class="mini-tit">{piloto}</text>']
    for v in (0, 50, 100):
        trazo = 'stroke="#4A5060" stroke-dasharray="4 4"' if v == 50 else f'stroke="{LINEA}"'
        partes.append(f'<line x1="{m["izq"]}" x2="{ancho - m["der"]}" y1="{py(v)}" y2="{py(v)}" {trazo}/>')
        partes.append(f'<text x="{m["izq"] - 6}" y="{py(v) + 4}" class="eje" text-anchor="end">{v}%</text>')
    for a in (2012, 2016, 2020, 2024):
        partes.append(f'<text x="{px(a)}" y="{alto - 6}" class="eje" text-anchor="middle">{a}</text>')
    for i in range(1, len(d)):
        a0, a1 = d[i - 1], d[i]
        guion = ' stroke-dasharray="3 5"' if a1["year"] - a0["year"] > 1 else ""
        partes.append(f'<line x1="{px(a0["year"]):.1f}" y1="{py(a0["pct"]):.1f}" x2="{px(a1["year"]):.1f}" y2="{py(a1["pct"]):.1f}" '
                      f'stroke="{color(a1["equipo"])}" stroke-width="3"{guion}/>')
    for x in d:
        partes.append(f'<circle cx="{px(x["year"]):.1f}" cy="{py(x["pct"]):.1f}" r="4.5" fill="{color(x["equipo"])}" stroke="#0B0D12" stroke-width="1.5"/>')
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


def coma(x, dec=1):
    return f"{x:.{dec}f}".replace(".", ",")


EF = {d["year"]: d for d in DATOS["efectos"]}
ratio_max = max(DATOS["efectos"], key=lambda d: d["ratio"])
ratio_min = min(DATOS["efectos"], key=lambda d: d["ratio"])
lider, segundo = DATOS["duelos"][0], DATOS["duelos"][1]
alonso = next(d for d in DATOS["duelos"] if d["codigo"] == "ALO")
X = DATOS["exploracion"]

# Cifras de la exploración y el filtrado del notebook (las mismas que exporta la web)
NB = dict(
    resultados=X["filtro"]["total"],          # results 2010–2024
    terminaron=X["filtro"]["terminaron"],     # status "Finished" o "+N Laps"
    pares=RES["pares"],                       # carreras en que terminaron los dos pilotos del equipo
    carreras=RES["carreras"],
    pilotos_carrera=X["pilotos_carrera"],
    escuderias=RES["escuderias"],
)

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
  <div class="velocidad"><i style="top:18%;width:62%"></i><i style="top:34%;width:78%"></i><i style="top:50%;width:90%"></i><i style="top:66%;width:74%"></i><i style="top:82%;width:58%"></i></div>
  <div class="auto-portada">{auto(AUTO, "portada", "#F5F6F8")}</div>
  <div class="kerb"></div>
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
      <div class="tarjeta"><div class="num">01</div><h3>Dónde invertir</h3><p>Le indica a una escudería si poner el foco en el auto o en capacitar y buscar mejores pilotos.</p></div>
      <div class="tarjeta"><div class="num">02</div><h3>Desde 2021, cada peso cuenta</h3><p>El tope presupuestario limita cuánto se puede gastar en desarrollo.</p></div>
      <div class="tarjeta"><div class="num">03</div><h3>El debate de siempre</h3><p>Todo fanático tiene una opinión. Nosotros lo medimos con datos.</p></div>
    </div>
    <div class="definiciones">
      <div><b class="a">Auto</b> = posición media de los dos pilotos de la escudería en cada carrera, analizada por escudería y año.</div>
      <div><b class="p">Talento</b> = resultado del piloto contra su compañero, que maneja el mismo auto en la misma carrera.</div>
    </div>
    <div class="tira">
      <span><b>{RES['carreras']}</b>Grandes Premios</span><span><b>{miles(RES['pares'])}</b>duelos entre compañeros</span>
      <span><b>{RES['escuderias']}</b>escuderías</span><span><b>3</b>reglamentos</span>
    </div>
  </div>"""))

SLIDES.append(marco(3, "Datos y método", f"""
  <div class="metodo">
    <div class="metodo-izq">
      <h2>El compañero de equipo es el <em class="p">grupo de control</em></h2>
      <div class="garage">
        <div class="auto-box">{auto("#3671C6", "ga", "#F5C518")}<span>Piloto A</span></div>
        <div class="igual">mismo auto<br><b>=</b><br>misma carrera</div>
        <div class="auto-box">{auto("#3671C6", "gb", "#F5C518")}<span>Piloto B</span></div>
      </div>
      <div class="ecuacion">posición = media de la carrera − <b class="a">auto</b> − <b class="p">piloto</b></div>
      <ul class="pasos">
        <li>Solo autos que terminaron (<i>Finished</i> o <i>+N vueltas</i>): un abandono es un atípico que no mide ni auto ni piloto.</li>
        <li>Solo carreras en que terminaron <i>los dos</i> pilotos del equipo: si uno abandona, no hay contra quién comparar.</li>
        <li><b class="a">Auto</b>: cuánto se aleja el equipo del promedio de la carrera. <b class="p">Piloto</b>: cuánto se aleja de la media de su equipo. Las dos en posiciones.</li>
      </ul>
    </div>
    <div class="metodo-der">
      <div class="embudo">
        <div class="dato"><b>{miles(NB['resultados'])}</b><span>resultados de carrera</span></div>
        <div class="flecha">terminaron · −{miles(NB['resultados'] - NB['terminaron'])}</div>
        <div class="dato"><b>{miles(NB['terminaron'])}</b><span>autos que terminaron ({NB['terminaron'] / NB['resultados']:.0%})</span></div>
        <div class="flecha">terminaron los dos del equipo</div>
        <div class="dato fin"><b>{miles(NB['pares'])}</b><span>duelos entre compañeros</span></div>
      </div>
      <div class="mini">{NB['carreras']} carreras · {NB['pilotos_carrera']} pilotos · {NB['escuderias']} escuderías</div>
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
      <div class="enorme a">{coma(RES['ratio'])}<small>×</small></div>
      <h2>el <em class="a">auto</em> pesa 2,4 veces más que el <em class="p">piloto</em></h2>
      <p>El auto aleja a su equipo <b>{coma(RES['efecto_auto'], 2)}</b> posiciones del promedio de la carrera; el piloto se aleja <b>{coma(RES['efecto_piloto'], 2)}</b> de su compañero.</p>
      <p>Pasa en <b>las 15 temporadas</b>: el cociente va de {coma(ratio_min['ratio'])} ({ratio_min['year']}) a {coma(ratio_max['ratio'])} ({ratio_max['year']}).</p>
    </div>
    <div class="res-grafico">{grafico_efectos()}
      <div class="leyenda"><span><i style="background:{AUTO}"></i>Efecto del auto</span><span><i style="background:{PILOTO}"></i>Efecto del piloto</span><span style="color:{TENUE}">posiciones, por temporada</span></div>
    </div>
  </div>"""))

SLIDES.append(marco(5, "Resultado 2", f"""
  <div class="resultado duelos">
    <div class="res-texto">
      <h2>Igual hay pilotos que <em class="p">marcan la diferencia</em></h2>
      <p>Porcentaje de carreras en las que terminaron adelante de su compañero, con el mismo auto.</p>
      <p><b>{lider['piloto'].split()[-1]}</b> le gana {lider['pct']:.0f} de cada 100 y <b>{segundo['piloto'].split()[-1]}</b>, {segundo['pct']:.0f}. Alonso lo hizo en {len(alonso["equipos"])} equipos distintos: eso es el piloto, no el auto.</p>
      <p class="chico">Pilotos con {RES['min_duelos']} duelos o más (la mediana) · la línea marca el empate (50%).</p>
    </div>
    <div class="tabla-tiempos">{grafico_duelos()}</div>
  </div>"""))

SLIDES.append(marco(6, "Resultado 3", f"""
  <div class="resultado tray">
    <div class="res-texto">
      <h2>El talento se sostiene, pero <em class="a">el auto</em> lo condiciona</h2>
      <p>Duelos ganados al compañero, temporada por temporada, con el color del equipo.</p>
      <p><b>Alonso</b>: entre 81% y 100% en Ferrari, 44% en su primer año en McLaren. <b>Vettel</b>: del 100% en 2013 al 21% en 2014, con reglamento nuevo.</p>
      <p><b>Verstappen</b> crece hasta el 100% (2020, 2021 y 2024).</p>
    </div>
    <div class="res-grafico cuatro">
      {"".join(grafico_tray(piloto=p) for p in ("Fernando Alonso", "Lewis Hamilton", "Sebastian Vettel", "Max Verstappen"))}
    </div>
  </div>"""))

SLIDES.append(marco(7, "Conclusión", f"""
  <div class="conclusion">
    <h2>Pesa más el <em class="a">auto</em>. El <em class="p">piloto</em> decide dentro de lo que el auto permite.</h2>
    <div class="medidor">
      <div class="fila-medidor"><span>Efecto del auto</span><div class="m-auto" style="width:{RES['efecto_auto'] / 6.6 * 100:.1f}%">{coma(RES['efecto_auto'], 2)} posiciones<span class="m-coche">{auto(AUTO, "ma")}</span></div></div>
      <div class="fila-medidor"><span>Efecto del piloto</span><div class="m-piloto" style="width:{RES['efecto_piloto'] / 6.6 * 100:.1f}%">{coma(RES['efecto_piloto'], 2)}<span class="m-coche">{auto(PILOTO, "mp", "#0B0D12")}</span></div></div>
    </div>
    <div class="col2">
      <div>
        <h3>Lo que encontramos</h3>
        <ol>
          <li>El auto mueve la posición {coma(RES['ratio'])} veces más que el piloto, en las 15 temporadas.</li>
          <li>Dentro de un mismo auto hay pilotos que ganan 4 de cada 5 duelos.</li>
          <li>Desde 2021 los autos están algo más parejos (cociente entre 2,0 y 2,3).</li>
        </ol>
      </div>
      <div class="limites">
        <h3>Limitaciones</h3>
        <ul>
          <li>El talento se mide contra el compañero, no en términos absolutos.</li>
          <li>Quedan afuera los abandonos y las carreras de un solo auto.</li>
          <li>Solo 2010–2024: no se generaliza a otras épocas.</li>
        </ul>
      </div>
    </div>
  </div>"""))

SLIDES.append(f"""
<section class="slide cierre">
  <div class="bandera"></div>
  <div class="cuadros"></div>
  <div class="cierre-texto">
    <div class="auto-cierre">{auto(AUTO, "cierre")}</div>
    <div class="kicker">Vuelta 08/08 · Bandera a cuadros</div>
    <h1>¿Preguntas?</h1>
    <div class="ia">
      <h3>Uso de IA en el flujo de trabajo</h3>
      <ul>
        <li><b>Modelo:</b> Claude (Anthropic), usado como asistente con el contexto del proyecto: consigna, notebook y repositorio.</li>
        <li><b>Análisis:</b> elección de variables y hoja de ruta, filtro de autos terminados (sumar los doblados), <i>transform</i> para armar los pares de compañeros, control de reconstrucción y elección de gráficos.</li>
        <li><b>Comunicación:</b> informe en LaTeX, sitio web y esta presentación, generada por código con los mismos datos.</li>
        <li><b>Validación:</b> controles en el notebook (sumas de carreras, reconstrucción con error 0) y una segunda ejecución del código que reproduce todas las cifras. Las celdas asistidas están marcadas con su prompt.</li>
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
.pregunta h2 {{ font-size: 48px; max-width: 1000px; margin-top: 0; }}
.definiciones {{ display: flex; gap: 22px; margin-top: 22px; }}
.definiciones div {{ flex: 1; font-size: 17px; line-height: 1.4; color: #C4C8D2; padding: 14px 18px; background: #12151D; border-left: 4px solid {LINEA}; border-radius: 0 10px 10px 0; }}
.definiciones div:first-child {{ border-color: {AUTO}; }} .definiciones div:last-child {{ border-color: {PILOTO}; }}
.definiciones b {{ font-family: 'Inter Display'; font-weight: 800; font-style: italic; font-size: 19px; }}
.tarjetas {{ display: flex; gap: 22px; margin-top: 22px; }}
.tarjeta {{ flex: 1; background: #151821; border: 1px solid {LINEA}; border-radius: 16px; padding: 18px 24px 20px; min-height: 0; position: relative; overflow: hidden; }}
.tarjeta::before {{ content: ""; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, {AUTO}, {PILOTO}); }}
.tarjeta .num {{ font-family: 'JetBrains Mono'; color: {AUTO}; font-size: 40px; font-weight: 800; }}
.tarjeta h3 {{ font-size: 24px; margin: 8px 0 8px; font-weight: 700; }}
.tarjeta p {{ color: #AEB3BF; font-size: 17px; line-height: 1.45; }}

/* método */
.metodo {{ display: flex; gap: 56px; }}
.metodo-izq {{ flex: 1.55; }}
.metodo-izq h2 {{ font-size: 40px; }}
.garage {{ display: flex; align-items: center; gap: 22px; margin: 22px 0 14px; }}
.auto-box {{ width: 250px; height: 124px; flex-direction: column; justify-content: center; gap: 2px !important; padding: 6px 14px !important; border-radius: 14px; background: #151821; border: 1px solid {LINEA};
  display: flex; align-items: center; gap: 14px; padding: 0 20px; font-weight: 600; font-size: 18px; }}
.casco {{ width: 34px; height: 34px; border-radius: 50% 50% 40% 40%; }}
.igual {{ text-align: center; font-family: 'JetBrains Mono'; font-size: 13px; color: {TENUE}; line-height: 1.5; text-transform: uppercase; letter-spacing: .08em; }}
.igual b {{ font-size: 30px; color: {TEXTO}; }}
.ecuacion {{ font-family: 'JetBrains Mono'; font-size: 18px; color: #C4C8D2; padding: 12px 16px; border-left: 4px solid {PILOTO}; background: #3EE0FF10; display: inline-block; }}
.pasos {{ margin-top: 14px; list-style: none; }}
.pasos li {{ font-size: 15.5px; color: #AEB3BF; padding: 5px 0 5px 26px; position: relative; line-height: 1.35; }}
.pasos li::before {{ content: ""; position: absolute; left: 0; top: 15px; width: 12px; height: 3px; background: {AUTO}; }}
.metodo-der {{ flex: 1; display: flex; flex-direction: column; gap: 14px; padding-top: 6px; }}
.dato {{ background: #151821; border: 1px solid {LINEA}; border-radius: 14px; padding: 12px 20px; }}
.dato b {{ font-family: 'JetBrains Mono'; font-size: 34px; display: block; letter-spacing: -.02em; }}
.dato span {{ color: {TENUE}; font-size: 14px; text-transform: uppercase; letter-spacing: .08em; }}
.fuente {{ font-size: 13px; color: {TENUE}; margin-top: 2px; }}
.embudo {{ display: flex; flex-direction: column; gap: 6px; }}
.flecha {{ font-family: 'JetBrains Mono'; font-size: 12px; color: {AUTO}; text-transform: uppercase; letter-spacing: .08em; padding-left: 22px; }}
.flecha::before {{ content: "↓ "; }}
.dato.fin {{ border-color: {AUTO}66; background: #FF2D2D10; }}
.mini {{ font-family: 'JetBrains Mono'; font-size: 14px; color: #C4C8D2; padding: 2px 4px; }}
.pasos i {{ color: {TEXTO}; }}
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

.rotulo {{ font-family: 'Inter Display'; font-weight: 800; font-style: italic; font-size: 16px; }}
.mini-tit {{ font-family: 'Inter Display'; font-weight: 800; font-size: 15px; fill: {TEXTO}; }}
.cuatro {{ display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; padding: 16px 14px 10px; }}
.tray .res-texto {{ flex: 0 0 330px; }}
.tray .res-texto h2 {{ font-size: 32px; }}

.velocidad {{ position: absolute; right: 0; top: 300px; width: 760px; height: 210px; }}
.velocidad i {{ position: absolute; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #FFFFFF55 70%, transparent); }}
.auto-portada {{ position: absolute; right: 90px; top: 318px; width: 520px; height: 200px; transform: rotate(-4deg);
  filter: drop-shadow(0 26px 30px #000C) drop-shadow(0 0 40px {AUTO}44); }}
.auto-portada svg, .auto-box svg, .m-coche svg, .auto-cierre svg {{ width: 100%; height: 100%; display: block; }}
.kerb {{ position: absolute; left: 22px; right: 0; bottom: 0; height: 14px;
  background: repeating-linear-gradient(90deg, {AUTO} 0 46px, #F2F3F5 46px 92px); opacity: .9; }}
.tira {{ display: flex; gap: 0; margin-top: 18px; border-top: 1px solid {LINEA}; border-bottom: 1px solid {LINEA}; }}
.tira span {{ flex: 1; padding: 10px 20px; font-size: 13px; color: {TENUE}; text-transform: uppercase; letter-spacing: .1em; border-left: 1px solid {LINEA}; }}
.tira span:first-child {{ border-left: 0; padding-left: 0; }}
.tira b {{ display: block; font-family: 'JetBrains Mono'; font-size: 28px; color: {TEXTO}; letter-spacing: -.02em; margin-bottom: 2px; }}
.m-coche {{ position: absolute; right: -96px; top: -6px; width: 150px; height: 58px; }}
.fila-medidor > div {{ position: relative; }}
.auto-cierre {{ position: absolute; right: -60px; top: 150px; width: 300px; height: 115px; transform: rotate(-12deg); filter: drop-shadow(0 18px 22px #000C); }}

/* conclusión */
.conclusion h2 {{ font-size: 50px; max-width: 1080px; margin-top: 16px; }}
.medidor {{ margin: 30px 0 34px; font-family: 'JetBrains Mono'; font-weight: 800; font-size: 18px; letter-spacing: .04em; }}
.fila-medidor {{ display: flex; align-items: center; gap: 16px; margin-bottom: 10px; }}
.fila-medidor > span {{ width: 190px; flex: none; font-family: 'Inter'; font-weight: 600; font-size: 15px; color: {TENUE}; text-transform: uppercase; letter-spacing: .1em; }}
.fila-medidor > div {{ height: 46px; border-radius: 10px; display: flex; align-items: center; padding: 0 16px; white-space: nowrap; }}
.m-auto {{ background: repeating-linear-gradient(115deg, {AUTO} 0 22px, #E52222 22px 44px); }}
.m-piloto {{ background: {PILOTO}; color: #0B0D12; min-width: 70px; }}
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
