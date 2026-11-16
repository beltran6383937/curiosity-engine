# 13 · CUENTAS CLARAS: modelo de contenido para P&Q (16-11-2026)

Formato nuevo de la cuenta @perezandquintano. Sustituye al encargo anterior que había en este número (retirado el 16-11-2026 por orden de Beltrán). Código, voz y datos del proyecto en `cuentas-claras/`.

## Qué es
Vídeos de 25-30 s en dibujo animado. Una recreación con personajes genéricos y ficticios en la que un oficio pierde dinero por una fricción operativa. Se calcula línea a línea en un libro de cuentas que se rellena al ritmo de la voz, entra un total grande y llega un **veredicto honesto**: «esto lo arregla un sistema» o «esto NO necesita tecnología». Cierre con una palabra clave de comentario.

Por qué encaja: el veredicto negativo no lo hace nadie del sector y casa con el criterio de P&Q de decidir si hace falta tecnología antes de venderla.

## De dónde sale (verificado el 15-11-2026, fuente pública Volume, tryvolume.app/working)
- Tendencia «On-screen scoreboard fills in as you talk», nicho dinero, TikTok: 0 → 4 → 6 cuentas entre el 2, el 8 y el 15 de noviembre, mediana 27x la media de cada cuenta. Técnica madre «Empty list fills in as you talk»: 8 cuentas, mediana 18x.
- Tres ejemplos de cuentas pequeñas de esa semana: @cheddarpay 89x, @organisemymoneyy 48x, @notesbynathan 34x (enlaces en `cuentas-claras/investigacion/`).
- Límites: es del nicho dinero y de TikTok, no está probado en B2B ni en español; «emergente» significa que entró en la lista, no que crezca de forma masiva. Ningún vídeo se ha visto reproducido. Los números de un episodio no son datos de clientes.

## Episodio 1, «La llamada que no coges» (`cuentas-claras/ep01.json`)
Historia: un fontanero está bajo el fregadero y le suena el móvil (cliente nuevo, 350 €). Tiene las manos sucias, no lo coge, la moneda echa alas y se va, y la clienta llama al siguiente, que contesta al instante. Libro de cuentas: 6 llamadas perdidas por semana, 1 de cada 3 era trabajo = 2, × 350 € = 700 €, × 4 semanas = **2.800 € al mes** (6 ÷ 3 = 2; 2 × 350 = 700; 700 × 4 = 2.800, comprobado). Veredicto: «NO NECESITA IA, un mensaje automático en diez segundos». Se ve el móvil del fontanero contestando solo al cliente, que se queda contento. Cierre: «Comenta CUENTA y te hago la tuya» + web.

Guion (voz, ~28 s): «¡Este fontanero acaba de perder trescientos cincuenta euros... y ni se ha enterado! / Le suena el móvil: cliente nuevo. Pero tiene las manos hechas un asco, y el cliente llama al siguiente. / De esas, una de cada tres era curro. Dos trabajos. / A trescientos cincuenta euros cada uno: setecientos a la semana. / Por cuatro semanas... ¡dos mil ochocientos euros al mes, joder! / Veredicto: esto no necesita IA. Un mensaje automático en diez segundos, y ya está. / Comenta CUENTA y te hago la tuya.»
Gancho (viral-hooks #54, 2,6M de vistas del original): imagen del fotograma 0 = el móvil sonando y la moneda de 350 €.

## Reglas de honestidad de este formato (siguen a docs/11 y docs/12)
- Rótulo fijo «RECREACIÓN · NÚMEROS DE EJEMPLO» en todo el vídeo. Personajes y negocio ficticios y genéricos.
- Cero clientes, testimonios, resultados o precios de P&Q. Un caso real solo con permiso y anonimizado.
- La sugerencia «mensaje automático» es consejo general para el espectador. No se dice que P&Q lo tenga como servicio funcionando (la recepción con IA sigue en DEMO).
- «Voz generada con IA.» en la caption de Instagram; «Contenido generado por IA» marcado a mano en TikTok.
- CTA «Comenta CUENTA»: solo mientras una persona (Beltrán) conteste con la cuenta del espectador; el diagnóstico es manual y gratuito. Si no hay quien conteste, no se usa. Los DM los contesta una persona (CONNECT no está activo).
- Web `perezandquintano.es` en el cierre.

## Producción (todo gratis y local)
1. Voz: clon local «Will» con VoxCPM2 (`cuentas-claras/voz/gen_story.py`), frase a frase con una cola desechable «Venga, chao.». ElevenLabs agotado hasta el 2-12-2026. El audio de referencia no está en el repo.
2. `voz_check.py` (faster-whisper) comprueba cada frase contra el guion. `assemble_story.py` las une, acorta pausas, acelera 1,07 y escribe `remotion/tl.json` con las señales de tiempo sacadas de las palabras reales. `mix_story.py` añade efectos de cartoon sintetizados.
3. Imagen: Remotion + SVG hecho a mano (`remotion/art.tsx`, `Ep1.tsx`), tipografía Fredoka (SIL OFL), plata y violeta, contorno grueso y colores planos, transición de iris circular. Subtítulos palabra a palabra sincronizados.
4. Render: `npx remotion render cuentas-claras/remotion/index.tsx Ep1 out.mp4 --public-dir=cuentas-claras/remotion/public` (con `audio.wav` en `public/`), después `loudnorm` a −14 LUFS.
5. QA hecha: ffprobe (1080×1920, 30 fps), ebur128 −14,3 LUFS, tira de fotogramas revisada. Voz comprobada con Whisper (coincidencia 0,90 a 1,0). **Pendiente de escucha humana.**

## Publicar
Release con `video.mp4` y `caption.txt` y `gh workflow run publish-video.yml -f tag=<tag>`: Instagram con la `video_url` de la release; TikTok a la bandeja (terminar en la app y marcar «Contenido generado por IA»). Nunca se da por publicado sin el ID que devuelve la plataforma.

## Medir y siguientes episodios
Medir: retención a 3 s, % visto entero, comentarios CUENTA, mensajes recibidos. Hipótesis: un marcador con el total al final retiene más que un consejo hablado y la palabra CUENTA genera comentarios cualificados.
Siguientes: 2 «El presupuesto que mandas el jueves» · 3 «La factura que reclamas a mano» · 4 «El WhatsApp de las 22:00» · 5 «El cliente que no vuelve» · 6 **«Esto NO necesita tecnología»** (veredicto negativo completo; el que más nos diferencia).
