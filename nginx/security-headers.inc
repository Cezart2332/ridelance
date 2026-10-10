# Anteturile de securitate ale fiecărui răspuns.
#
# Fișier separat, inclus în fiecare `location` care are `add_header`-ul ei: în nginx, un
# `add_header` dintr-un bloc le anulează pe toate cele moștenite de mai sus.
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header X-Frame-Options "SAMEORIGIN" always;
# Fără `includeSubDomains`: subdomeniile (api, mail) au configurarea lor.
add_header Strict-Transport-Security "max-age=31536000" always;
