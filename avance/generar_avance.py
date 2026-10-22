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

VERSION = "v1"
FECHA = date(2026, 10, 22)

# ---------------------------------------------------------------------------
# Contenido (editar acá)
# ---------------------------------------------------------------------------

PREGUNTA = ("¿Qué pesa más en el resultado de una carrera de Fórmula 1 (2010–2024): "
            "el rendimiento del auto o el talento del piloto?")

ENFOQUE = ("Comparamos <b>compañeros de equipo</b>: los dos pilotos de una escudería manejan el mismo "
           "auto en la misma carrera. La diferencia entre ellos se atribuye al piloto; la diferencia "
           "entre escuderías, al auto. El período 2010–2024 cubre tres eras de reglamento: motores V8 "
           "(2010–13), turbo híbrido (2014–21) y efecto suelo con tope presupuestario (2022–24).")

# (entregable, estado, detalle)  estado: "ok" | "parcial" | "falta"
ESTADO = [
    ("Notebook Colab (.ipynb)", "parcial",
     "Análisis completo: exploración, pregunta, 3 transformaciones, 3 groupby, 4 gráficos y celdas de IA "
     "marcadas. Falta re-ejecutarlo en Colab con la descarga oficial de Kaggle."),
    ("Informe académico PDF (3–5 págs.)", "parcial",
     "Esqueleto en LaTeX con portada, objetivos y secciones. Faltan resumen, resultados, conclusiones, "
     "reflexión metodológica y el link de Overleaf en el repo."),
    ("Presentación con IA (6–10 diapos.)", "falta", "Todavía no empezada."),
    ("Complemento opcional: sitio web", "falta",
     "Se decidió hacer un sitio web visual con los datos (opción 2 de la consigna)."),
    ("Commits de ambos integrantes", "parcial",
     "Hay commits de Joaquín. Agustín necesita commits propios y significativos antes de la entrega."),
]

TABLAS = [
    # (tabla, filas totales, filas 2010–2024, para qué la usamos)
    ("races.csv", "1.172", "305", "Año, número de fecha y nombre de cada Gran Premio. Define el período."),
    ("results.csv", "27.612", "6.436", "Resultado de cada auto en cada carrera: posición, puntos, estado."),
    ("qualifying.csv", "11.342", "6.412", "Posición de clasificación (sábado). Medida “limpia” del ritmo."),
    ("drivers.csv", "881", "80", "Nombre de los pilotos."),
    ("constructors.csv", "214", "23", "Nombre de las escuderías."),
    ("status.csv", "143", "143", "Motivo de abandono (motor, choque, etc.)."),
]

VARIABLES = [
    ("positionOrder", "results", "Posición final de carrera, sin faltantes (abandonos al final). Variable de resultado."),
    ("position", "qualifying", "Posición de clasificación. Variable de resultado complementaria."),
    ("constructorId", "results / qualifying", "Escudería: identifica el “auto”."),
    ("driverId", "results / qualifying", "Piloto."),
    ("status", "status", "Cómo terminó el auto; se usa para separar abandonos."),
    ("year", "races", "Temporada; permite ver la evolución y las eras de reglamento."),
]

EXPLORACION = [
    "Tabla principal: <b>6.436 resultados</b> (305 carreras, 80 pilotos, 23 escuderías), 25 columnas.",
    "No hay filas duplicadas ni pilotos repetidos dentro de una misma carrera.",
    "Los faltantes vienen como el texto <font name='Mono'>\\N</font>, no como celdas vacías: "
    "<font name='Mono'>position</font> tiene 1.039 (autos que no terminaron) y "
    "<font name='Mono'>time</font>/<font name='Mono'>milliseconds</font> 3.119 (solo el ganador tiene tiempo total).",
    "El 82% de los autos terminó la carrera. Los abandonos más comunes: choques (236), accidentes (137) y motor (105).",
    "<font name='Mono'>grid</font> tiene mínimo 0: son largadas desde boxes.",
]

TRANSFORMACIONES = [
    ("1. Faltantes y tipos de dato",
     "Reemplazamos <font name='Mono'>\\N</font> por <font name='Mono'>NaN</font> y pasamos a número "
     "<font name='Mono'>position</font>, <font name='Mono'>milliseconds</font>, "
     "<font name='Mono'>fastestLap</font> y <font name='Mono'>rank</font>. Creamos la columna "
     "<font name='Mono'>piloto</font> (nombre + apellido).",
     "Sin esto no se puede promediar ninguna posición."),
    ("2. Clasificar el final de cada auto",
     "Columna <font name='Mono'>termino</font>: True si el estado es “Finished” o “+N Laps”. "
     "En carrera usamos solo autos que terminaron.",
     "Un abandono por motor castiga al piloto por algo que no depende de él."),
    ("3. Diferencia contra el compañero",
     "Por carrera y escudería: promedio de los dos autos (<font name='Mono'>media_equipo</font>) y "
     "distancia de cada piloto a ese promedio (<font name='Mono'>dif_vs_companero</font>, negativo = mejor). "
     "Solo equipos con exactamente dos autos comparables.",
     "Es el corazón del método: separa auto y piloto."),
]

GROUPBYS = [
    ("1. Peso del auto por año", "groupby('year')",
     "Descompone la variación de posiciones de cada carrera en parte “auto” (escudería vs. carrera) "
     "y parte “piloto” (piloto vs. su escudería), como un ANOVA. Resultado: el auto explica "
     "<b>85,3%</b> en carrera y en clasificación en todo el período."),
    ("2. Duelos contra el compañero", "groupby('piloto')",
     "Porcentaje de clasificaciones en que cada piloto le ganó a su compañero (mín. 50 duelos). "
     "Arriba: Verstappen 77,9%, Glock 77,2%, Russell 75,0%, Alonso 74,7%."),
    ("3. Nivel del auto por temporada", "groupby(['year', 'constructorId', 'piloto'])",
     "Posición media de clasificación de cada piloto por temporada, cruzada con la de su compañero. "
     "324 temporadas piloto-escudería; correlación <b>0,91</b>."),
]

# (año, carrera % auto, clasificación % auto)
PESO_AUTO = [
    (2010, 84.5, 89.9), (2011, 91.5, 94.0), (2012, 82.8, 87.2), (2013, 87.9, 88.0),
    (2014, 86.0, 87.6), (2015, 88.7, 87.9), (2016, 89.8, 87.7), (2017, 87.2, 83.8),
    (2018, 86.9, 86.3), (2019, 85.8, 84.9), (2020, 81.4, 88.5), (2021, 79.8, 80.4),
    (2022, 82.9, 80.8), (2023, 83.7, 70.2), (2024, 81.4, 76.5),
]

GRAFICOS_INFO = [
    dict(archivo="01_peso_auto_por_anio.png", ancho=16,
         titulo="Gráfico 1 · Peso del auto por año",
         tipo="Líneas (evolución temporal)",
         datos="Groupby 1: % de la variación de posiciones explicada por la escudería, por temporada, "
               "en clasificación y en carrera. Línea punteada: ~47%, lo esperable por azar con 10 equipos de 2 autos.",
         lectura="Siempre muy por encima del azar (70–94%). Pico en 2011 (dominio de Red Bull) y caída desde "
                 "2021: con autos más parejos el piloto pesa más, sobre todo en clasificación (2023: 70%)."),
    dict(archivo="02_duelos_companeros.png", ancho=15,
         titulo="Gráfico 2 · Duelos de clasificación ganados",
         tipo="Barras horizontales (comparación entre categorías)",
         datos="Groupby 2: los 15 pilotos con mayor % de clasificaciones ganadas a su compañero (mín. 50 duelos).",
         lectura="El talento existe y es persistente: algunos le ganan al compañero 3 de cada 4 veces, en varios "
                 "equipos. Ojo: depende de quién fue el compañero (caso Glock, con compañeros debutantes)."),
    dict(archivo="03_piloto_vs_companero.png", ancho=11,
         titulo="Gráfico 3 · Piloto vs. compañero",
         tipo="Dispersión (relación entre dos variables)",
         datos="Groupby 3: cada punto es un piloto en una temporada; eje X la posición media del compañero, "
               "eje Y la propia. Diagonal = misma posición.",
         lectura="r = 0,91: los puntos se pegan a la diagonal. El auto los ubica a lo largo de toda la grilla; "
                 "el piloto los separa de la diagonal apenas 1 a 3 lugares."),
    dict(archivo="04_brecha_companeros_boxplot.png", ancho=16,
         titulo="Gráfico 4 · Distancia entre compañeros",
         tipo="Boxplot (distribución)",
         datos="Posiciones de diferencia entre los dos pilotos de un equipo en cada clasificación, por temporada.",
         lectura="Mediana de 2 posiciones hasta 2020 y 3 desde 2021, contra ~19 entre el primero y el último. "
                 "Las cajas se estiran desde 2021, coherente con el gráfico 1."),
]

RESPUESTA = [
    "<b>El auto pesa mucho más:</b> la escudería explica ~85% de la variación de posiciones; ningún año baja del 70%.",
    "<b>El piloto explica el ~15% restante</b>, y ese efecto es real y persistente (Verstappen, Alonso, Russell).",
    "<b>Pero mueve pocos lugares:</b> correlación 0,91 entre compañeros y brecha típica de 2–3 posiciones.",
    "<b>El balance cambió en 2021–2024:</b> con tope presupuestario y reglamento 2022, el piloto pesa más.",
]

LIMITACIONES = [
    "El “auto” incluye todo lo que comparten los compañeros (estrategia, equipo técnico) y el hecho de que "
    "los mejores pilotos van a los mejores autos: el 85% es una cota superior.",
    "Ganarle al compañero depende de quién sea el compañero.",
    "En carrera se excluyen los abandonos, que mezclan auto (roturas) y piloto (choques).",
    "Las escuderías cambian de nombre (Toro Rosso → AlphaTauri → RB); no afecta la comparación dentro de cada carrera.",
]

PENDIENTES = [
    ("Alta", "Re-ejecutar el notebook en Colab con kagglehub (hoy corrió con el espejo de GitHub) y subirlo ejecutado."),
    ("Alta", "Completar el informe: resumen, resultados con los 4 gráficos, conclusiones y reflexión metodológica. "
             "Pasarlo a Overleaf y poner el link en el README."),
    ("Alta", "Commits significativos de Agustín en el repo (la consigna lo revisa)."),
    ("Alta", "Presentación de 6–10 diapositivas con IA (Canva o PowerPoint Copilot) y su link en el repo."),
    ("Media", "Sitio web visual con los resultados (complemento opcional), publicado en GitHub Pages."),
    ("Media", "Revisión intragrupal del informe: cada uno lo contrasta con el notebook."),
    ("Media", "README: instrucciones para descargar el dataset y links a informe, presentación y web."),
    ("Baja", "Ideas para sumar al análisis: comparar por era de reglamento (V8 / híbrido / efecto suelo), "
             "puntos por temporada piloto vs. compañero, y separar abandonos por fallas del auto vs. choques."),
    ("Baja", "PDF de entrega para el campus: portada con nombres, registro, usuarios de GitHub y links."),
]

# (fecha, versión, cambios)
CAMBIOS = [
    ("22/10/2026", "v1", "Primera versión: datos, transformaciones, groupby, 4 gráficos, respuesta preliminar y pendientes."),
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
    s.append(Paragraph("Del dataset de Kaggle (esquema Ergast, actualizado hasta 2026) usamos 6 de sus 14 tablas. "
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
    s.append(Paragraph("Groupby 1 completo: % de la variación explicada por el auto", h2))
    filas = [[Paragraph(x, cab) for x in ("Año", "Carrera: auto", "Carrera: piloto", "Clasif.: auto", "Clasif.: piloto")]]
    for a, c, q_ in PESO_AUTO:
        filas.append([Paragraph(str(a), celda_b)] +
                     [Paragraph(f"{v:.1f}%".replace(".", ","), celda) for v in (c, 100 - c, q_, 100 - q_)])
    prom_c = sum(x[1] for x in PESO_AUTO) / len(PESO_AUTO)
    prom_q = sum(x[2] for x in PESO_AUTO) / len(PESO_AUTO)
    filas.append([Paragraph("Promedio", celda_b)] +
                 [Paragraph(f"<b>{v:.1f}%</b>".replace(".", ","), celda) for v in (prom_c, 100 - prom_c, prom_q, 100 - prom_q)])
    t = tabla(filas, [2.4 * cm] + [(ancho - 2.4 * cm) / 4] * 4)
    t.setStyle(TableStyle([("LINEABOVE", (0, -1), (-1, -1), 1, TINTA)]))
    s.append(t)

    # 6. Gráficos
    s.append(PageBreak())
    s += seccion(6, "Gráficos")
    s.append(Paragraph("La consigna pide al menos 3 gráficos de tipos distintos; tenemos 4. Todos se exportan desde el "
                       "notebook a <font name='Mono'>graficos/</font> con <font name='Mono'>plt.savefig()</font>.", base))
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
    s += seccion(7, "Respuesta preliminar")
    s += vinetas(RESPUESTA)
    s.append(Paragraph("Limitaciones", h2))
    s += vinetas(LIMITACIONES, chico)

    # 8. Pendientes
    s += seccion(8, "Qué falta")
    filas = [[Paragraph(x, cab) for x in ("Prioridad", "Tarea")]]
    for p, t_ in PENDIENTES:
        filas.append([Paragraph(f"<font color='{PRIORIDAD[p].hexval().replace('0x', '#')}'><b>{p}</b></font>", celda),
                      Paragraph(t_, celda)])
    s.append(tabla(filas, [2.2 * cm, ancho - 2.2 * cm]))

    # 9. Cambios
    s += seccion(9, "Registro de versiones")
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
