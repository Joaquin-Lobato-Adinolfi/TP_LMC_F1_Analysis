# TP_LMC_F1_Analysis
Repositorio para todo aquello referido al Trabajo Practico Grupal de Laboratorio de Metodos Cuantitativos Aplicados a la Gestion - Analisis de dataset de F1:¿Qué pesa más en el resultado de una carrera de Fórmula 1: el talento del piloto o el rendimiento del auto? 

## Contenido

- **Notebook:** `TP_LMC_F1_Analysis.ipynb` (Google Colab). Descarga el dataset de Kaggle con `kagglehub` (`rohanrao/formula-1-world-championship-1950-2020`), así que no hace falta subirlo al repo.
- **Gráficos:** `graficos/` (los tres que exporta el notebook con `plt.savefig()`).
- **Informe académico:** `informe/informe.pdf` (fuente LaTeX en `informe/informe.tex`; para compilarlo: `cd informe && pdflatex informe.tex`).
- **Presentación:** `presentacion/Presentacion_TP_F1.pdf`, con la estructura y el guion en `presentacion/estructura_y_guion.md`.
- **Sitio web:** `docs/` (ver abajo).

**Resultado:** entre 2010 y 2024 el auto pesa unas 2,4 veces más que el piloto en el resultado de una carrera (4,75 contra 1,97 posiciones), y es así en las 15 temporadas.

## Informe de avance
`avance/Avance_TP_F1.pdf` resume qué datos usamos, las transformaciones, los gráficos y qué falta. Es un documento vivo: para actualizarlo, editar el contenido en `avance/generar_avance.py` y correr `python avance/generar_avance.py` (requiere `reportlab`).

## Web del TP (GitHub Pages)
`docs/` es una web estática que presenta los datos, los gráficos y la conclusión de forma interactiva (largada con semáforo, torre de tiempos por temporada, gráficos animados, duelos entre compañeros, simulador "cambio de asiento"). Corresponde al complemento opcional de la consigna (GitHub Pages).

- **Verla localmente:** abrir `docs/index.html` en el navegador (no necesita servidor).
- **Publicarla:** en GitHub, *Settings → Pages → Build and deployment → Deploy from a branch*, rama `main`, carpeta `/docs`. Queda en `https://joaquin-lobato-adinolfi.github.io/TP_LMC_F1_Analysis/`.
- **Actualizar los datos:** si cambia el análisis, correr `python docs/scripts/exportar_datos.py CARPETA_CON_LOS_CSV` (la carpeta que descarga `kagglehub`). Regenera `docs/data/f1_data.js` con los mismos cálculos del notebook.
- Librerías: D3 7.9.0 (copiada en `docs/vendor/`). Logos de escuderías: Simple Icons (CC0); las que no tienen logo libre se muestran con una chapa con su color.
