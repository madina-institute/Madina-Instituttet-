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

## Sikkerhetskopi

- Automatisk: søndag kl. 03:00 (Cloud Scheduler).
- Manuell: `taSikkerhetskopiNa` — krever innlogging + admin-tilgang.
