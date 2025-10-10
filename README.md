
# HyMy-kylä – Palautekyselyjärjestelmä


## 🎯 Projektin tarkoitus

Tämä sovellus on rakennettu osana **Metropolian HyMy-kylän palautteenkeruuprosessin digitalisointia**.  
Tavoitteena on tehdä palautejärjestelmästä helppokäyttöisempi, nopeampi ja paremmin hallittava

Sovellus koostuu kahdesta osasta:

- **app/** – taustapalvelin (Node.js + Express + MongoDB)
- **frontend/** – käyttöliittymä (React + Vite + Tailwind CSS)

---

## 🚀 Kehitysympäristön käyttöönotto

### 1. Asenna riippuvuudet
```bash
cd app && npm install
cd frontend && npm install
```

### 2. Ympäristömuuttujat
Kopioi `.env.example` tiedostot ja nimeä ne `.env`-tiedostoiksi:


Täytä tarvittavat tiedot:
- MongoDB-yhteys (`MONGODB_URI`)
- JWT-salaisuus (`JWT_SECRET`)
- Admin-sähköposti ja salasana kehitystä varten

### 3. Palveluiden käynnistäminen
Käynnistä taustapalvelin:
```bash
cd app
npm run dev
```

Käynnistä käyttöliittymä toisessa ikkunassa:
```bash
cd frontend
npm run dev
```

Oletuksena:
- **Backend:** http://localhost:8080  
- **Frontend:** http://localhost:5173

---

## 🧱 Projektin rakenne
```
hymykyla/
│
├─ app/                  # Express + MongoDB -palvelin
│   ├─ src/
│   │   ├─ controllers/  # Auth, Survey, Feedback jne.
│   │   ├─ models/       # Mongoose-mallit
│   │   ├─ routes/       # Express-reitit
│   │   ├─ middleware/   # esim. requireAuth
│   │   └─ schemas/      # Zod-skeemat
│   ├─ .env.example
│   └─ package.json
│
├─ frontend/             # React + Vite käyttöliittymä
│   ├─ src/
│   ├─ public/
│   ├─ .env.example
│   └─ package.json
│
├─ .gitignore
└─ README.md
```

---

## 🔐 Kirjautuminen (Admin)

1. Käynnistä backend.  
2. Luo ylläpitäjä (vain kehitysympäristössä):
   ```bash
   POST /auth/create-admin
   ```
   Vastauksena saat:
   ```json
   { "ok": true, "seeded": true }
   ```
3. Kirjaudu sisään `/auth/login` ja saat admin-evästeen.

---

## 🧭 Keskeiset API-reitit

### Julkiset
- `GET /survey/current` – Hae aktiivinen kysely  
- `POST /feedback/submit` – Lähetä vastaus kyselyyn

### Admin (vaatii kirjautumisen)
- `GET /admin/surveys` – Listaa kyselyt  
- `POST /admin/surveys` – Luo uusi kysely  
- `PUT /admin/surveys/:id` – Päivitä kysely  
- `POST /admin/surveys/:id/activate` – Aktivoi kysely  
- `POST /admin/surveys/:id/questions` – Lisää kysymys  
- `GET /admin/responses` – Hae palautteet

---

## ⚙️ Ympäristömuuttujat
Tärkeimmät asetukset löytyvät tiedostosta `.env.example`.

| Muuttuja | Selitys |
|-----------|----------|
| `MONGODB_URI` | MongoDB-yhteysosoite |
| `PORT` | Palvelimen portti (oletus 8080) |
| `CORS_ORIGIN` | Frontendin osoite |
| `JWT_SECRET` | Salainen avain sessioiden allekirjoitukseen |
| `COOKIE_NAME` | Evästeen nimi sessiolle |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Kehityksen admin-tunnus |

---


**© 2025 Metropolia HyMy-kylä Feedback Project**
