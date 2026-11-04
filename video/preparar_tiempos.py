"""Arma video/tiempos.json a partir de la transcripción automática (palabras_asr.json).

Corrige a mano los errores de reconocimiento, recorta los silencios de cada audio
y agrupa las palabras en subtítulos. Uso: python3 video/preparar_tiempos.py
"""
import json, subprocess
from pathlib import Path

DIR = Path(__file__).resolve().parent
ESCENAS = ["A1", "A2", "J3", "J4", "A5", "J6", "A7", "J8"]
# Cuánto silencio se deja antes de la primera palabra y después de la última.
ANTES = {"A1": 2.0}
DESPUES = {"J8": 3.2, "A1": 0.9, "A7": 1.2}

# (escena, palabra reconocida, número de aparición) -> texto correcto ("" la borra)
CORRECCIONES = {
    ("A1", "Augustin", 1): "Agustín",
    ("A1", "fórmula", 1): "Fórmula",
    ("A1", "Ganó", 1): "¿Ganó",
    ("A1", "auto.", 1): "auto?",
    ("A2", "El", 1): "¿El",
    ("A2", "gatos.", 1): "gastos.",
    ("A2", "¿Saber", 1): "Saber",
    ("A2", "más?", 2): "más",
    ("A2", "Les", 1): "les",
    ("A2", "comien", 1): "conviene",
    ("A2", "en", 2): "",
    ("J3", "2", 1): "2.209",
    ("J3", ".209", 1): "",
    ("J3", "2", 2): "2.209",
    ("J3", ".209", 2): "",
    ("J4", "suene", 1): "es",
    ("J4", "añoislado.", 1): "año aislado.",
    ("J4", "Pasan", 1): "Pasa en",
    ("A5", "ganas", 1): "ganás",
    ("A5", "está", 1): "es",
    ("A5", "lento.", 1): "talento.",
    ("J6", "Sebastián", 1): "Sebastian",
    ("A7", "Entonces,", 1): "Entonces,",
    ("A7", "piloto", 1): "¿piloto",
    ("A7", "auto.", 1): "auto?",
    ("A7", "una", 1): "unas",
    ("J8", "cloud", 1): "Claude",
}


def duracion(ruta):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", str(ruta)]))


def main():
    asr = json.loads((DIR / "palabras_asr.json").read_text(encoding="utf-8"))
    salida, inicio = [], 0.0
    for k in ESCENAS:
        vistos, palabras = {}, []
        for t0, t1, w in asr[k]:
            vistos[w] = vistos.get(w, 0) + 1
            nuevo = CORRECCIONES.get((k, w, vistos[w]), w)
            if nuevo == "":
                palabras[-1][1] = t1
                continue
            palabras.append([t0, t1, nuevo, w])
        total = duracion(DIR / "audio" / f"{k}.m4a")
        corte0 = max(0.0, palabras[0][0] - ANTES.get(k, 0.55))
        corte1 = min(total, palabras[-1][1] + DESPUES.get(k, 0.75))
        if k == "J8":
            corte1 = palabras[-1][1] + DESPUES[k]  # se completa con silencio
        palabras = [[round(a - corte0, 2), round(b - corte0, 2), w, orig] for a, b, w, orig in palabras]
        # Subtítulos: una frase por subtítulo; las largas se parten en partes parejas,
        # cortando en una coma si hay una cerca de la mitad.
        frases, actual = [], []
        for i, p in enumerate(palabras):
            actual.append(i)
            if p[2][-1] in ".?!" or i == len(palabras) - 1:
                frases.append(actual); actual = []
        subs = []
        for f in frases:
            while len(f) > 9:
                partes = -(-len(f) // 8)
                corte = round(len(f) / partes)
                comas = [j + 1 for j in range(2, len(f) - 3) if palabras[f[j]][2].endswith(",") and abs(j + 1 - corte) <= 2]
                if comas:
                    corte = min(comas, key=lambda c: abs(c - corte))
                subs.append(f[:corte]); f = f[corte:]
            subs.append(f)
        salida.append({
            "id": k, "voz": "Agustín" if k[0] == "A" else "Joaquín",
            "inicio": round(inicio, 2), "dur": round(corte1 - corte0, 2),
            "recorte": [round(corte0, 2), round(corte1, 2)],
            "palabras": [{"t": a, "f": b, "w": w, "asr": o} for a, b, w, o in palabras],
            "subs": subs,
        })
        inicio += corte1 - corte0
    (DIR / "tiempos.json").write_text(json.dumps(salida, ensure_ascii=False, indent=1), encoding="utf-8")
    (DIR / "tiempos.js").write_text("// Generado por video/preparar_tiempos.py\nwindow.TIEMPOS = "
                                    + json.dumps(salida, ensure_ascii=False) + ";\n", encoding="utf-8")
    for e in salida:
        print(e["id"], e["inicio"], e["dur"], " | ".join(" ".join(e["palabras"][i]["w"] for i in s) for s in e["subs"]))
    print("total", round(inicio, 2))


if __name__ == "__main__":
    main()
