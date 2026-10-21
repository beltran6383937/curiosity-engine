#!/usr/bin/env bash
# Guarda el estado del run en main desde GitHub Actions: convierte las alertas pendientes en issues
# (etiqueta "alerta", llega por correo) y hace commit + push con reintentos. Si no consigue subirlo, falla en rojo.
# Uso: bash pipeline/save-state.sh "<mensaje>" <rutas...>
# El checkout de producción va sin credenciales (el modelo puede leer .git/config): se autentica aquí con GH_TOKEN.
set -euo pipefail
msg="$1"; shift
git config user.name "curiosity-engine[bot]"; git config user.email "bot@users.noreply.github.com"
remote=origin
[ -n "${GH_TOKEN:-}" ] && [ -n "${GITHUB_REPOSITORY:-}" ] && remote="https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"

if [ -s data/alerts/pending.md ]; then
  gh label create alerta --color B60205 --description "Curiosity Engine necesita atención" 2>/dev/null || true
  gh issue create --label alerta --title "Curiosity Engine: $(head -n1 data/alerts/pending.md | sed 's/^- //' | cut -c1-90)" --body-file data/alerts/pending.md
  : > data/alerts/pending.md
fi
if [ -s data/alerts/tiktok.md ]; then
  gh label create tiktok --color 000000 --description "Vídeo en la bandeja de TikTok: pegar texto y publicar" 2>/dev/null || true
  # Si el aviso falla, el estado se guarda igual (así no se resube el vídeo) y el aviso queda para la siguiente pasada
  if gh issue create --label tiktok --title "TikTok listo en tu bandeja: $(date +%F)" --body-file data/alerts/tiktok.md; then : > data/alerts/tiktok.md
  else echo "::warning::no se pudo crear el aviso de TikTok; se reintenta en la siguiente pasada"; fi
fi

# Solo rutas que existen o que git conoce (borrados incluidos): un pathspec inexistente haría fallar el add entero
paths=()
for p in "$@" data/alerts; do
  if [ -e "$p" ] || git ls-files --error-unmatch -- "$p" >/dev/null 2>&1; then paths+=("$p"); fi
done
[ ${#paths[@]} -gt 0 ] && git add -A -- "${paths[@]}"
git diff --cached --quiet && { echo "sin cambios de estado"; exit 0; }
git commit -q -m "$msg"
for i in 1 2 3 4 5; do
  git push -q "$remote" HEAD:main && exit 0
  echo "push rechazado (intento $i): rebase sobre main"; sleep $((i * 3))
  git pull -q --rebase "$remote" main
done
echo "::error::no se pudo guardar el estado en main tras 5 intentos"; exit 1
