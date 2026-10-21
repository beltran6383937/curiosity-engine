# 07 · Costes

**Configuración actual (decisión del 20-10-2026): 0 € al mes.** `config/engine.json` → `budget_eur.daily = 0`, `monthly = 0`.

| Pieza | Coste ahora | Nota |
|---|---|---|
| Voz VoxCPM2, Whisper, Remotion, música, SFX | 0 € | Local y open source. Remotion es gratis para equipos de hasta 3 personas. |
| Investigación, guion, escena y revisión visual (Claude Code headless) | 0 € extra | Gasta cuota de la suscripción de Claude del equipo, compartida con su uso normal. |
| GitHub Actions | 0 € | Repo privado: 2.000 min/mes. La producción diaria puede rondar 50–70 min, unos 1.500–2.100 min/mes, **en el límite**. Las 8 pasadas horarias de `publish` suman unos 240 min/mes más (más la espera hasta la hora, unos 3 min al día) (1 min facturado cada una aunque salgan al instante). Repo público: ilimitado. |
| Instagram API / TikTok API | 0 € | |
| Releases (MP4) | 0 € | Unos 20 MB/vídeo, unos 7 GB/año. |

## Si más adelante se aprueba presupuesto (estimaciones, sin verificar en la factura)

| Mejora | Estimación |
|---|---|
| OpenAI Images (`gpt-image-1`, 4–8 imágenes de calidad alta por vídeo) | ~1,5–2,5 $/vídeo, ~45–75 $/mes |
| Runner con más CPU o un VPS dedicado para render y voz | ~15–20 €/mes |
| ElevenLabs (voz premium con licencia comercial) | desde ~22 $/mes |
| Manychat Pro (si se prefiere a la integración propia) | desde ~15 $/mes |

Controles previstos cuando haya gasto: `data/costs.json` por vídeo, corte automático al llegar al tope diario o mensual, como mucho 2 regeneraciones por imagen y caché de recursos por hash del prompt.
