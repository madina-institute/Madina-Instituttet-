# Cloud Agent — Madina Instituttet

## SIST-ENDRET-stempel (obligatorisk)

Når du redigerer filer som vises i nettleser eller deployes til Firebase, **må** du oppdatere `SIST-ENDRET`-stempelet øverst i filen **før commit**. Dette er separate fra «Siste publisering» (CI-deploy fra GitHub Actions).

Format (Oslo-tid, `YYYY-MM-DD HH:MM:SS`):

| Filtype | Format |
|---------|--------|
| `.html` | `<!-- SIST-ENDRET: 2026-08-20 10:38:39 -->` rett etter `<!DOCTYPE html>` |
| `.js` (functions, skript) | `/* SIST-ENDRET: 2026-08-20 10:38:39 */` på linje 1 |

Referanse: `publish-tool.html` → `stemplFil()` / `noTid()`.

Uten oppdatert stempel viser siden gammel «Sist endret» eller «Uten tidsstempel — publisert utenom verktøyet».

## Deploy

- **Hosting** (`*.html`, statiske filer): push til `main` → GitHub Actions `Deploy to Firebase Hosting`
- **Cloud Functions** (`functions/**`): push til `main` → GitHub Actions `Deploy to Firebase Functions`

Cloud Agent publiserer via git push, ikke via publish-tool — derfor må stempelet settes manuelt.

## Testing

- Kjør relevante endringer end-to-end (terminal og/eller nettleser) før du pusher.
- For UI-endringer i `.html`: verifiser i nettleser når mulig.

## Driftslogg (CLOUD-AGENT-LOG.md)

Etter større endringer: oppdater `CLOUD-AGENT-LOG.md` (seksjon 1–4) med arbeid, feil, tips og gjenstående oppgaver.

Filen oppdateres også **automatisk hver 10. time** via GitHub Actions (`cloud-agent-log.yml`) med nye commits.
