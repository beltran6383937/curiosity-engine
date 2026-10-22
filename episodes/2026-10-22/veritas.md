# VERITAS: episodio 2026-10-22 (llantas al revés), revisión del texto final

Fuente: Purves D, Paydarfar JA, Andrews TJ, "The wagon wheel illusion in movies and reality", PNAS 93(8):3693-3697, abril de 1996, DOI 10.1073/pnas.93.8.3693, PMID 8622999, PMCID PMC39674. La página de PMC devolvió una verificación de navegador, así que el registro (metadatos y abstract) se releyó en Europe PMC el 2026-10-22.
Fragmentos del abstract comprobados: "Wheels turning in the movies or in other forms of stroboscopic presentation often appear to be rotating backward"; "a similar illusion is also seen in continuous light"; "suggests that we normally see motion, as in movies, by processing a series of visual episodes". El abstract no menciona fps ni número de radios. La explicación por episodios aparece como sugerencia de los autores, no como hecho establecido.
Debate sobre la causa con luz continua: Kline, Holcombe y Eagleman, "Illusory motion reversal is caused by rivalry, not by perceptual snapshots of the visual field", Vision Research 44(23):2653-2658, 2004; Kline, Holcombe y Eagleman, "Illusory motion reversal does not imply discrete processing", Vision Research, 2006; Kline y Eagleman 2008, J Vis (PMC2856842). No hay consenso, así que "Su causa no la damos por resuelta" es correcto.

Aritmética recalculada: 360° / 5 = 72°. 72° x 24 fps = 1728 °/s. 1728 / 360 = 4,8 rev/s. Con un giro algo menor que 72° por fotograma, el radio más cercano a cada posición anterior queda un poco por detrás y la rueda parece retroceder (esto vale entre 36° y 72°). Con un giro algo mayor, queda un poco por delante y parece avanzar despacio (entre 72° y 108°). Hay más velocidades que la congelan: cualquier múltiplo de 72° por fotograma (9,6 rev/s, 14,4 rev/s, etc.). El guion no dice que 4,8 sea la única, así que es correcto.

Veredicto global sobre el texto final: VERIFIED. No hay nada corregido ni rechazado, así que no se bloquea. Propongo dos retoques opcionales que no bloquean (frases 3 y 5). 24 fps y 5 radios quedan explícitamente como supuesto ("Supongamos... Es un cálculo, no una medición."). No se atribuye una causa a la ilusión con luz continua.

## Guion (lines)

| # | Frase | Estado | Nota |
|---|-------|--------|------|
| 0 | ¿Por qué las llantas parecen girar al revés en vídeo? | verified | "Parecen" y "en vídeo" acotan bien el fenómeno: es el caso estroboscópico del abstract ("often appear to be rotating backward"). |
| 1 | El coche avanza, pero la rueda parece retroceder. | verified | "Parece" es una cautela correcta. |
| 2 | La culpa no es de la rueda. | verified | |
| 3 | Es de la cámara, que graba fotos sueltas. | verified (retoque opcional) | Es correcto para el vídeo: muestreo discreto por fotogramas, es decir, aliasing temporal. El contexto de la frase 0 ("en vídeo") y el "Pero" de la frase 8 evitan la contradicción con la luz continua. Aun así, para que nadie lo entienda como "la ilusión solo existe por la cámara", propongo este texto: "En vídeo, es de la cámara, que graba fotos sueltas." |
| 4 | Supongamos 5 radios y vídeo a 24 fps. Es un cálculo, no una medición. (say: "cinco radios... veinticuatro fotogramas por segundo") | verified | El supuesto está explícito. El say coincide con la frase. |
| 5 | Si gira 72° por fotograma, cada radio ocupa el hueco del siguiente. (say: "setenta y dos grados") | verified (retoque opcional) | 360°/5 = 72° es correcto. "Hueco" se puede malinterpretar como el espacio vacío entre dos radios, que estaría a 36° y no a 72°. Un storyboard que dibuje el radio cayendo entre dos radios sería falso. Propongo este texto: "Si gira 72° por fotograma, cada radio ocupa el lugar del siguiente." |
| 6 | A 4,8 vueltas por segundo, la llanta parece quieta. (say: "cuatro coma ocho") | verified | 72° x 24 = 1728 °/s = 4,8 rev/s. Recalculado y correcto. No dice que sea la única velocidad. |
| 7 | Si gira algo menos, parece que retrocede. Algo más, avanza despacio. | verified | El sentido es correcto: con menos de 72° retrocede y con más avanza. "Algo" evita afirmarlo para cualquier valor (el rango es de 36° a 108°). |
| 8 | Pero en 1996, Purves y su equipo señalaron algo en PNAS. (say: "mil novecientos noventa y seis... pe, ene, a, ese") | verified | Purves, Paydarfar y Andrews, PNAS 93(8), abril de 1996. "Su equipo" es aceptable. |
| 9 | Una ilusión parecida también se ve con luz continua. | verified | Es fiel a "a similar illusion is also seen in continuous light": "parecida" traduce "similar" y no exagera a "la misma". |
| 10 | Su causa no la damos por resuelta. | verified | Es correcto: Purves et al. sugieren episodios discretos y Kline, Holcombe y Eagleman (2004, 2006, 2008) defienden la rivalidad o adaptación. No hay consenso, y la frase no atribuye ninguna causa. |
| 11 | La rueda avanza. Lo que se lía es lo que la mira. | verified | Funciona como cierre: "lo que la mira" incluye la cámara (frases 3-7) y el sistema visual (frase 9). Decir que la percepción no coincide con el movimiento real es la definición de ilusión, no un mecanismo, así que no contradice la frase 10. Matiz que no bloquea: la cámara no "se lía", registra fielmente fotogramas sueltos y el error aparece al verlos seguidos. Es una licencia coloquial aceptable. Si se prefiere más precisión, propongo este texto: "La rueda avanza. Lo que falla es cómo la vemos." |

## Claims del episode.json

1. Purves, Paydarfar y Andrews (1996, PNAS 93(8):3693-3697): las ruedas en cine o en presentaciones estroboscópicas a menudo parecen girar hacia atrás, y una ilusión similar se ve con luz continua. Estado: verified. Los fragmentos literales coinciden con el abstract (Europe PMC, PMC39674), y la cita bibliográfica y la URL son correctas.
2. Cálculo con 5 radios y 24 fps: 72° por fotograma, 4,8 rev/s, la llanta parece quieta; algo menos retrocede y algo más avanza despacio; es aliasing temporal de la cámara. Estado: verified. La aritmética está recalculada y el sentido es correcto. "Una de las velocidades que la congelan" es preciso (también los múltiplos).

## Avisos para storyboard y render (no evaluados: no hay storyboard en episodes/2026-10-22/)

- Si se anima la rueda, el render debe ir a 24 fps o el giro debe ajustarse a los fps de salida (con 30 fps, quieta = 72° x 30 = 6 rev/s). Si no, la demostración visual no coincidirá con las cifras narradas.
- No se debe dibujar el radio cayendo en el hueco entre radios (36°). Debe caer en la posición del radio siguiente (72°).
- No se debe visualizar la ilusión con luz continua como "el ojo graba fotogramas", porque eso sería tomar partido por una causa no resuelta.
