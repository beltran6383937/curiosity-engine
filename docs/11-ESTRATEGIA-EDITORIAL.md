# 11 · Estrategia editorial: P&Q AI Content Engine

Desde el 22-10-2026 este motor ya no hace curiosidades: produce **un vídeo al día de PÉREZ & QUINTANO** para Instagram y TikTok,
publicado a las **08:30 (Europe/Madrid)**, empezando el viernes 23-10-2026. Lo leen NOVA, HAWKING, HOOK, VISION, MOTION, VERITAS y SENTINEL.

## Para quién
Dueños y jefes de **empresas de instalaciones** en España: electricistas, fontaneros, climatización y aerotermia, mantenimiento,
técnicos que pasan el día en obra o en la furgoneta. Les importa: no perder clientes, cobrar, tener la agenda llena sin vivir pegados
al teléfono, no hacer papeleo de noche. No les importa la IA como moda.

## Qué tiene que conseguir cada vídeo
1. Que lo vean entero (gancho en los 2 primeros segundos, imagen que ya es «la cosa», historia con giro).
2. Que el instalador se reconozca (situaciones reales del oficio, contadas con respeto, nunca riéndose de él).
3. Que entienda qué hace P&Q y lo pida (CTA de comentario con palabra clave, solo si existe el recurso).
Vender sí, pero contando algo que le sirva aunque no compre.

## Pilares y mezcla (`config/engine.json` → `mix`)
| Pilar | % | Qué es |
|---|---|---|
| problema_real | 30 | Historia de un día de trabajo que sale mal por un problema que se puede arreglar (llamadas perdidas, presupuestos tarde, agenda a mano, partes en papel) |
| demo_sistema | 20 | Lo que montamos, enseñado con la DEMO (siempre rotulado «DEMO · datos ficticios») |
| ia_explicada | 15 | Qué es un agente, qué puede y qué no puede hacer la IA en una empresa de instalaciones, sin humo |
| noticia_ia | 10 | Noticia real y verificada de IA o normativa que afecte al sector, con fuente en pantalla |
| comparativa | 10 | Antes / después, a mano / con sistema, dos técnicos, dos formas de hacerlo |
| jarvis | 5 | El asistente del dueño: «¿qué tengo mañana?», «¿quién no ha pagado?» (demo) |
| debate | 5 | Pregunta que divide al gremio y hace comentar (sin polémica barata) |
| caso_sector | 5 | Situaciones del sector con datos públicos verificados; nunca clientes inventados |
Un experimento como mucho por vídeo, anotado en `episode.json` → `experiment`.

## Estructura (25-50 s)
| Tramo | Qué pasa |
|---|---|
| 0-2 s | Gancho de `assets/hooks/hooks.md` + imagen que ya es el problema. Nunca «Hola, somos…» ni logo al principio |
| 2-8 s | El problema, concreto y visual |
| 8-20 s | Lo que cuesta (consecuencias en tiempo, dinero, clientes; sin cifras inventadas) |
| 20-35 s | La salida: el sistema, la idea o la demo |
| 35-50 s | Resultado + qué estamos montando + CTA de comentario |

## Antes de cada vídeo (obligatorio)
1. **5 ideas × 3 ganchos** en `episodes/<fecha>/ideas.md` y `data/candidates/<fecha>.json`, con nota 1-10 de originalidad,
   relevancia comercial, retención, utilidad y viabilidad (total /50). Se elige la de mayor total salvo motivo escrito.
2. **Guion** (`episode.json`): frases cortas y habladas, español de España, 60-150 palabras, sin rayas largas ni relleno.
3. **Storyboard** (`storyboard.md`): una fila por bloque de frases con plano, acción, texto en pantalla, transición y sonido.
4. Solo entonces la escena (`remotion/src/episodes/E<AAAAMMDD>.tsx`) con el kit `../pq` + `../pqworld`.

## Identidad visual (kit P&Q)
- Paleta de Beltrán: noche `#111820`, pizarra `#303B43`, oro `#C5A574`, lino `#EAE5DA`, luz `#FAF9F6`. Rojo `#E5484D`,
  verde `#3FB97A` y naranja `#F0A04B` SOLO para avisos puntuales (llamada perdida, obra parada, confirmado).
- Tipografía: Jost (texto), Instrument Serif cursiva (acento: números de opción, palabras clave del titular), IBM Plex Mono (fuentes, rótulos).
  Las tres con licencia SIL OFL 1.1 (Google Fonts), en `public/fonts/`. Efectos de sonido propios (`pipeline/sfx.py`) y música original (`pipeline/music.py`).
- Cada plano es un mundo completo ilustrado: fondo con profundidad, personaje, objetos del oficio, luz. Nada de fondos vacíos.
- Movimiento con sentido: la cámara sigue la acción, los golpes caen en la palabra que los nombra, los efectos (ondas, golpe,
  partículas, temblor) solo cuando la historia los pide. Elegante, nunca infantil. Sin cerebros de IA, robots ni neón.
- Logo P✦Q (monograma original, versión clara) solo en el cierre o como avatar de la «Recepción IA».

## Honestidad (no negociable)
- Recreaciones rotuladas «RECREACIÓN»; demo rotulada «DEMO · DATOS FICTICIOS»; negocios y personas de la historia, ficticios y genéricos.
- Cero cifras, clientes, testimonios o resultados inventados. Toda cifra en pantalla o en voz, con fuente verificada por VERITAS.
- Lo que P&Q tiene, según `docs/12-VERDAD-PRODUCTO.md`: lo que está en demo se dice «lo estamos montando» / «te enseñamos la demo»,
  nunca «nuestros clientes ya…».
- «Voz generada con IA.» en la caption de Instagram (la API no tiene campo) y marcar «Contenido generado por IA» en TikTok.

## CTA
- Comentario con UNA palabra clave, dicha en la voz y escrita en pantalla (p. ej. «Comenta LLAMADA y te enseñamos la demo»).
- Solo con recurso real y comprobado (`publication.cta.resource_url` + `resource_checked`). Hoy el recurso es la demo
  (https://pq-field-os-demo.onrender.com) o una videollamada. La respuesta por DM la da una persona (CONNECT no está activo):
  no prometas «te llega al momento».

## Captions
- Instagram: primera línea = la petición (el vídeo ya trae el gancho), 2-5 párrafos cortos con las palabras que buscaría un instalador
  («electricista», «presupuesto», «aerotermia»…), una sola petición, como mucho 3 hashtags, sin enlaces.
- TikTok: distinta, más corta, hasta 5 hashtags.

## La cuadrícula de Instagram
Los 3 Reels fijados forman el tríptico de marca. Las portadas diarias usan el fotograma del gancho con la misma paleta. Cuando haya
una serie de 3 días (p. ej. «3 llamadas que pierde un instalador»), se marca `series` en `episode.json` para que las tres portadas
vayan juntas en la cuadrícula.

## Aprendizaje
`pipeline/insights.mjs` resume métricas reales por pilar, gancho y duración en `data/insights.json` (hipótesis, nunca certezas con
pocos datos). NOVA lo lee antes de elegir; si no hay datos, lo dice y no se inventa tendencias.
