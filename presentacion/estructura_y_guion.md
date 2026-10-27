# Presentación del TP: estructura y guion

**Pregunta:** ¿qué pesa más en el resultado de una carrera de F1, el piloto o el auto?
**Método:** comparar a cada piloto con su compañero de equipo (mismo auto), temporadas 2010–2024.

Formato pedido por la consigna: 6 a 10 diapositivas, hechas con Canva (Magic Design / Canva IA) o PowerPoint con Copilot, para una exposición de 5 a 7 minutos (10 minutos en total con preguntas). El PDF o el link de la presentación se sube al repositorio.

**Versión en PDF:** [`Presentacion_TP_F1.pdf`](Presentacion_TP_F1.pdf), generada con `python3 presentacion/generar_presentacion.py` y `node presentacion/exportar_pdf.js`. Los gráficos se dibujan con los datos de `docs/data/f1_data.js`, así que cuando el notebook final esté listo se regenera ese archivo, se pone `PROVISORIO = False` en el script y se vuelve a exportar.

Esta propuesta tiene **8 diapositivas** y unos **6 minutos** de guion. Los turnos de habla están repartidos entre Agustín (A) y Joaquín (J), porque tienen que estar los dos conectados.

> ⚠️ **Resultados provisorios.** Los números y gráficos de las diapositivas 4 a 6 salen de la versión actual del notebook (`graficos/`). Joaquín está rehaciendo el notebook, así que antes de armar la versión final en Canva hay que reemplazarlos por los gráficos y valores definitivos. Todo lo que puede cambiar está marcado con **[PROVISORIO]**.

---

## Resumen de la estructura

| # | Diapositiva | Quién | Tiempo |
|---|---|---|---|
| 1 | Portada: ¿piloto o auto? | A | 0:20 |
| 2 | La pregunta y por qué importa | A | 0:45 |
| 3 | Datos y método: el compañero como grupo de control | J | 1:00 |
| 4 | Resultado 1: el auto explica la mayor parte | J | 1:00 |
| 5 | Resultado 2: igual hay pilotos que marcan diferencia | A | 0:50 |
| 6 | Resultado 3: desde 2021 los compañeros están más lejos | J | 0:50 |
| 7 | Conclusión y limitaciones | A | 0:50 |
| 8 | Cierre: cómo trabajamos con IA y links | J | 0:25 |
|   | **Total** | | **≈ 6:00** |

---

## Diapositiva por diapositiva

### 1. Portada (A, 0:20)

**En pantalla**
- Título: **¿Piloto o auto?**
- Subtítulo: Qué pesa más en la Fórmula 1, 2010–2024
- Agustín Mier Torre y Joaquín Lobato Adinolfi
- Laboratorio de Métodos Cuantitativos Aplicados a la Gestión, FCE UBA, 2C 2026
- Imagen de fondo: dos autos del mismo equipo en pista

**Guion**
> "Buenas, somos Agustín y Joaquín. Nuestro trabajo intenta responder una discusión que tiene cualquiera que mira Fórmula 1: si gana el mejor piloto o el que tiene el mejor auto."

---

### 2. La pregunta y por qué importa (A, 0:45)

**En pantalla**
- La pregunta en grande: *¿Qué parte del resultado se explica por el auto y qué parte por el piloto?*
- Tres líneas de motivación:
  - Para un equipo, define dónde invertir: un piloto estrella o el desarrollo del auto.
  - Desde 2021 hay tope presupuestario, así que esa decisión pesa más.
  - Es una discusión de siempre entre los fanáticos, y se puede medir con datos.

**Guion**
> "La pregunta es qué parte del resultado depende del auto y qué parte del piloto. No es solo una discusión de fanáticos: para una escudería es una decisión de presupuesto. ¿Conviene pagar un piloto estrella o poner esa plata en el auto? Y desde 2021, con el tope de gastos, cada peso cuenta más."

---

### 3. Datos y método (J, 1:00)

**En pantalla**
- Dataset: *Formula 1 World Championship (1950–2024)*, Rohan Rao, Kaggle
- Período: 2010–2024, tres eras de reglamento:
  - V8 (2010–2013)
  - Turbo híbrido (2014–2021)
  - Efecto suelo (2022–2024)
- Tablas usadas: races, results, qualifying, drivers, constructors, status
- La idea clave, en un esquema: **mismo equipo + misma carrera = mismo auto → la diferencia entre los dos pilotos es el piloto**
- Transformaciones: filtro de abandonos por fallas mecánicas, columna de duelo entre compañeros, variable de era

**Guion**
> "Usamos el dataset de Kaggle de Rohan Rao, que tiene todos los resultados del campeonato. Nos quedamos con 2010 a 2024: son tres eras de reglamento completas y todas las tablas tienen datos completos.
> El truco del método es el compañero de equipo. Los dos pilotos de un equipo manejan el mismo auto, así que funciona como un grupo de control: si uno le gana al otro, esa diferencia no la explica el auto. Para no castigar al piloto por culpa del auto, sacamos los abandonos por fallas mecánicas."

---

### 4. Resultado 1: el auto explica la mayor parte (J, 1:00) [PROVISORIO]

**En pantalla**
- Gráfico: `graficos/01_peso_auto_por_anio.png`
- Dato destacado: **el equipo explica entre el 70 % y el 94 % de la diferencia entre pilotos, según el año** [PROVISORIO]
- Referencia: si el auto no importara, sería ≈ 47 %

**Guion**
> "Este es el resultado central. La línea muestra qué parte de la diferencia entre pilotos se explica solo por saber en qué equipo corren. Está siempre entre 70 y 90 y pico por ciento, muy por encima del 47 % que esperaríamos si el auto no importara. O sea: en la F1 de este período, el auto define la mayor parte del resultado. Y fíjense que desde 2021 la línea baja: con el tope presupuestario y el reglamento nuevo, el auto pesa un poco menos."

---

### 5. Resultado 2: igual hay pilotos que marcan diferencia (A, 0:50) [PROVISORIO]

**En pantalla**
- Gráfico: `graficos/02_duelos_companeros.png` (o el gráfico de barras definitivo)
- Dato destacado: **Verstappen le gana la clasificación a su compañero el 78 % de las veces; Alonso y Russell, el 75 %** [PROVISORIO]
- Mensaje: el que le gana al compañero en varios equipos distintos está mostrando talento, no auto

**Guion**
> "Pero que el auto pese mucho no quiere decir que el piloto no importe. Acá están los pilotos que más le ganan a su compañero, que tiene el mismo auto. Verstappen le gana en casi 8 de cada 10 clasificaciones, y Alonso lo hizo en varios equipos distintos. Si alguien le gana al compañero en autos diferentes, eso es el piloto."

---

### 6. Resultado 3: desde 2021 los compañeros están más lejos (J, 0:50) [PROVISORIO]

**En pantalla**
- Gráfico: `graficos/04_brecha_companeros_boxplot.png` (o reemplazar por el de dispersión `03_piloto_vs_companero.png` si el definitivo es ese)
- Dato destacado: **la distancia típica en la grilla entre compañeros pasa de 2 a 3 posiciones desde 2021** [PROVISORIO]
- Lectura: con los autos más parejos, el piloto se nota más

**Guion**
> "Lo mismo se ve desde el otro lado. Esta es la distancia en la grilla entre los dos pilotos de un mismo equipo. Hasta 2020 la diferencia típica es de 2 posiciones; desde 2021 es de 3, y las cajas se estiran. Cuando los autos se emparejan, el piloto pasa a pesar más."

---

### 7. Conclusión y limitaciones (A, 0:50)

**En pantalla**
- Respuesta directa: **pesa más el auto, pero el piloto define quién aprovecha ese auto** [ajustar al resultado final]
- Tres conclusiones cortas (una por resultado)
- Limitaciones:
  - Solo 2010–2024: no se puede generalizar a otras épocas.
  - Pocos equipos por temporada (10 a 12).
  - El compañero es un piloto, no una vara absoluta: medimos al piloto contra otro piloto.

**Guion**
> "Entonces, la respuesta: en 2010–2024 pesa más el auto, que explica la mayor parte de la diferencia entre pilotos. Pero dentro de un mismo auto el piloto sí marca diferencia, y esa diferencia crece cuando los autos están más parejos, como desde 2021. Como limitaciones, el período es acotado, hay pocos equipos por año, y comparar contra el compañero mide al piloto en relación con otro piloto, no en términos absolutos."

---

### 8. Cierre: IA y links (J, 0:25)

**En pantalla**
- Uso de IA en el flujo de trabajo: Claude (Anthropic) como agente con contexto del proyecto (consigna, diccionario del dataset, repositorio); generación y depuración del pipeline en pandas (joins, construcción de duelos, groupby, descomposición de la varianza); estructura del informe en LaTeX, visualizaciones y presentación generada por código. Validación de cada salida contra los datos crudos, con las celdas asistidas marcadas con su prompt.
- Links: repositorio de GitHub, informe en Overleaf, sitio web (GitHub Pages)
- "¿Preguntas?"

**Guion**
> "Para cerrar, sobre el uso de IA: trabajamos con Claude como agente, cargándole la consigna, el diccionario del dataset y el repositorio. Lo usamos para generar y depurar el pipeline en pandas, desde los joins entre tablas hasta la descomposición de la varianza, y para el informe en LaTeX, los gráficos y esta presentación. Cada salida la validamos contra los datos crudos, y en el notebook están marcadas las celdas asistidas con su prompt. Todo está en el repositorio. ¿Preguntas?"

---

## Preguntas probables y respuestas cortas

- **¿Por qué 2010–2024 y no desde 1950?** Porque son tres eras de reglamento completas, los datos de clasificación están completos y la F1 de antes es otra tecnología. Lo marcamos como limitación.
- **¿Cómo calculan el "porcentaje que explica el auto"?** Es la parte de la variación de posiciones entre pilotos que se explica solo con el equipo (comparando la dispersión entre equipos con la dispersión total). [Ajustar a la definición del notebook final.]
- **¿Qué pasa con los reemplazos a mitad de temporada?** Generan duelos con pocas carreras; por eso el ranking pide un mínimo de 50 duelos.
- **¿Clasificación o carrera?** Usamos las dos. La clasificación aísla mejor al piloto porque no hay estrategia ni abandonos.

## Prompt sugerido para Canva Magic Design / Copilot

> "Creá una presentación de 8 diapositivas en español para una defensa universitaria de 6 minutos sobre Fórmula 1: '¿Piloto o auto? Qué pesa más en la F1, 2010–2024'. Estilo deportivo y limpio, fondo oscuro con acentos en rojo, tipografía grande y poco texto por diapositiva. Estructura: 1) portada, 2) la pregunta y por qué importa, 3) datos y método (comparar compañeros de equipo con el mismo auto), 4) resultado: el auto explica la mayor parte, 5) resultado: pilotos que le ganan a su compañero, 6) resultado: desde 2021 los compañeros están más lejos, 7) conclusión y limitaciones, 8) uso de IA, links y preguntas. Dejá espacio en las diapositivas 4, 5 y 6 para un gráfico grande."

Después se reemplazan los textos por los de este documento y se insertan los gráficos de `graficos/`.

## Pendientes antes de la defensa

- [ ] Reemplazar los gráficos y números [PROVISORIO] por los del notebook final.
- [ ] Ajustar la conclusión de la diapositiva 7 al resultado final.
- [ ] Armar la versión final en Canva o PowerPoint Copilot (lo pide la consigna).
- [ ] Subir el PDF o el link de la presentación al repositorio.
- [ ] Ensayar con cronómetro: no pasar de 7 minutos.
