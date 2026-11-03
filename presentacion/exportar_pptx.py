"""Arma Presentacion_TP_F1.pptx: una diapositiva por imagen (16:9) con el guion en las notas.

Uso (después de generar el HTML):
    node presentacion/exportar_pdf.js --png presentacion/png
    python3 presentacion/exportar_pptx.py
Se abre en PowerPoint (o Google Slides) y se puede seguir editando con Copilot.
"""
import re
from pathlib import Path

from pptx import Presentation
from pptx.util import Emu

DIR = Path(__file__).resolve().parent
PNG = DIR / "png"

guion = (DIR / "estructura_y_guion.md").read_text(encoding="utf-8")
notas = []
for bloque in re.split(r"\n### \d+\. ", guion)[1:]:
    m = re.search(r"\*\*Guion\*\*\n(.*?)(?:\n---|\Z)", bloque, re.S)
    texto = m.group(1) if m else ""
    notas.append("\n".join(l.lstrip("> ").strip() for l in texto.strip().splitlines()))

prs = Presentation()
prs.slide_width, prs.slide_height = Emu(12192000), Emu(6858000)
for i, img in enumerate(sorted(PNG.glob("s*.png"), key=lambda p: int(p.stem[1:]))):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    s.shapes.add_picture(str(img), 0, 0, prs.slide_width, prs.slide_height)
    if i < len(notas):
        s.notes_slide.notes_text_frame.text = notas[i]
prs.save(DIR / "Presentacion_TP_F1.pptx")
print("PPTX generado con", len(prs.slides), "diapositivas")
