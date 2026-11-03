# Presentación del TP: estructura y guion

**Pregunta:** ¿qué pesa más en el resultado de una carrera de F1, el piloto o el auto?
**Método:** comparar a cada piloto con su compañero de equipo (mismo auto), temporadas 2010–2024.
**Respuesta:** el auto pesa unas **2,4 veces más** que el piloto (4,75 contra 1,97 posiciones), y es así en las 15 temporadas.

Formato pedido por la consigna: 6 a 10 diapositivas, hechas con Canva (Magic Design / Canva IA) o PowerPoint con Copilot, para una exposición de 5 a 7 minutos (10 minutos en total con preguntas). El PDF o el link de la presentación se sube al repositorio.

**Versión en PDF:** [`Presentacion_TP_F1.pdf`](Presentacion_TP_F1.pdf), generada con `python3 presentacion/generar_presentacion.py` y `node presentacion/exportar_pdf.js --png presentacion/png`. **Versión PowerPoint:** [`Presentacion_TP_F1.pptx`](Presentacion_TP_F1.pptx) (`python3 presentacion/exportar_pptx.py`), con este guion en las notas de cada diapositiva, para abrirla en PowerPoint y terminarla con Copilot. Los gráficos se dibujan con los datos de `docs/data/f1_data.js`, que reproduce los cálculos del notebook final. Los gráficos del notebook, para insertar en Canva, están en `graficos/`.

Son **8 diapositivas** y unos **6 minutos** de guion. Los turnos de habla están repartidos entre Agustín (A) y Joaquín (J), porque tienen que estar los dos conectados.

Todas las cifras salen del notebook `TP_LMC_F1_Analysis.ipynb` y coinciden con el informe y la web.

---

## Resumen de la estructura

| # | Diapositiva | Quién | Tiempo |
|---|---|---|---|
| 1 | Portada: ¿piloto o auto? | A | 0:20 |
| 2 | La pregunta y por qué importa | A | 0:45 |
| 3 | Datos y método: el compañero como grupo de control | J | 1:00 |
| 4 | Resultado 1: el auto pesa 2,4 veces más | J | 1:00 |
| 5 | Resultado 2: igual hay pilotos que marcan diferencia | A | 0:50 |
| 6 | Resultado 3: el talento se sostiene, pero el auto lo condiciona | J | 0:50 |
| 7 | Conclusión y limitaciones | A | 0:50 |
| 8 | Cierre: cómo trabajamos con IA y links | J | 0:25 |
|   | **Total** | | **≈ 6:00** |

---

## Diapositiva por diapositiva

### 1. Portada (A, 0:20)

**En pantalla**
- Título: **¿Piloto o auto?**
- Subtítulo: Qué pesa más en el resultado de una carrera de Fórmula 1, 2010–2024
- Agustín Mier Torre y Joaquín Lobato Adinolfi
- Laboratorio de Métodos Cuantitativos Aplicados a la Gestión, FCE UBA, 2C 2026
- Cifras: 305 carreras, 80 pilotos, 15 temporadas

**Guion**
> "Buenas, somos Agustín y Joaquín. Nuestro trabajo intenta responder una discusión que tiene cualquiera que mira Fórmula 1: si gana el mejor piloto o el que tiene el mejor auto."

---

### 2. La pregunta y por qué importa (A, 0:45)

**En pantalla**
- La pregunta en grande: *¿Qué parte del resultado se explica por el auto y qué parte por el piloto?*
- Tres líneas de motivación:
  - Para un equipo, define dónde invertir: en el auto o en capacitar y buscar mejores pilotos.
  - Desde 2021 hay tope presupuestario, así que esa decisión pesa más.
  - Es una discusión de siempre entre los fanáticos, y se puede medir con datos.
- Definiciones (las del notebook):
  - **Auto:** posición media de los dos pilotos de la escudería en cada carrera, analizada por escudería y año.
  - **Talento:** resultado del piloto contra su compañero, que maneja el mismo auto en la misma carrera.

**Guion**
> "La pregunta es qué parte del resultado depende del auto y qué parte del piloto. No es solo una discusión de fanáticos: para una escudería es una decisión de presupuesto. ¿Conviene poner el foco en el auto o en conseguir mejores pilotos? Y desde 2021, con el tope de gastos, cada peso cuenta más.
> Para medirlo definimos dos cosas: el auto es la posición media de los dos pilotos de cada equipo, carrera a carrera, y el talento es cómo le va a cada piloto contra su compañero, que tiene el mismo auto."

---

### 3. Datos y método (J, 1:00)

**En pantalla**
- Dataset: *Formula 1 World Championship (1950–2024)*, Rohan Rao, Kaggle
- Período: 2010–2024, tres eras de reglamento: V8 (2010–2013), turbo híbrido (2014–2021) y efecto suelo (2022–2024)
- La idea clave, en un esquema: **mismo equipo + misma carrera = mismo auto → la diferencia entre los dos pilotos es el piloto**
- La fórmula: **posición = media de la carrera − aporte del auto − aporte del piloto**
- Embudo: 6.436 resultados de carrera → 5.280 autos que terminaron (82%) → 2.209 duelos entre compañeros (carreras en que terminaron los dos)
- 305 carreras, 79 pilotos, 23 escuderías

**Guion**
> "Usamos el dataset de Kaggle de Rohan Rao, que tiene todos los resultados del campeonato, y nos quedamos con 2010 a 2024: tres eras de reglamento completas.
> El truco del método es el compañero de equipo. Los dos pilotos de un equipo manejan el mismo auto, así que funciona como un grupo de control: si uno le gana al otro, esa diferencia no la explica el auto. Para que un abandono no ensucie la comparación, trabajamos solo con los autos que terminaron, contando también a los doblados, y solo con las carreras en que terminaron los dos pilotos del equipo: quedan 2.209 duelos.
> En cada carrera separamos la posición de cada piloto en dos aportes: el del auto, que es cuánto se aleja su equipo del promedio de la carrera, y el del piloto, que es cuánto se aleja de su compañero. Los dos se miden en posiciones, así que se pueden comparar."

---

### 4. Resultado 1: el auto pesa 2,4 veces más (J, 1:00)

**En pantalla**
- Gráfico: efecto típico del auto y del piloto por temporada (`graficos/grafico_1_auto_vs_piloto.png`)
- Dato destacado: **2,4×**. El auto mueve 4,75 posiciones y el piloto 1,97.
- En las 15 temporadas: el cociente va de 2,0 (2021) a 3,3 (2011)

**Guion**
> "Este es el resultado central. La línea roja es cuánto mueve el auto la posición, y la celeste, cuánto la mueve el piloto, año por año. En todo el período, el auto aleja a su equipo unas 4,75 posiciones del promedio de la carrera, y el piloto se aleja menos de 2 de su compañero. O sea, el auto pesa 2,4 veces más. Y no es un año en particular: pasa en las quince temporadas. Si los autos fueran todos iguales, ese cociente daría cerca de 1."

---

### 5. Resultado 2: igual hay pilotos que marcan diferencia (A, 0:50)

**En pantalla**
- Gráfico: pilotos con mayor porcentaje de duelos ganados a su compañero, mínimo 33 duelos (`graficos/grafico_2_duelos_ganados.png`)
- Dato destacado: **Verstappen le gana a su compañero el 81,9% de las carreras; Alonso, el 77,7%**
- Mensaje: el que le gana al compañero en varios equipos distintos está mostrando talento, no auto

**Guion**
> "Pero que el auto pese más no quiere decir que el piloto no importe. Acá están los pilotos que más veces terminan adelante de su compañero, que tiene el mismo auto. Verstappen le gana en 8 de cada 10 carreras, y Alonso en casi 8 de cada 10, y lo hizo en cuatro equipos distintos. Si alguien le gana al compañero en autos diferentes, eso es el piloto. Pedimos un mínimo de 33 duelos, que es la mediana, para no sacar conclusiones de pilotos con muy pocas carreras."

---

### 6. Resultado 3: el talento se sostiene, pero el auto lo condiciona (J, 0:50)

**En pantalla**
- Gráfico: duelos ganados por temporada de Alonso, Hamilton, Vettel y Verstappen, con el color del equipo (`graficos/grafico_3_talento_sostenido.png`)
- Alonso: entre 81% y 100% en Ferrari (2010–2014), 44% en su primer año en McLaren
- Vettel: del 100% en 2013 al 21% en 2014, con el reglamento nuevo
- Verstappen: crece hasta el 100% en 2020, 2021 y 2024

**Guion**
> "Si seguimos a cuatro campeones año por año, se ve que el talento se sostiene, pero que también depende del auto y del compañero. Alonso le ganó a su compañero entre el 81 y el 100% de las veces en Ferrari, y cayó al 44% en su primer año en McLaren. Vettel pasó del 100% en 2013 al 21% en 2014, con el cambio de reglamento. Y Verstappen crece año a año hasta ganarle todas a su compañero."

---

### 7. Conclusión y limitaciones (A, 0:50)

**En pantalla**
- Respuesta directa: **pesa más el auto; el piloto decide dentro de lo que el auto permite**
- Barras comparadas: 4,75 posiciones (auto) contra 1,97 (piloto)
- Tres conclusiones cortas:
  1. El auto mueve la posición 2,4 veces más que el piloto, en las 15 temporadas.
  2. Dentro de un mismo auto hay pilotos que ganan 4 de cada 5 duelos.
  3. Desde 2021 los autos están algo más parejos (cociente entre 2,0 y 2,3), pero el auto sigue mandando.
- Limitaciones:
  - El talento se mide contra el compañero, no en términos absolutos.
  - Quedan afuera los abandonos y las carreras en que terminó un solo auto del equipo.
  - Solo 2010–2024: no se puede generalizar a otras épocas.

**Guion**
> "Entonces, la respuesta: entre 2010 y 2024 pesa más el auto, unas 2,4 veces más que el piloto, y eso se mantiene en todas las temporadas. Desde el tope presupuestario los autos están un poco más parejos, pero el piloto nunca se acerca. Eso no quiere decir que el piloto no importe: dentro de un mismo auto, los mejores le ganan 4 de cada 5 veces a su compañero. Para un equipo, la recomendación sería priorizar el auto. Como limitaciones, el talento lo medimos contra el compañero y no en términos absolutos, dejamos afuera los abandonos, y el período es acotado."

---

### 8. Cierre: IA y links (J, 0:25)

**En pantalla**
- Uso de IA en el flujo de trabajo: Claude (Anthropic) como asistente con el contexto del proyecto. En el análisis: elección de variables y hoja de ruta, filtro de autos terminados (sumar los doblados), `transform` para armar los pares de compañeros, control de reconstrucción y elección de gráficos. En la comunicación: informe en LaTeX, sitio web y esta presentación. Validación: controles en el notebook y una segunda ejecución del código que reproduce todas las cifras; las celdas asistidas están marcadas con su prompt.
- Links: repositorio de GitHub, informe, sitio web (piloto-o-auto-f1.vercel.app)
- "¿Preguntas?"

**Guion**
> "Para cerrar, sobre el uso de IA: trabajamos con Claude como asistente. Nos ayudó a elegir variables, a darnos cuenta de que los doblados también terminaban la carrera, a armar los pares de compañeros y a elegir los gráficos, y también con el informe, la web y esta presentación. Todo lo validamos con controles en el notebook, y en cada celda asistida está el prompt que usamos. Todo está en el repositorio. ¿Preguntas?"

---

## Preguntas probables y respuestas cortas

- **¿Por qué 2010–2024 y no desde 1950?** Porque son tres eras de reglamento completas y la F1 de antes es otra tecnología. Lo marcamos como limitación.
- **¿Cómo comparan auto y piloto si se miden distinto?** En cada carrera, la posición de cada piloto se separa en el promedio de la carrera, el aporte del auto (cuánto se aleja su equipo del promedio) y el aporte del piloto (cuánto se aleja de la media de su equipo). Los dos aportes están en posiciones. Se resumen con la raíz del promedio de los cuadrados, como un desvío estándar, y se dividen: 4,75 / 1,97 ≈ 2,4.
- **¿Y si el cociente diera 1?** Querría decir que el auto no explica nada más que el azar: si los autos fueran iguales y los pilotos se repartieran al azar, los dos aportes tendrían el mismo tamaño.
- **¿Por qué sacan los abandonos?** Un auto que no termina es un atípico severo que no mide ni al auto ni al piloto. Se cuentan como terminados también los doblados (+N vueltas): quedan 5.280 de 6.436 resultados, y 2.209 carreras en que terminaron los dos pilotos del equipo.
- **¿Qué pasa con los reemplazos a mitad de temporada?** Generan duelos con pocas carreras; por eso el ranking pide un mínimo de 33 duelos (la mediana).
- **¿Usaron la clasificación?** Se preparó y se exploró, pero por tiempo y alcance el análisis final usa solo la carrera. Queda como extensión.
- **¿Por qué no posiciones ganadas desde la largada?** Las largadas desde boxes (grid = 0, el 1% de los casos) complican la cuenta, así que se usa la posición final.

## Prompt sugerido para Canva Magic Design / Copilot

> "Creá una presentación de 8 diapositivas en español para una defensa universitaria de 6 minutos sobre Fórmula 1: '¿Piloto o auto? Qué pesa más en la F1, 2010–2024'. Estilo deportivo y limpio, fondo oscuro con acentos en rojo, tipografía grande y poco texto por diapositiva. Estructura: 1) portada, 2) la pregunta y por qué importa, 3) datos y método (comparar compañeros de equipo con el mismo auto), 4) resultado: el auto pesa 2,4 veces más que el piloto, 5) resultado: pilotos que le ganan a su compañero, 6) resultado: el talento de cuatro campeones temporada por temporada, 7) conclusión y limitaciones, 8) uso de IA, links y preguntas. Dejá espacio en las diapositivas 4, 5 y 6 para un gráfico grande."

Después se reemplazan los textos por los de este documento y se insertan los gráficos de `graficos/`.

## Pendientes antes de la defensa

- [ ] Armar la versión final en Canva o PowerPoint Copilot (lo pide la consigna), con estos textos y los gráficos de `graficos/`.
- [ ] Subir el PDF o el link de la presentación al repositorio.
- [ ] Ensayar con cronómetro: no pasar de 7 minutos.
