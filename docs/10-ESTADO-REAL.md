# 10 · Estado real (21-10-2026, madrugada)

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
