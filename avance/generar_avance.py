"""Genera el PDF de avance del TP (documento vivo).

Uso:  python avance/generar_avance.py
Salida: avance/Avance_TP_F1.pdf

Para actualizarlo: editar las secciones de datos de abajo (ESTADO, GRAFICOS,
PENDIENTES, CAMBIOS, etc.) y volver a correr el script. Los gráficos se leen
de la carpeta graficos/ que exporta el notebook.
"""
import os
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (Image, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate,
                                Spacer, Table, TableStyle)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GRAFICOS = os.path.join(RAIZ, "graficos")
SALIDA = os.path.join(RAIZ, "avance", "Avance_TP_F1.pdf")

VERSION = "v6"
FECHA = date(2026, 11, 3)

# ---------------------------------------------------------------------------
# Contenido (editar acá)
# ---------------------------------------------------------------------------

PREGUNTA = ("¿Qué pesa más en el resultado de una carrera de Fórmula 1 (2010–2024): "
            "el rendimiento del auto o el talento del piloto?")

ENFOQUE = ("Comparamos <b>compañeros de equipo</b>: los dos pilotos de una escudería manejan el mismo "
           "auto en la misma carrera. En cada carrera, la posición de cada piloto se separa en el aporte del "
           "auto (cuánto se aleja su equipo del promedio de la carrera) y el del piloto (cuánto se aleja de la "
           "media de su equipo). El período 2010–2024 cubre tres eras de reglamento: motores V8 "
           "(2010–13), turbo híbrido (2014–21) y efecto suelo (2022–24), con tope presupuestario desde 2021.")

# (entregable, estado, detalle)  estado: "ok" | "parcial" | "falta"
ESTADO = [
    ("Notebook Colab (.ipynb)", "ok",
     "Terminado por Joaquín (3/11): exploración, pregunta a/b/c, filtros, duelos entre compañeros, efecto del auto "
     "y del piloto, 3 gráficos y celdas de IA con su prompt. Lo re-ejecutamos con el mismo dataset y todas las "
     "cifras coinciden. Quedan correcciones menores para Joaquín (sección 9)."),
    ("Informe académico PDF (3–5 págs.)", "ok",
     "informe/informe.tex e informe/informe.pdf: 5 páginas sin portada, con resumen, resultados (3 figuras y una "
     "tabla), conclusiones, limitaciones y reflexión metodológica. Falta subirlo a Overleaf y poner el link."),
    ("Presentación con IA (6–10 diapos.)", "parcial",
     "Diseño final en presentacion/Presentacion_TP_F1.pdf y .pptx (PowerPoint, con el guion en las notas), "
     "8 diapositivas con los resultados finales. Falta darle la pasada con Copilot o Canva, como pide la consigna."),
    ("Complemento opcional: sitio web", "ok",
     "docs/ con los cálculos del notebook final y los tres gráficos (efectos por año, duelos, trayectorias). "
     "Publicado en piloto-o-auto-f1.vercel.app."),
    ("Commits de ambos integrantes", "ok",
     "Joaquín: notebook. Agustín: informe, presentación, web y este avance."),
]

TABLAS = [
    # (tabla, filas totales, filas 2010–2024, para qué la usamos)
    ("races.csv", "1.125", "305", "Año, número de fecha y nombre de cada Gran Premio. Define el período."),
    ("results.csv", "26.759", "6.436", "Resultado de cada auto en cada carrera: posición, grilla, vueltas, estado."),
    ("qualifying.csv", "10.494", "6.412", "Clasificación. Se exploró, pero el análisis final usa solo la carrera."),
    ("drivers.csv", "861", "80", "Nombre de los pilotos."),
    ("constructors.csv", "212", "23", "Nombre de las escuderías."),
    ("status.csv", "139", "139", "Estado final de cada auto (Finished, +1 Lap, Engine, Collision…)."),
]

VARIABLES = [
    ("positionOrder", "results", "Posición final de carrera, completa para todos los autos. Variable de resultado."),
    ("constructorId", "results", "Escudería: identifica el “auto”."),
    ("driverId", "results", "Piloto."),
    ("statusId", "results / status", "Cómo terminó el auto; se usa para quedarse con los que terminaron."),
    ("year", "races", "Temporada; el auto se analiza siempre por escudería y año."),
]

EXPLORACION = [
    "<font name='Mono'>results</font> 2010–2024: <b>6.436 filas</b> × 18 columnas (305 carreras, 80 pilotos, 23 escuderías).",
    "No hay filas duplicadas en ninguna tabla (lo verificamos aparte; el notebook todavía no lo muestra).",
    "Los faltantes vienen como el texto <font name='Mono'>\\N</font>, no como nulos: "
    "<font name='Mono'>position</font> tiene 1.039 (autos que no terminaron) y "
    "<font name='Mono'>time</font>/<font name='Mono'>milliseconds</font> 3.126 (solo tienen tiempo los que terminan en la vuelta del líder).",
    "En <font name='Mono'>qualifying</font> faltan 22 tiempos de Q2 y 46 de Q3 (pilotos eliminados antes).",
    "El 82% de los autos terminó la carrera. Los abandonos más comunes: choques (236), accidentes (137) y motor (105).",
    "Atípico: André Lotterer está en la clasificación pero no entre los que terminaron. Corrió solo Bélgica 2014 y abandonó en la primera vuelta.",
]

TRANSFORMACIONES = [
    ("1. Carreras finalizadas",
     "Se conservan los estados “Finished” y “+N Laps” (34 estados válidos): quedan 5.280 de 6.436 resultados.",
     "Un abandono es un atípico severo que no mide ni auto ni piloto."),
    ("2. Tabla carreras_analisis",
     "Se agregan año, nombre del piloto, escudería y estado con diccionarios y <font name='Mono'>map</font>. "
     "Se descartan puntos, tiempos, número del auto y la grilla (largadas desde boxes).",
     "Tener todo en una sola tabla, sin cruzar tablas a cada paso."),
    ("3. Pares de compañeros",
     "Con <font name='Mono'>groupby + transform</font> se dejan solo las carreras en que terminaron los dos pilotos "
     "del equipo: 2.209 pares. Se calculan <font name='Mono'>team_mean</font>, <font name='Mono'>race_mean</font>, "
     "<font name='Mono'>driver_measure</font> y <font name='Mono'>car_measure</font>.",
     "Es el corazón del método: separa auto y piloto, con control de reconstrucción (error 0)."),
]

GROUPBYS = [
    ("1. Efecto del auto y del piloto por año", "groupby('year')",
     "Raíz del promedio de <font name='Mono'>car_measure²</font> y <font name='Mono'>driver_measure²</font>. "
     "En todo el período el auto mueve <b>4,75</b> posiciones y el piloto <b>1,97</b>: el auto pesa <b>2,4 veces más</b>."),
    ("2. Duelos contra el compañero", "groupby('driverName')",
     "Porcentaje de carreras en que cada piloto terminó adelante de su compañero (mín. 33 duelos, la mediana; 39 pilotos). "
     "Arriba: Verstappen 81,9%, Alonso 77,7%, Russell 66,0%, Norris 64,8%."),
    ("3. Escuderías por año", "groupby(['year', 'constructorName'])",
     "Posición media de cada auto por temporada. Entre el mejor y el peor auto hay en promedio 13,5 posiciones; "
     "entre compañeros, 3,1 (mediana 2)."),
]

# (año, efecto auto, efecto piloto, cociente) — tabla auto_vs_piloto del notebook
EFECTOS = [
    (2010, 4.85, 2.08, 2.33), (2011, 5.61, 1.71, 3.29), (2012, 5.20, 2.37, 2.19), (2013, 5.10, 1.89, 2.70),
    (2014, 4.59, 1.86, 2.47), (2015, 4.58, 1.64, 2.80), (2016, 5.03, 1.69, 2.97), (2017, 4.11, 1.58, 2.60),
    (2018, 4.36, 1.70, 2.57), (2019, 4.73, 1.92, 2.46), (2020, 4.47, 2.14, 2.09), (2021, 4.51, 2.27, 1.99),
    (2022, 4.45, 2.02, 2.20), (2023, 4.58, 2.02, 2.27), (2024, 4.66, 2.23, 2.09),
]
EFECTO_TOTAL = (4.75, 1.97, 2.41)

GRAFICOS_INFO = [
    dict(archivo="grafico_1_auto_vs_piloto.png", ancho=16,
         titulo="Gráfico 1 · Efecto del auto y del piloto por temporada",
         tipo="Líneas superpuestas (evolución temporal)",
         datos="Groupby 1: efecto típico del auto y del piloto sobre la posición final, por temporada.",
         lectura="El auto está siempre por encima: nunca baja de 4,1 posiciones y el piloto nunca pasa de 2,4. "
                 "Desde el tope presupuestario (2021) los dos efectos quedan más estables."),
    dict(archivo="grafico_2_duelos_ganados.png", ancho=14,
         titulo="Gráfico 2 · Duelos ganados al compañero",
         tipo="Barras horizontales (comparación entre categorías)",
         datos="Groupby 2: los 15 pilotos con mayor % de carreras ganadas a su compañero (mín. 33 duelos).",
         lectura="El talento existe: Verstappen y Alonso le ganan al compañero cerca de 4 de cada 5 carreras. "
                 "Pero eso equivale a unas 2,4 posiciones de ventaja, mucho menos que la distancia entre autos."),
    dict(archivo="grafico_3_talento_sostenido.png", ancho=16,
         titulo="Gráfico 3 · Talento sostenido de cuatro campeones",
         tipo="Líneas y puntos por equipo (cuatro paneles)",
         datos="% de duelos ganados por temporada de Alonso, Hamilton, Vettel y Verstappen, con el color del equipo.",
         lectura="Alonso 81–100% en Ferrari y 44% en su primer año en McLaren; Vettel del 100% (2013) al 21% (2014); "
                 "Verstappen crece hasta el 100%. El talento se sostiene, pero el auto y el compañero lo condicionan."),
]

RESPUESTA = [
    "<b>Pesa más el auto:</b> mueve la posición unas 4,75 posiciones contra 1,97 del piloto, <b>2,4 veces más</b>.",
    "<b>Todos los años:</b> el cociente va de 1,99 (2021) a 3,29 (2011); por era, 2,57 (V8), 2,44 (híbrido) y 2,18 (efecto suelo).",
    "<b>El talento existe:</b> Verstappen (81,9%) y Alonso (77,7%) le ganan a su compañero cerca de 4 de cada 5 carreras.",
    "<b>Desde 2021 algo más parejo</b>, pero el piloto nunca se acerca al auto. Para un equipo, conviene priorizar el auto.",
]

LIMITACIONES = [
    "El talento se mide contra el compañero, no en términos absolutos: dos pilotos muy buenos en un mismo equipo parecen promedio.",
    "Solo carreras en que terminaron los dos pilotos: los abandonos (auto o piloto) quedan afuera.",
    "La posición final también refleja estrategia, órdenes de equipo e incidentes.",
    "Solo 2010–2024: no se generaliza a otras épocas.",
]

PENDIENTES = [
    ("Alta", "Joaquín: correcciones del notebook (revisar duplicados, texto de Lotterer, celdas de texto antes de las "
             "celdas 189 y 190, signos de la fórmula en la celda 171). Detalle en notebook/correcciones_notebook.md "
             "de los archivos del proyecto."),
    ("Alta", "Presentación: abrir el .pptx en PowerPoint y darle una pasada con Copilot (o importarlo en Canva), y ensayar (~6 min)."),
    ("Alta", "PDF de entrega para el campus: completar los números de registro en entrega/entrega.tex y compilarlo."),
    ("Alta", "Informe: subir informe.tex y los gráficos a Overleaf y poner el link en el README."),
    ("Media", "Revisión intragrupal del informe: cada uno lo contrasta con el notebook."),
    ("Media", "Video (complemento opcional): se arma después."),
]

# Entregables en curso: (título, archivo, [(parte, estado, detalle)])
ENTREGABLES = [
    ("Informe académico", "informe/informe.pdf", [
        ("Portada", "ok", "Nombres, materia, facultad, cuatrimestre y repositorio."),
        ("§1 Resumen", "ok", "Pregunta, datos, método y resultado (2,4 veces)."),
        ("§2 Introducción", "ok", "Motivación, pregunta, objetivos, dataset y fuente."),
        ("§3 Datos y metodología", "ok", "Variables, 4 transformaciones, descomposición de la posición y método."),
        ("§4 Resultados", "ok", "Auto contra auto, efectos por año (figura 1 y tabla por era), duelos (figura 2) y trayectorias (figura 3)."),
        ("§5 Conclusiones", "ok", "Respuesta directa, limitaciones y extensiones."),
        ("§6 Reflexión metodológica", "ok", "Uso de IA, verificaciones y aprendizajes."),
        ("Overleaf", "falta", "Subirlo y poner el link en el repositorio."),
    ]),
    ("Presentación", "presentacion/Presentacion_TP_F1.pdf", [
        ("1 Portada", "ok", "¿Piloto o auto? · Agustín (0:20)."),
        ("2 La pregunta", "ok", "Motivación y definiciones de auto y talento del notebook · Agustín (0:45)."),
        ("3 Datos y método", "ok", "Compañero como grupo de control; 6.436 → 5.280 → 2.209 duelos · Joaquín (1:00)."),
        ("4 Resultado 1", "ok", "El auto pesa 2,4 veces más (gráfico 1) · Joaquín (1:00)."),
        ("5 Resultado 2", "ok", "Pilotos que marcan diferencia (gráfico 2) · Agustín (0:50)."),
        ("6 Resultado 3", "ok", "Talento sostenido de cuatro campeones (gráfico 3) · Joaquín (0:50)."),
        ("7 Conclusión", "ok", "Respuesta, barras 4,75 contra 1,97 y limitaciones · Agustín (0:50)."),
        ("8 Cierre", "ok", "Uso de IA y links · Joaquín (0:25)."),
        ("PowerPoint", "ok", "Presentacion_TP_F1.pptx con el guion en las notas."),
        ("Canva / Copilot", "falta", "La consigna pide hacerla con una de esas herramientas: abrir el .pptx y darle una pasada."),
    ]),
    ("Sitio web", "docs/index.html", [
        ("Largada y vuelta 0", "ok", "Intro animada y exploración y filtros del notebook."),
        ("Auto vs piloto", "ok", "Efecto del auto y del piloto por año (gráfico 1)."),
        ("Duelos y trayectorias", "ok", "Ranking de duelos (gráfico 2) y trayectorias de cuatro campeones (gráfico 3)."),
        ("Autos", "ok", "Dibujo nuevo de un F1 2022 visto desde arriba (js/auto.js), también usado en la presentación."),
        ("Espejo, brecha y simulador", "ok", "Piloto contra compañero (r = 0,92), distancia entre compañeros y \u201ccambio de asiento\u201d."),
        ("Publicación", "ok", "Publicada en Vercel: piloto-o-auto-f1.vercel.app."),
    ]),
]

# (fecha, versión, cambios)
CAMBIOS = [
    ("22/10/2026", "v1", "Primera versión: datos, transformaciones, groupby, 4 gráficos, respuesta preliminar y pendientes."),
    ("27/10/2026", "v2", "Suma la web en docs/ (PR #3), la estructura y el guion de la presentación (PR #4) y la introducción "
                         "y metodología del informe (PR #5). Aviso de que el notebook se está rehaciendo y los resultados "
                         "son provisorios. Pendientes actualizados."),
    ("27/10/2026", "v3", "Suma la presentación en PDF con diseño propio (PR #7) y reescribe en lenguaje técnico la "
                         "diapositiva de uso de IA."),
    ("02/11/2026", "v4", "Suma el avance del notebook de Joaquín y pasa sus definiciones, filtros y cifras a las "
                         "diapositivas 2 y 3 de la presentación. Como el notebook nuevo ya no usa el 85/15%, las "
                         "diapositivas 4 y 7 pasan a comparar auto contra auto y piloto contra compañero, igual "
                         "que el informe. Resultados siguen provisorios."),
    ("03/11/2026", "v5", "Notebook final de Joaquín: resultados definitivos (el auto pesa 2,4 veces más). Informe completo "
                         "en PDF, presentación y web con las cifras y los tres gráficos finales, sin marcas de provisorio. "
                         "Corrige las tablas de datos con los tamaños del dataset que usa el notebook. Suma las correcciones "
                         "pendientes del notebook."),
    ("03/11/2026", "v6", "Diseño final de la presentación (autos de F1, franjas de pianito, banda entre curvas) y versión "
                         "PowerPoint con el guion en las notas. Autos nuevos en la web. Suma el PDF de entrega para el campus. Web publicada en Vercel."),
]

# ---------------------------------------------------------------------------
# Estilo
# ---------------------------------------------------------------------------

pdfmetrics.registerFont(TTFont("Sans", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("Sans-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("Mono", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"))
pdfmetrics.registerFontFamily("Sans", normal="Sans", bold="Sans-Bold", italic="Sans", boldItalic="Sans-Bold")

ROJO = colors.HexColor("#e10600")
TINTA = colors.HexColor("#15151e")
GRIS = colors.HexColor("#6b6b75")
LINEA = colors.HexColor("#dcdce2")
FONDO = colors.HexColor("#f4f4f6")
ESTADOS = {"ok": ("Listo", colors.HexColor("#1f8a4c")),
           "parcial": ("En curso", colors.HexColor("#d98a00")),
           "falta": ("Falta", ROJO)}
PRIORIDAD = {"Alta": ROJO, "Media": colors.HexColor("#d98a00"), "Baja": GRIS}

base = ParagraphStyle("base", fontName="Sans", fontSize=9.5, leading=13.5, textColor=TINTA, alignment=TA_LEFT)
chico = ParagraphStyle("chico", parent=base, fontSize=8.5, leading=11.5)
gris = ParagraphStyle("gris", parent=chico, textColor=GRIS)
h1 = ParagraphStyle("h1", parent=base, fontName="Sans-Bold", fontSize=16, leading=20, spaceBefore=6, spaceAfter=8)
h2 = ParagraphStyle("h2", parent=base, fontName="Sans-Bold", fontSize=11.5, leading=15, spaceBefore=8, spaceAfter=4, keepWithNext=1)
celda = ParagraphStyle("celda", parent=chico)
celda_b = ParagraphStyle("celda_b", parent=chico, fontName="Sans-Bold")
cab = ParagraphStyle("cab", parent=chico, fontName="Sans-Bold", textColor=colors.white)


def seccion(n, titulo):
    t = Table([[Paragraph(f"<font color='#e10600'>{n:02d}</font>", h1), Paragraph(titulo, h1)]],
              colWidths=[1.3 * cm, None])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "BOTTOM"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("LINEBELOW", (0, 0), (-1, -1), 1.2, TINTA), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
    return [Spacer(1, 6), t, Spacer(1, 8)]


def tabla(filas, anchos, encabezado=True, zebra=True):
    t = Table(filas, colWidths=anchos, repeatRows=1 if encabezado else 0)
    estilo = [("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 4),
              ("BOTTOMPADDING", (0, 0), (-1, -1), 4), ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINEA)]
    if encabezado:
        estilo += [("BACKGROUND", (0, 0), (-1, 0), TINTA)]
    if zebra:
        for i in range(1 if encabezado else 0, len(filas)):
            if i % 2 == 0:
                estilo.append(("BACKGROUND", (0, i), (-1, i), FONDO))
    t.setStyle(TableStyle(estilo))
    return t


def vinetas(items, estilo=base):
    return [Paragraph(f"<font color='#e10600'>■</font>&nbsp;&nbsp;{x}", estilo) for x in items] + [Spacer(1, 4)]


def pie(canvas, doc):
    canvas.saveState()
    w, h = A4
    if doc.page > 1:
        canvas.setFillColor(ROJO)
        canvas.rect(0, h - 0.35 * cm, w, 0.35 * cm, stroke=0, fill=1)
        canvas.setFont("Sans", 7.5)
        canvas.setFillColor(GRIS)
        canvas.drawString(2 * cm, 1.2 * cm, f"TP F1 · Avance {VERSION} · {FECHA.strftime('%d/%m/%Y')}")
        canvas.drawRightString(w - 2 * cm, 1.2 * cm, f"{doc.page}")
    canvas.restoreState()


def portada(canvas, doc):
    w, h = A4
    canvas.saveState()
    canvas.setFillColor(TINTA)
    canvas.rect(0, 0, w, h, stroke=0, fill=1)
    # franjas diagonales tipo "kerb"
    canvas.setFillColor(ROJO)
    for i in range(14):
        p = canvas.beginPath()
        x = w - 9 * cm + i * 1.4 * cm
        p.moveTo(x, h); p.lineTo(x + 0.7 * cm, h); p.lineTo(x - 5 * cm, h - 7 * cm); p.lineTo(x - 5.7 * cm, h - 7 * cm)
        p.close()
        canvas.drawPath(p, stroke=0, fill=1 if i % 2 == 0 else 0)
    canvas.setFillColor(ROJO)
    canvas.rect(2 * cm, h - 12.2 * cm, 2.2 * cm, 0.25 * cm, stroke=0, fill=1)
    canvas.setFillColor(colors.white)
    canvas.setFont("Sans-Bold", 34)
    canvas.drawString(2 * cm, h - 14 * cm, "¿Auto o piloto?")
    canvas.setFont("Sans", 15)
    canvas.drawString(2 * cm, h - 15.1 * cm, "Fórmula 1, 2010–2024 · Informe de avance")
    canvas.setFont("Sans", 10)
    canvas.setFillColor(colors.HexColor("#b8b8c2"))
    lineas = ["Laboratorio de Métodos Cuantitativos Aplicados a la Gestión · FCE UBA · 2C 2026",
              "Agustín Mier Torre · Joaquín Lobato Adinolfi",
              "Repo: github.com/Joaquin-Lobato-Adinolfi/TP_LMC_F1_Analysis",
              "Dataset: Kaggle · rohanrao/formula-1-world-championship-1950-2020"]
    for i, l in enumerate(lineas):
        canvas.drawString(2 * cm, h - 17 * cm - i * 0.6 * cm, l)
    canvas.setFillColor(colors.white)
    canvas.setFont("Sans-Bold", 11)
    canvas.drawString(2 * cm, 3 * cm, f"Versión {VERSION} · {FECHA.strftime('%d/%m/%Y')}")
    canvas.setFont("Sans", 9)
    canvas.setFillColor(colors.HexColor("#b8b8c2"))
    canvas.drawString(2 * cm, 2.4 * cm, "Documento vivo: se regenera con avance/generar_avance.py a medida que avanza el TP.")
    canvas.drawString(2 * cm, 1.9 * cm, "Entrega: viernes 6/11/2026, antes de clase.")
    canvas.restoreState()


# ---------------------------------------------------------------------------
# Armado
# ---------------------------------------------------------------------------

def construir():
    doc = SimpleDocTemplate(SALIDA, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm,
                            topMargin=1.8 * cm, bottomMargin=1.8 * cm,
                            title="TP F1 · Informe de avance", author="Mier Torre, Lobato Adinolfi")
    ancho = A4[0] - 4 * cm
    s = [PageBreak()]

    # 1. Estado
    s += seccion(1, "Dónde estamos")
    dias = (date(2026, 11, 6) - FECHA).days
    s.append(Paragraph(f"Faltan <b>{dias} días</b> para la entrega. Estado de cada parte obligatoria de la consigna:", base))
    s.append(Spacer(1, 6))
    filas = [[Paragraph("Entregable", cab), Paragraph("Estado", cab), Paragraph("Detalle", cab)]]
    for nombre, est, det in ESTADO:
        txt, col = ESTADOS[est]
        filas.append([Paragraph(nombre, celda_b),
                      Paragraph(f"<font color='{col.hexval().replace('0x', '#')}'>●</font> {txt}", celda),
                      Paragraph(det, celda)])
    s.append(tabla(filas, [4.6 * cm, 2.2 * cm, ancho - 6.8 * cm]))

    # 2. Pregunta
    s += seccion(2, "Pregunta y enfoque")
    q = Table([[Paragraph(f"<b>{PREGUNTA}</b>", ParagraphStyle("q", parent=base, fontSize=11.5, leading=16))]],
              colWidths=[ancho])
    q.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), FONDO), ("LINEBEFORE", (0, 0), (0, -1), 3, ROJO),
                           ("LEFTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 8),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))
    s += [q, Spacer(1, 6), Paragraph(ENFOQUE, base)]

    # 3. Datos
    s += seccion(3, "Qué datos usamos")
    s.append(Paragraph("Del dataset de Kaggle (esquema Ergast, actualizado hasta 2024) usamos 6 de sus 14 tablas. "
                       "Filtramos <font name='Mono'>races</font> a 2010–2024 y con esos "
                       "<font name='Mono'>raceId</font> filtramos el resto.", base))
    s.append(Spacer(1, 6))
    filas = [[Paragraph(x, cab) for x in ("Tabla", "Filas totales", "Filas 2010–24", "Para qué")]]
    for t, a, b, d in TABLAS:
        filas.append([Paragraph(f"<font name='Mono'>{t}</font>", celda), Paragraph(a, celda),
                      Paragraph(f"<b>{b}</b>", celda), Paragraph(d, celda)])
    s.append(tabla(filas, [3.6 * cm, 2.1 * cm, 2.3 * cm, ancho - 8 * cm]))
    s.append(Paragraph("Variables clave", h2))
    filas = [[Paragraph(x, cab) for x in ("Variable", "Tabla", "Rol en el análisis")]]
    for v, t, d in VARIABLES:
        filas.append([Paragraph(f"<font name='Mono'>{v}</font>", celda), Paragraph(t, celda), Paragraph(d, celda)])
    s.append(tabla(filas, [3.3 * cm, 3.3 * cm, ancho - 6.6 * cm]))
    s.append(Paragraph("Exploración y calidad", h2))
    s += vinetas(EXPLORACION)

    # 4. Transformaciones
    s += seccion(4, "Transformaciones")
    filas = [[Paragraph(x, cab) for x in ("Transformación", "Qué hicimos", "Por qué")]]
    for t, q_, p in TRANSFORMACIONES:
        filas.append([Paragraph(t, celda_b), Paragraph(q_, celda), Paragraph(p, celda)])
    s.append(tabla(filas, [3.6 * cm, ancho - 8.1 * cm, 4.5 * cm]))

    # 5. Groupby
    s += seccion(5, "Resúmenes agrupados")
    for t, code, d in GROUPBYS:
        s.append(KeepTogether([Paragraph(f"{t} &nbsp;<font name='Mono' color='#6b6b75' size='8'>{code}</font>", h2),
                               Paragraph(d, base)]))
    s.append(Paragraph("Groupby 1 completo: efecto del auto y del piloto, en posiciones", h2))
    filas = [[Paragraph(x, cab) for x in ("Año", "Efecto del auto", "Efecto del piloto", "Cociente")]]
    for a, c, d, r in EFECTOS:
        filas.append([Paragraph(str(a), celda_b)] +
                     [Paragraph(f"{v:.2f}".replace(".", ","), celda) for v in (c, d, r)])
    filas.append([Paragraph("Total", celda_b)] +
                 [Paragraph(f"<b>{v:.2f}</b>".replace(".", ","), celda) for v in EFECTO_TOTAL])
    t = tabla(filas, [2.4 * cm] + [(ancho - 2.4 * cm) / 3] * 3)
    t.setStyle(TableStyle([("LINEABOVE", (0, -1), (-1, -1), 1, TINTA)]))
    s.append(t)

    # 6. Gráficos
    s.append(PageBreak())
    s += seccion(6, "Gráficos")
    s.append(Paragraph("La consigna pide al menos 3 gráficos de tipos distintos. Son los tres del notebook final, "
                       "exportados con <font name='Mono'>plt.savefig()</font> y guardados en "
                       "<font name='Mono'>graficos/</font>.", base))
    for g in GRAFICOS_INFO:
        ruta = os.path.join(GRAFICOS, g["archivo"])
        img = Image(ruta)
        w = g["ancho"] * cm
        img.drawWidth, img.drawHeight = w, w * img.imageHeight / img.imageWidth
        ficha = tabla([[Paragraph("Tipo", celda_b), Paragraph(g["tipo"], celda)],
                       [Paragraph("Qué datos muestra", celda_b), Paragraph(g["datos"], celda)],
                       [Paragraph("Cómo se lee", celda_b), Paragraph(g["lectura"], celda)],
                       [Paragraph("Archivo", celda_b), Paragraph(f"<font name='Mono'>graficos/{g['archivo']}</font>", celda)]],
                      [3.4 * cm, ancho - 3.4 * cm], encabezado=False, zebra=False)
        s.append(KeepTogether([Spacer(1, 10), Paragraph(g["titulo"], h2), img, Spacer(1, 6), ficha]))

    # 7. Respuesta
    s.append(PageBreak())
    s += seccion(7, "Respuesta")
    s.append(Paragraph("Con los resultados del notebook final, los mismos del informe, la presentación y la web.", gris))
    s.append(Spacer(1, 4))
    s += vinetas(RESPUESTA)
    s.append(Paragraph("Limitaciones", h2))
    s += vinetas(LIMITACIONES, chico)

    # 8. Entregables en curso
    s.append(PageBreak())
    s += seccion(8, "Entregables en curso")
    for titulo, archivo, partes in ENTREGABLES:
        filas = [[Paragraph(x, cab) for x in ("Parte", "Estado", "Contenido")]]
        for parte, est, det in partes:
            txt, col = ESTADOS[est]
            filas.append([Paragraph(parte, celda_b),
                          Paragraph(f"<font color='{col.hexval().replace('0x', '#')}'>●</font> {txt}", celda),
                          Paragraph(det, celda)])
        s.append(KeepTogether([Paragraph(f"{titulo} &nbsp;<font name='Mono' color='#6b6b75' size='8'>{archivo}</font>", h2),
                               tabla(filas, [4 * cm, 2.2 * cm, ancho - 6.2 * cm])]))

    # 9. Pendientes
    s.append(PageBreak())
    s += seccion(9, "Qué falta")
    filas = [[Paragraph(x, cab) for x in ("Prioridad", "Tarea")]]
    for p, t_ in PENDIENTES:
        filas.append([Paragraph(f"<font color='{PRIORIDAD[p].hexval().replace('0x', '#')}'><b>{p}</b></font>", celda),
                      Paragraph(t_, celda)])
    s.append(tabla(filas, [2.2 * cm, ancho - 2.2 * cm]))

    # 10. Cambios
    s += seccion(10, "Registro de versiones")
    filas = [[Paragraph(x, cab) for x in ("Fecha", "Versión", "Cambios")]]
    for f, v, c in CAMBIOS:
        filas.append([Paragraph(f, celda), Paragraph(v, celda_b), Paragraph(c, celda)])
    s.append(tabla(filas, [2.4 * cm, 1.8 * cm, ancho - 4.2 * cm]))
    s.append(Spacer(1, 10))
    s.append(Paragraph("Uso de IA: el análisis del notebook y este documento se armaron con asistencia de Claude "
                       "(Anthropic). Las celdas asistidas están marcadas en el notebook con su prompt. "
                       "La revisión y la interpretación son del grupo.", gris))

    doc.build(s, onFirstPage=portada, onLaterPages=pie)
    print("PDF generado:", SALIDA)


if __name__ == "__main__":
    construir()
