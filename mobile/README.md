# StudMate Mobile

Nova Expo mobilna aplikacija zivi u ovom folderu i ne dira postojeci web `client`.

## Pokretanje

1. Kopiraj `.env.example` u `.env`
2. Upisi tacan backend URL u `EXPO_PUBLIC_API_URL`
3. Upisi Expo/EAS project id u `EXPO_PUBLIC_EAS_PROJECT_ID` ako zelis push notifikacije
4. Instaliraj pakete:

```bash
npm install
```

5. Pokreni Expo:

```bash
npm run start
```

## Napomena

- Za lokalni telefon koristi LAN adresu racunara, ne `localhost`
- Ova faza pokriva skeleton, auth i navigaciju
- Push notifikacije traze validan `EXPO_PUBLIC_EAS_PROJECT_ID`
- Background tracking za citaonicu je zapocet kroz foreground polling i dalje se moze siriti za full background build
