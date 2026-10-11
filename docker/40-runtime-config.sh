#!/bin/sh
# Scrie /config.js din variabilele de mediu ale containerului, la fiecare pornire.
#
# Imaginea e aceeași pe producție și pe site-ul de test; ce diferă (adresa API-ului, cheia publică
# Stripe, tokenul Mapbox) vine de aici. O variabilă lipsă rămâne goală, iar aplicația folosește
# atunci valoarea coaptă la build (src/lib/runtimeConfig.ts).
#
# Rulează din /docker-entrypoint.d/ al imaginii nginx, înainte să pornească serverul.
set -eu

# Valorile ajung într-un șir JavaScript: backslash-ul și ghilimelele se scapă, iar „<” se scrie
# ca secvență, ca nicio valoare să nu poată închide eticheta <script>. Restul e text.
js() {
    printf '%s' "${1:-}" | tr -d '\n\r' | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/</\\u003c/g'
}

cat > /usr/share/nginx/html/config.js <<CONFIG
window.__RL_CONFIG__ = {
  apiBaseUrl: "$(js "${PUBLIC_API_BASE_URL:-}")",
  stripePublicKey: "$(js "${PUBLIC_STRIPE_KEY:-}")",
  mapboxToken: "$(js "${PUBLIC_MAPBOX_TOKEN:-}")"
};
CONFIG
