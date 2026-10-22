# 10 · Estado real

## 22-10-2026 (noche) · pasa a ser el P&Q AI CONTENT ENGINE
| Pieza | Estado | Evidencia / qué falta |
|---|---|---|
| Línea editorial de curiosidades | **Retirada** | Agentes, configuración y comprobaciones pasan a P&Q para instaladores (docs/11 y 12). Los episodios 21-10 y 22-10 quedan como histórico; el del 22-10 NO se publica |
| Kit ilustrado P&Q (`remotion/src/pq.tsx`, `pqworld.tsx`) | Probado en local (Windows) | Fotogramas revisados uno a uno; render en el runner Linux: ver run del 23-10 |
| Episodio 2026-10-23 (escalera o teléfono) | Producido en local (idea, guion, voz, música, escena) | Render, QA, SENTINEL y release en produce.yml |
| Horario | Implementado | publish 08:30 Madrid (cron 5-9 UTC); produce la víspera desde las 10:30 (`madrid-gate --next`). Tests 59/59 |
| Instagram | En producción (publica solo) | Primer post del motor nuevo: 23-10 08:30 |
| TikTok | Borrador en la bandeja (NO automático) | Hay que terminar la publicación en la app; público directo exige la auditoría de TikTok |
| CTA «Comenta LLAMADA» | Respuesta manual | CONNECT (DM automático) sigue sin App Review: contesta una persona |

## Histórico (21-10-2026, madrugada)

Escala: **implementado** → **probado con mocks** → **probado con API real** → **autorizado** → **en producción**.

| Pieza | Estado | Evidencia / qué falta |
|---|---|---|
| Piloto Venus (`output/pilot/`) | **Terminado, NO publicado** | MP4 42,4 s, QA 100/100, voz 137/138. Pendiente de tu revisión |
| Voz (VoxCPM2) + alineado + música | Probado en local (Windows) | En el runner Linux: NO VERIFICADO (requirements fijados, sin instalar allí) |
| Render Remotion + QA técnico | Probado en local | En Linux con swangle: NO VERIFICADO |
| Orquestador, publicadores, QA, CONNECT, INSIGHT, tokens | Probado con mocks | `npm test`: 47/47. Sin llamadas reales a ninguna API |
| Instagram | Conectado con API real (lectura), desactivado | 21-10: app de Meta «PQ Curiosity Engine» (modo desarrollo), cuenta @perezandquintano (BUSINESS) como tester. Token en `.env` local verificado: `/me` OK y `content_publishing_limit` OK (permiso de publicar). Aún sin publicar nada; falta pasarlo a GitHub Secrets |
| TikTok | Conectado con API real (lectura), desactivado | 21-10: app «PQ Curiosity Engine» en la cuenta de desarrollador de P&Q (sandbox), con la cuenta de P&Q como usuario de prueba. `pipeline/tiktok-auth.mjs` (PKCE, localhost:8723) guardó tokens en `.env`; `user/info` y `creator_info` OK. Sin auditoría solo SELF_ONLY en cuentas privadas: **publicar en la cuenta pública de P&Q requiere la auditoría** (demo en vídeo). Tras aprobarse, el client key de producción será distinto al de sandbox |
| CONNECT (DM por palabra clave) | Probado con mocks, desactivado | Necesita App Review de Meta (acceso avanzado) |
| Workflows GitHub Actions | Implementados, YAML válido | produce en 5 jobs aislados (gate, write, build, review, save), acciones fijadas por SHA. `save-state.sh` probado con repo local. Workflow real: NO VERIFICADO |
| Claude headless en el runner | Implementado | Falta `CLAUDE_CODE_OAUTH_TOKEN`. NO VERIFICADO |
| Revisión de Codex | Hecha (21-10): 5 + 1 hallazgos P2, todos corregidos con pruebas | Dos pasadas (repo completo y correcciones) |
| Minutos de Actions | Resuelto | Repo público: minutos ilimitados. La producción va en 5 jobs aislados (docs/06-CIBERSEGURIDAD.md) |
