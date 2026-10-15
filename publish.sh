#!/usr/bin/env bash
# Test e build dell'estensione (src/extension -> dist/ext.js), commit e push del progetto nel repo GitHub pubblico
# typingcode; stampa gli URL di dist/ext.js fissati al commit.
# Eseguilo dal terminale in cui gh e' autenticato. Uso: bash publish.sh ["messaggio di commit"]
set -euo pipefail
cd "$(dirname "$0")"

REPO="typingcode"
MSG="${1:-Update typingcode}"

if ! gh auth status >/dev/null 2>&1; then
  echo "ERRORE: gh non e' autenticato in questo terminale (esegui: gh auth login)"; exit 1
fi

(cd src/extension && bun test >/dev/null 2>&1) || { echo "ERRORE: test falliti (cd src/extension && bun test)"; exit 1; }
(cd src/extension && bun build.mjs)

LOGIN=$(gh api user -q .login)
ID=$(gh api user -q .id)
EMAIL="${ID}+${LOGIN}@users.noreply.github.com"   # email noreply: il repo e' pubblico, non esporre l'email reale

[ -d .git ] || git init -q -b main
git config user.name  "$LOGIN"                      # solo per questo repo, non globale
git config user.email "$EMAIL"
# Solo i file del progetto: .gitignore esclude profilo Chrome, log, backup e le copie di terzi in references/
git add --all -- .gitignore publish.sh CLAUDE_OPUS.md core-behavior.md RECAP_sessione.md mcp_proxy.py log_viewer.py \
  src dist tm-inspect/cdp.mjs tm-inspect/shot.mjs references/README.md
git status --short
git commit -q -m "$MSG" || echo "(nessuna modifica da committare)"

if git remote get-url origin >/dev/null 2>&1; then
  git push -u origin main
else
  gh repo create "$REPO" --public --source . --remote origin --push
fi

SHA=$(git rev-parse HEAD)
echo
echo "Repo:  https://github.com/$LOGIN/$REPO"
echo "SHA:   $SHA"
echo "URL per TypingMind (fissati al commit):"
echo "  githack:  https://rawcdn.githack.com/$LOGIN/$REPO/$SHA/dist/ext.js"
echo "  jsDelivr: https://cdn.jsdelivr.net/gh/$LOGIN/$REPO@$SHA/dist/ext.js"
for U in "https://rawcdn.githack.com/$LOGIN/$REPO/$SHA/dist/ext.js" "https://cdn.jsdelivr.net/gh/$LOGIN/$REPO@$SHA/dist/ext.js"; do
  if curl -fsS -o /tmp/tv_ext_check.js "$U" && cmp -s /tmp/tv_ext_check.js dist/ext.js; then echo "  OK  $U"; else echo "  KO  $U (non ancora servito o diverso)"; fi
done
