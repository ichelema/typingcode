# Indice delle memorie

Una riga per memoria: `- [Titolo](file.md) — gancio`. Il contenuto sta nel file, mai qui.
Prefisso del file = tipo: `project_` (lavoro in corso, decisioni, storia), `reference_` (fatti
verificati, puntatori), `feedback_` (insidie e regole di lavoro). Fatto che cambia → aggiorna il file esistente.

- [Obiettivo](project_obiettivo.md) — mostrare all'utente gli output dei tool di Claude Code usati da TypingMind via MCP, solo quelli della chat aperta
- [Stato e prossimi passi](project_stato-e-roadmap.md) — 2026-10-15: estensione 0.4.1, proxy v7 in `src/mcp/`, repo `typingcode`; prossimi ICH-180 (pannello dalla chat), ICH-179 (hook), ICH-181 (percorsi portabili, Linux)
- [Decisioni prese](project_decisioni-prese.md) — resto su MCP; 0.5.0 annullata e ritorno alla 0.4.1; repo pubblico con email `noreply`; `references/` come submodule; log e viewer fino a ICH-180
- [Diario delle sessioni](project_diario.md) — una riga per passo significativo dal 14/10/2026, con ora, cosa è stato fatto e stato lasciato
- [Architettura e configurazione MCP](reference_architettura.md) — TypingMind → connettore :50880 → `mcp_proxy.py` → `claude mcp serve`; viewer :8765; config di `claude_code`; variabili `MCP_PROXY_*`; API del connettore
- [Struttura della cartella](reference_struttura-cartella.md) — cosa contiene ogni file e cartella, cosa è escluso da git, backup e rollback
- [Estensione TypingMind](reference_estensione.md) — repo e URL githack in uso, versioni 0.1–0.5.0, filtro per chat con firma, diagnostica ed emergenza
- [Scoperte ed esclusioni](reference_scoperte.md) — hook non scattano con `mcp serve` (2.1.299); nessun id chat (`generated: true`); dati dei tool nella chat IndexedDB; compattazione del contesto
- [Comandi](reference_comandi.md) — test, build, hook git (`core.hooksPath`), Chrome di debug, `cdp.mjs`, riavvio del viewer, controllo del proxy, Linear
- [Insidie dell'ambiente](feedback_insidie-ambiente.md) — Blast Radius e `rm`, `gh` non autenticato, lock di Windows su `mv`, CRLF in `mcp_proxy.py`, email git personale, `cdp.mjs` e la prima scheda, risparmio token
