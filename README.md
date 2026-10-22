# TP_LMC_F1_Analysis
Repositorio para todo aquello referido al Trabajo Practico Grupal de Laboratorio de Metodos Cuantitativos Aplicados a la Gestion - Analisis de dataset de F1:¿Qué pesa más en el resultado de una carrera de Fórmula 1: el talento del piloto o el rendimiento del auto? 

## Informe de avance
`avance/Avance_TP_F1.pdf` resume qué datos usamos, las transformaciones, los gráficos y qué falta. Es un documento vivo: para actualizarlo, editar el contenido en `avance/generar_avance.py` y correr `python avance/generar_avance.py` (requiere `reportlab`).

## Web del TP (GitHub Pages)
`docs/` es una web estática que presenta los datos, los gráficos y la conclusión de forma interactiva (largada con semáforo, torre de tiempos por temporada, gráficos animados, duelos entre compañeros, simulador "cambio de asiento"). Corresponde al complemento opcional de la consigna (GitHub Pages).

- **Verla localmente:** abrir `docs/index.html` en el navegador (no necesita servidor).
- **Publicarla:** en GitHub, *Settings → Pages → Build and deployment → Deploy from a branch*, rama `main`, carpeta `/docs`. Queda en `https://joaquin-lobato-adinolfi.github.io/TP_LMC_F1_Analysis/`.
- **Actualizar los datos:** si cambia el análisis, correr `python docs/scripts/exportar_datos.py CARPETA_CON_LOS_CSV` (la carpeta que descarga `kagglehub`). Regenera `docs/data/f1_data.js` con los mismos cálculos del notebook.
- Librerías: D3 7.9.0 (copiada en `docs/vendor/`). Logos de escuderías: Simple Icons (CC0); las que no tienen logo libre se muestran con una chapa con su color.
