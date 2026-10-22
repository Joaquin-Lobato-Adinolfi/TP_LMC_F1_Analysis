"""Exporta los datos que usa la web (docs/data/f1_data.js) a partir del dataset de Kaggle.

Reproduce los mismos cálculos del notebook (secciones 3 a 5) y los guarda en un
archivo JS (window.F1_DATA = {...}) para que la web funcione abriendo index.html
directamente, sin servidor.

Uso:
    python docs/scripts/exportar_datos.py RUTA_A_LOS_CSV
    # RUTA_A_LOS_CSV = carpeta con races.csv, results.csv, drivers.csv,
    # constructors.csv, qualifying.csv y status.csv (la descarga de kagglehub)
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

path = Path(sys.argv[1] if len(sys.argv) > 1 else "f1_data")
salida = Path(__file__).resolve().parent.parent / "data" / "f1_data.js"

# ---------- Carga y filtro 2010-2024 (igual que el notebook) ----------
races_all = pd.read_csv(path / "races.csv")
races = races_all[(races_all["year"] >= 2010) & (races_all["year"] <= 2024)]
results = pd.read_csv(path / "results.csv")
results = results[results["raceId"].isin(races["raceId"])]
drivers = pd.read_csv(path / "drivers.csv")
drivers = drivers[drivers["driverId"].isin(results["driverId"])]
constructors = pd.read_csv(path / "constructors.csv")
constructors = constructors[constructors["constructorId"].isin(results["constructorId"])]
qualifying = pd.read_csv(path / "qualifying.csv")
qualifying = qualifying[qualifying["raceId"].isin(races["raceId"])]
status = pd.read_csv(path / "status.csv")

df = (results
      .merge(races[["raceId", "year", "round", "name"]], on="raceId")
      .merge(drivers[["driverId", "forename", "surname"]], on="driverId")
      .merge(constructors[["constructorId", "name"]].rename(columns={"name": "escuderia"}), on="constructorId")
      .merge(status, on="statusId"))

resumen = {
    "resultados": int(len(df)),
    "carreras": int(df["raceId"].nunique()),
    "pilotos": int(df["driverId"].nunique()),
    "escuderias": int(df["constructorId"].nunique()),
}

# ---------- Transformaciones ----------
df = df.replace("\\N", np.nan)
for col in ["position", "milliseconds", "fastestLap", "rank"]:
    df[col] = pd.to_numeric(df[col])
df["piloto"] = df["forename"] + " " + df["surname"]
df["termino"] = df["status"].eq("Finished") | df["status"].str.match(r"^\+\d+ Laps?$")
resumen["pct_terminaron"] = round(float(df["termino"].mean()) * 100, 1)

quali = qualifying.merge(races[["raceId", "year"]], on="raceId").replace("\\N", np.nan)
quali = quali.merge(drivers[["driverId", "forename", "surname"]], on="driverId")
quali["piloto"] = quali["forename"] + " " + quali["surname"]


def comparar_companeros(tabla, col):
    t = tabla.dropna(subset=[col]).copy()
    t["autos_equipo"] = t.groupby(["raceId", "constructorId"])[col].transform("size")
    t = t[t["autos_equipo"] == 2].copy()
    t["media_carrera"] = t.groupby("raceId")[col].transform("mean")
    t["media_equipo"] = t.groupby(["raceId", "constructorId"])[col].transform("mean")
    t["dif_vs_companero"] = t[col] - t["media_equipo"]
    return t


carrera = comparar_companeros(df[df["termino"]], "positionOrder")
clasif = comparar_companeros(quali, "position")
resumen["pares_carrera"] = len(carrera) // 2
resumen["pares_clasificacion"] = len(clasif) // 2


# ---------- Groupby 1: peso del auto por año ----------
def descomponer(t, col):
    t = t.assign(total=(t[col] - t["media_carrera"]) ** 2,
                 auto=(t["media_equipo"] - t["media_carrera"]) ** 2)
    g = t.groupby("year")[["total", "auto"]].sum()
    return (g["auto"] / g["total"] * 100).round(1)


peso = pd.DataFrame({"carrera": descomponer(carrera, "positionOrder"),
                     "clasificacion": descomponer(clasif, "position")})
tot = lambda t, col: ((t["media_equipo"] - t["media_carrera"]) ** 2).sum() / ((t[col] - t["media_carrera"]) ** 2).sum()
resumen["auto_total_carrera"] = round(float(tot(carrera, "positionOrder")) * 100, 1)
resumen["auto_total_clasificacion"] = round(float(tot(clasif, "position")) * 100, 1)

# ---------- Groupby 2: duelos de clasificación por piloto ----------
clasif["gano_duelo"] = clasif["dif_vs_companero"] < 0
equipo_principal = (clasif.groupby(["piloto", "constructorId"]).size().reset_index(name="n")
                    .sort_values("n", ascending=False).drop_duplicates("piloto")
                    .set_index("piloto")["constructorId"])
equipos_piloto = clasif.groupby("piloto")["constructorId"].agg(lambda s: list(dict.fromkeys(s)))
duelos = (clasif.groupby("piloto")
          .agg(duelos=("gano_duelo", "size"), pct=("gano_duelo", "mean"),
               dif=("dif_vs_companero", "mean"), temporadas=("year", "nunique"),
               driverId=("driverId", "first"))
          .query("duelos >= 50").sort_values("pct", ascending=False).reset_index())

# ---------- Groupby 3: nivel de cada auto por temporada ----------
temporadas = (clasif.groupby(["year", "constructorId", "piloto", "driverId"])
              .agg(pos_media=("position", "mean"), carreras=("raceId", "nunique"),
                   duelos_ganados=("gano_duelo", "sum"))
              .reset_index())
temporadas = temporadas[temporadas["carreras"] >= 8]
pares = temporadas.merge(temporadas[["year", "constructorId", "piloto", "pos_media", "carreras"]],
                         on=["year", "constructorId"], suffixes=("", "_comp"))
pares = pares[pares["piloto"] != pares["piloto_comp"]]
pares = pares.sort_values("carreras_comp", ascending=False).drop_duplicates(["year", "constructorId", "piloto"])
resumen["correlacion"] = round(float(pares["pos_media"].corr(pares["pos_media_comp"])), 2)
resumen["temporadas_piloto"] = int(len(pares))

# Nivel del auto (posición media de clasificación del equipo) para el simulador
autos = (clasif.groupby(["year", "constructorId"])
         .agg(pos=("position", "mean"), carreras=("raceId", "nunique")).reset_index())
autos = autos[autos["carreras"] >= 8]

# ---------- Brecha entre compañeros (boxplot) ----------
brecha = (clasif.groupby(["raceId", "constructorId", "year"])["position"]
          .agg(lambda s: s.max() - s.min()).rename("brecha").reset_index())


def caja(s):
    q1, med, q3 = s.quantile([0.25, 0.5, 0.75])
    iqr = q3 - q1
    lo = s[s >= q1 - 1.5 * iqr].min()
    hi = s[s <= q3 + 1.5 * iqr].max()
    return {"q1": float(q1), "med": float(med), "q3": float(q3), "lo": float(lo), "hi": float(hi),
            "media": round(float(s.mean()), 2), "n": int(len(s))}


# ---------- Armado del JSON ----------
info_pil = drivers.set_index("driverId")
pil = lambda i: {"codigo": None if pd.isna(info_pil.loc[i, "code"]) or info_pil.loc[i, "code"] == "\\N"
                 else info_pil.loc[i, "code"], "nac": info_pil.loc[i, "nationality"]}
ref = constructors.set_index("constructorId")["constructorRef"]

data = {
    "resumen": resumen,
    "peso_auto": [{"year": int(y), "carrera": float(r.carrera), "clasificacion": float(r.clasificacion)}
                  for y, r in peso.iterrows()],
    "duelos": [{"piloto": r.piloto, **pil(r.driverId), "duelos": int(r.duelos), "pct": round(r.pct * 100, 1),
                "dif": round(r.dif, 2), "temporadas": int(r.temporadas),
                "equipo": ref[equipo_principal[r.piloto]],
                "equipos": list(dict.fromkeys(ref[c] for c in equipos_piloto[r.piloto]))}
               for r in duelos.itertuples()],
    "temporadas": [{"year": int(r.year), "equipo": ref[r.constructorId], "piloto": r.piloto, **pil(r.driverId),
                    "pos": round(r.pos_media, 2), "carreras": int(r.carreras),
                    "comp": r.piloto_comp, "pos_comp": round(r.pos_media_comp, 2)}
                   for r in pares.itertuples()],
    "autos": [{"year": int(r.year), "equipo": ref[r.constructorId], "pos": round(r.pos, 2)}
              for r in autos.itertuples()],
    "brecha": [{"year": int(y), **caja(g["brecha"])} for y, g in brecha.groupby("year")],
}

salida.parent.mkdir(parents=True, exist_ok=True)
salida.write_text("// Generado por web/scripts/exportar_datos.py. No editar a mano.\n"
                  "window.F1_DATA = " + json.dumps(data, ensure_ascii=False) + ";\n", encoding="utf-8")
print("OK ->", salida, "|", resumen)
