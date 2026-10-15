# Indice delle memorie

Una riga per memoria: `- [Titolo](file.md) — gancio`. Il contenuto sta nel file, mai qui.
Prefisso del file = tipo: `project_` (lavoro in corso, decisioni, storia), `reference_` (fatti
verificati, puntatori), `feedback_` (insidie e regole di lavoro). Fatto che cambia → aggiorna il file esistente.

- [Obiettivo](project_obiettivo.md) — mostrare all'utente gli output dei tool di Claude Code usati da TypingMind via MCP, solo quelli della chat aperta
- [Stato e prossimi passi](project_stato-e-roadmap.md) — 2026-10-15: 0.4.1 in uso, 0.6.0 (ICH-180, pannello dalla chat) provata e pubblicata; profilo di debug in `D:`, `C:\Download\test` da eliminare; prossimi: URL 0.6.0 nel browser, decisione su log e viewer, ICH-179, ICH-181
- [Decisioni prese](project_decisioni-prese.md) — resto su MCP; 0.5.0 annullata e ritorno alla 0.4.1; repo pubblico con email `noreply`; `references/` come submodule; log e viewer fino a ICH-180
- [Diario delle sessioni](project_diario.md) — una riga per passo significativo dal 14/10/2026, con ora, cosa è stato fatto e stato lasciato
- [Architettura e configurazione MCP](reference_architettura.md) — TypingMind → connettore :50880 → `mcp_proxy.py` → `claude mcp serve`; viewer :8765; estensione 0.6.0 senza viewer; connettore di debug :50881; config di `claude_code`; variabili `MCP_PROXY_*`; API del connettore
- [Struttura della cartella](reference_struttura-cartella.md) — cosa contiene ogni file e cartella, cosa è escluso da git, backup e rollback
- [Estensione TypingMind](reference_estensione.md) — repo e URL githack in uso, versioni 0.1–0.6.0, funzionamento e misure della 0.6.0, prova senza pubblicare, diagnostica ed emergenza
- [Scoperte ed esclusioni](reference_scoperte.md) — hook non scattano con `mcp serve` (2.1.299); nessun id chat; dati dei tool nella chat IndexedDB; salvataggio con `put`; `format: "error"`; Sentry Replay; costo accessibilità; connettore 50880/50881 e `HOSTNAME`
- [Comandi](reference_comandi.md) — test, build, hook git (`core.hooksPath`), Chrome di debug e connettore di debug, `cdp.mjs` (eval/evalfile/shot), riavvio del viewer, controllo del proxy, Linear
- [Insidie dell'ambiente](feedback_insidie-ambiente.md) — Blast Radius e `rm`, `gh` non autenticato, lock di Windows su `mv`, CRLF in `mcp_proxy.py`, email git personale, `cdp.mjs` e la prima scheda, risparmio token
