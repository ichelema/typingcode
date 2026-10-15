---
name: obiettivo
description: mostrare all'utente gli output dei tool di Claude Code usati da TypingMind via MCP, senza ricopiarli e solo quelli della chat aperta
metadata:
  type: project
---

# Obiettivo

In TypingMind gli output dei tool di Claude Code (Bash, Read, …) non sono visibili all'utente:
l'assistente li vede, l'utente no.

Obiettivo: mostrarli automaticamente all'utente, senza che l'assistente debba ricopiarli, e
possibilmente **solo quelli della chat aperta**.

Soluzione in uso: il proxy `src/mcp/mcp_proxy.py` registra le chiamate, il viewer
`src/mcp/log_viewer.py` le mostra, l'estensione TypingMind le apre in un pannello laterale
filtrato sulla chat (vedi [architettura](reference_architettura.md)).
