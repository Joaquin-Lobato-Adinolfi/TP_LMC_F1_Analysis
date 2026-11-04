# Video del TP: ¿Piloto o auto?

Es el video explicativo del TP, el complemento opcional (opción 1) de la consigna. Dura 2:51, la narración es de Agustín y Joaquín y tiene subtítulos. Está en `Video_TP_F1.mp4`, en 1920×1080 a 30 cuadros por segundo.

- `guion_video.md`: el guion, escena por escena.
- `audio/`: los 8 audios originales (A1, A2, J3, J4, A5, J6, A7, J8).
- `palabras_asr.json`: la transcripción automática con el tiempo de cada palabra, hecha con Whisper *small*.
- `preparar_tiempos.py`: corrige a mano los errores de la transcripción, recorta los silencios y arma los subtítulos. Genera `tiempos.json` y `tiempos.js`.
- `escenas.html` + `escenas.js`: las animaciones, en SVG. Cada acción visual está atada a la palabra que la dispara, y los datos salen de `docs/data/f1_data.js`, el mismo archivo que usan la web y la presentación.
- `render.js`: con Playwright captura los cuadros, une el audio (normalizado en volumen) y genera el MP4.

Para regenerarlo, por ejemplo si cambia un audio o un dato:

```bash
python3 video/preparar_tiempos.py
node video/render.js                    # video completo
node video/render.js --cuadros 30,95    # solo algunos cuadros, en video/cuadros/
```

Si se regraba un audio, antes hay que volver a transcribirlo para actualizar `palabras_asr.json`.

En pantalla hay como máximo cuatro palabras por escena, sin contar los subtítulos. Las cifras son las del notebook final: el efecto del auto es de 4,75 posiciones y el del piloto de 1,97, o sea 2,4 veces más. Verstappen gana el 81,9 % de los duelos con su compañero y Alonso el 77,7 %, sobre 2.209 duelos en 305 carreras.
