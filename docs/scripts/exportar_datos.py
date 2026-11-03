"""Exporta los datos que usa la web (docs/data/f1_data.js) a partir del dataset de Kaggle.

Reproduce los mismos cálculos del notebook final (exploración, filtros y análisis) y los guarda en un
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



# ---------- Análisis del notebook final (secciones "Análisis" y "Final") ----------
# Mismas cuentas que TP_LMC_F1_Analysis.ipynb: solo autos que terminaron y solo las
# carreras en que terminaron los dos pilotos de la escudería (pares_finalizados).
status_ok = status[status["status"].str.startswith("+") | (status["status"] == "Finished")]
ca = results[results["statusId"].isin(status_ok["statusId"])][["raceId", "driverId", "constructorId", "positionOrder"]].copy()
ca["year"] = ca["raceId"].map(dict(zip(races["raceId"], races["year"])))
ca["piloto"] = ca["driverId"].map(dict(zip(drivers["driverId"], drivers["forename"] + " " + drivers["surname"])))
pf = ca[ca.groupby(["raceId", "constructorId"])["driverId"].transform("size") == 2].copy()
pf["team_mean"] = pf.groupby(["raceId", "constructorId"])["positionOrder"].transform("mean")
pf["driver_measure"] = pf["team_mean"] - pf["positionOrder"]
pf["won_duel"] = pf["driver_measure"] > 0
pf["teammate_abs_dif"] = pf["driver_measure"].abs() * 2
pf["race_mean"] = pf.groupby("raceId")["positionOrder"].transform("mean")
pf["car_measure"] = pf["race_mean"] - pf["team_mean"]
pf["c2"] = pf["car_measure"] ** 2
pf["d2"] = pf["driver_measure"] ** 2
pf["teammate_pos"] = 2 * pf["team_mean"] - pf["positionOrder"]

resumen["pares"] = len(pf) // 2
resumen["efecto_auto"] = round(float(pf["c2"].mean() ** 0.5), 2)
resumen["efecto_piloto"] = round(float(pf["d2"].mean() ** 0.5), 2)
resumen["ratio"] = round(resumen["efecto_auto"] / resumen["efecto_piloto"], 1)

# Groupby por año: efecto del auto y del piloto (auto_vs_piloto del notebook)
avp = pf.groupby("year")[["c2", "d2"]].mean()
efectos = [{"year": int(y), "auto": round(float(r.c2 ** 0.5), 2), "piloto": round(float(r.d2 ** 0.5), 2),
            "ratio": round(float((r.c2 / r.d2) ** 0.5), 2)} for y, r in avp.iterrows()]

# Groupby por piloto: duelos ganados al compañero, mínimo 33 duelos (la mediana)
MIN_DUELOS = 33
resumen["min_duelos"] = MIN_DUELOS
equipo_principal = (pf.groupby(["driverId", "constructorId"]).size().reset_index(name="n")
                    .sort_values("n", ascending=False).drop_duplicates("driverId")
                    .set_index("driverId")["constructorId"])
equipos_piloto = pf.sort_values("raceId").groupby("driverId")["constructorId"].agg(lambda s: list(dict.fromkeys(s)))
duelos = (pf.groupby(["driverId", "piloto"])
          .agg(duelos=("won_duel", "size"), ganados=("won_duel", "sum"), pct=("won_duel", "mean"),
               mean_dif=("driver_measure", "mean"), temporadas=("year", "nunique"))
          .reset_index())
duelos = duelos[duelos["duelos"] >= MIN_DUELOS].sort_values("pct", ascending=False)

# Groupby por año y piloto: duelos por temporada (gráfico 3 del notebook)
duelos_anio = (pf.groupby(["year", "driverId", "constructorId"])
               .agg(duelos=("won_duel", "size"), pct=("won_duel", "mean")).reset_index())
duelos_anio = duelos_anio[duelos_anio["driverId"].isin(duelos["driverId"]) & (duelos_anio["duelos"] >= 5)]

# Groupby por escudería y año: posición media del auto (escuderias_year)
autos = (pf.groupby(["year", "constructorId"])
         .agg(pos=("team_mean", "mean"), carreras=("raceId", "nunique")).reset_index())
rango = autos.groupby("year")["pos"].agg(lambda s: s.max() - s.min())
resumen["rango_autos"] = round(float(rango.mean()), 1)
resumen["dif_companeros_media"] = round(float(pf["teammate_abs_dif"].mean()), 1)
resumen["dif_companeros_mediana"] = float(pf["teammate_abs_dif"].median())

# Temporadas de cada piloto: su posición media contra la de su compañero (tabla temporadas)
comp = pf[["raceId", "constructorId", "driverId", "piloto"]].rename(columns={"driverId": "compId", "piloto": "comp"})
con_comp = pf.merge(comp, on=["raceId", "constructorId"])
con_comp = con_comp[con_comp["driverId"] != con_comp["compId"]]
comp_frecuente = (con_comp.groupby(["year", "constructorId", "driverId", "comp"]).size().reset_index(name="n")
                  .sort_values("n", ascending=False).drop_duplicates(["year", "constructorId", "driverId"]))
temporadas = (pf.groupby(["year", "constructorId", "driverId", "piloto"])
              .agg(carreras=("raceId", "size"), pos=("positionOrder", "mean"), pos_comp=("teammate_pos", "mean"))
              .reset_index())
temporadas = temporadas[temporadas["carreras"] >= 5].merge(
    comp_frecuente[["year", "constructorId", "driverId", "comp"]], on=["year", "constructorId", "driverId"])
resumen["correlacion"] = round(float(temporadas["pos"].corr(temporadas["pos_comp"])), 2)
resumen["temporadas_piloto"] = int(len(temporadas))

# Distancia entre compañeros por carrera (boxplot por temporada)
brecha = pf.drop_duplicates(["raceId", "constructorId"])[["year", "teammate_abs_dif"]].rename(columns={"teammate_abs_dif": "brecha"})


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
    "efectos": efectos,
    "duelos": [{"piloto": r.piloto, **pil(r.driverId), "duelos": int(r.duelos), "ganados": int(r.ganados),
                "pct": round(r.pct * 100, 1), "dif": round(-r.mean_dif, 2), "temporadas": int(r.temporadas),
                "equipo": ref[equipo_principal[r.driverId]],
                "equipos": list(dict.fromkeys(ref[c] for c in equipos_piloto[r.driverId]))}
               for r in duelos.itertuples()],
    "duelos_anio": [{"year": int(r.year), "piloto": nombre_id, "equipo": ref[r.constructorId], "duelos": int(r.duelos),
                     "pct": round(r.pct * 100, 1)}
                    for r in duelos_anio.itertuples()
                    for nombre_id in [info_pil.loc[r.driverId, "forename"] + " " + info_pil.loc[r.driverId, "surname"]]],
    "temporadas": [{"year": int(r.year), "equipo": ref[r.constructorId], "piloto": r.piloto, **pil(r.driverId),
                    "pos": round(r.pos, 2), "carreras": int(r.carreras),
                    "comp": r.comp, "pos_comp": round(r.pos_comp, 2)}
                   for r in temporadas.itertuples()],
    "autos": [{"year": int(r.year), "equipo": ref[r.constructorId], "pos": round(r.pos, 2), "carreras": int(r.carreras)}
              for r in autos.itertuples()],
    "brecha": [{"year": int(y), **caja(g["brecha"])} for y, g in brecha.groupby("year")],
}

# ---------- Exploración y filtros del notebook actual (sección "Preanálisis" y "Filtro de datos") ----------
status_finalizados = status[status["status"].str.startswith("+") | (status["status"] == "Finished")]
carreras_finalizadas = results[results["statusId"].isin(status_finalizados["statusId"])]
no_terminaron = results[~results["statusId"].isin(status_finalizados["statusId"])].merge(status, on="statusId")
motivos = no_terminaron["status"].value_counts()
top_motivos = [{"motivo": k, "n": int(v)} for k, v in motivos.head(8).items()]
top_motivos.append({"motivo": "Otros", "n": int(motivos.iloc[8:].sum())})
por_anio = (results.merge(races[["raceId", "year"]], on="raceId")
            .assign(fin=lambda t: t["statusId"].isin(status_finalizados["statusId"]))
            .groupby("year")["fin"].agg(["mean", "size"]))
cant = (carreras_finalizadas.groupby("driverId")["raceId"].count().rename("n").reset_index()
        .sort_values("n", ascending=False))
equipo_frecuente = (carreras_finalizadas.groupby(["driverId", "constructorId"]).size().reset_index(name="k")
                    .sort_values("k", ascending=False).drop_duplicates("driverId").set_index("driverId")["constructorId"])
nombre = (drivers["forename"] + " " + drivers["surname"]).set_axis(drivers["driverId"])
desc = cant["n"].describe()
pilotos_quali = set(qualifying["driverId"])
pilotos_carrera = set(carreras_finalizadas["driverId"])
atipicos = sorted(pilotos_quali - pilotos_carrera)
tablas = [
    ("races", races, "Carreras: año, ronda, circuito y fechas de cada sesión."),
    ("results", results, "Resultado de cada auto en cada carrera: grilla, posición final, vueltas y estado."),
    ("drivers", drivers, "Pilotos: nombre, código de tres letras y nacionalidad."),
    ("constructors", constructors, "Escuderías: nombre y nacionalidad."),
    ("qualifying", qualifying, "Clasificación: posición y tiempos de Q1, Q2 y Q3."),
    ("status", status, "Catálogo de estados finales: Finished, +1 Lap, Engine, Collision…"),
]
exploracion = {
    "tablas": [{"nombre": n, "filas": int(t.shape[0]), "columnas": int(t.shape[1]),
                "descripcion": d} for n, t, d in tablas],
    "filtro": {"total": int(len(results)), "terminaron": int(len(carreras_finalizadas)),
               "no_terminaron": int(len(results) - len(carreras_finalizadas)),
               "estados_validos": int(len(status_finalizados)), "motivos": top_motivos},
    "terminaron_por_anio": [{"year": int(y), "pct": round(float(r["mean"]) * 100, 1), "n": int(r["size"])}
                            for y, r in por_anio.iterrows()],
    "pilotos_carrera": len(pilotos_carrera), "pilotos_quali": len(pilotos_quali),
    "atipicos": [{"piloto": nombre[i], **pil(i)} for i in atipicos],
    "carreras_por_piloto": [{"piloto": nombre[r.driverId], **pil(r.driverId), "n": int(r.n),
                             "equipo": ref[equipo_frecuente[r.driverId]]} for r in cant.itertuples()],
    "carreras_por_piloto_resumen": {k: round(float(desc[k]), 2) for k in ["count", "mean", "std", "min", "25%", "50%", "75%", "max"]},
}
data["exploracion"] = exploracion

salida.parent.mkdir(parents=True, exist_ok=True)
salida.write_text("// Generado por docs/scripts/exportar_datos.py. No editar a mano.\n"
                  "window.F1_DATA = " + json.dumps(data, ensure_ascii=False) + ";\n", encoding="utf-8")
print("OK ->", salida, "|", resumen)
