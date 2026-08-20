# Madina Skole — Cloud Functions

## Deploy

```bash
cd functions
npm install
firebase deploy --only functions --project madina-instituttet
```

## Vipps (produksjon)

1. Sett hemmeligheter i Secret Manager:
   - `VIPPS_CLIENT_ID`
   - `VIPPS_CLIENT_SECRET`
   - `VIPPS_SUBSCRIPTION_KEY`
   - `VIPPS_WEBHOOK_SECRET`
2. Sett miljøvariabler (`.env` eller Firebase params):
   - `VIPPS_ENV=prod`
   - `VIPPS_MSN=<ekte MSN>`
   - `SITE_BASE_URL=https://madinaskole.no`
3. Registrer webhook-URL hos Vipps mot `vippsWebhook`.
4. Test én liten betaling i prod før skolestart.

### Bankkort (CARD)

Freestanding kort (`paymentMethod.type = CARD`) **virker ikke i Vipps test/MT**.
`cards-mt.vipps.no` viser «ikke tilgjengelig» — dette er en Vipps-begrensning, ikke en feil i koden.

- Test: bruk **Betal med Vipps** (WALLET) i test-appen.
- Produksjon: sett `VIPPS_ENV=prod`, få CARD aktivert på MSN hos Vipps, og sett
  `vippsKortAktiv: true` i Firestore `settings/priser` for å vise kortknappen i foreldreportalen.

## CI (GitHub Actions)

Workflow `Deploy Cloud Functions` lager `functions/.env` automatisk ved deploy
(`VIPPS_ENV`, `VIPPS_MSN`, `SITE_BASE_URL`). Hemmeligheter hentes fra Secret Manager.

**GitHub repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Verdi |
|--------|--------|
| `VIPPS_MSN` | Produksjons-MSN fra Vipps (påkrevd) |
| `VIPPS_ENV` | `prod` (valgfri — standard er prod) |
| `FIREBASE_TOKEN` | Deploy-token (finnes allerede) |

Engangs-oppsett av Firebase-hemmeligheter lokalt:

```bash
chmod +x functions/setup-vipps-prod.sh
./functions/setup-vipps-prod.sh
```

## Sikkerhetskopi

- Automatisk: søndag kl. 03:00 (Cloud Scheduler).
- Manuell: `taSikkerhetskopiNa` — krever innlogging + admin-tilgang.
