#!/usr/bin/env bash
# Engangs-oppsett: Vipps produksjonsnøkler i Firebase Secret Manager.
# Kjør lokalt etter «firebase login» — aldri commit nøklene.
set -euo pipefail

PROJECT="${FIREBASE_PROJECT:-madina-instituttet}"

echo "Prosjekt: $PROJECT"
echo "Du blir bedt om å lime inn hver hemmelighet (fra Vipps Developer Portal, Production)."
echo ""

for name in VIPPS_CLIENT_ID VIPPS_CLIENT_SECRET VIPPS_SUBSCRIPTION_KEY VIPPS_WEBHOOK_SECRET; do
  echo "→ $name"
  firebase functions:secrets:set "$name" --project "$PROJECT"
done

echo ""
echo "Opprett functions/.env (ikke commit) med MSN og prod:"
echo "  VIPPS_ENV=prod"
echo "  VIPPS_MSN=<din produksjons-MSN>"
echo "  SITE_BASE_URL=https://madinaskole.no"
echo ""
echo "Deploy:"
echo "  cd functions && firebase deploy --only functions --project $PROJECT"
echo ""
echo "GitHub Actions: legg til repository secrets VIPPS_MSN (og valgfritt VIPPS_ENV=prod)."
echo "Webhook hos Vipps:"
echo "  https://us-central1-madina-instituttet.cloudfunctions.net/vippsWebhook"
