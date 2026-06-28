# StudMate frontend mapa

Ovaj dokument pokazuje gdje se nalazi kod za svaku stranicu i koji fajl
treba mijenjati za rute, navigaciju, izgled, API pozive i prijavu korisnika.

## Kako aplikacija ide

```text
index.html
  -> src/main.jsx
    -> src/App.jsx
      -> src/routes/AppRoutes.jsx
        -> src/pages/NekaStranica.jsx
          -> MainLayout ili AuthLayout
          -> zajednicke UI komponente
          -> api/axios.js
          -> backend na /api/...
```

- `src/main.jsx` pokrece React aplikaciju i ucitava globalni CSS.
- `src/App.jsx` prikazuje sistem ruta.
- `src/routes/AppRoutes.jsx` povezuje URL sa odgovarajucom stranicom i
  provjerava da li je korisnik prijavljen i ima li admin pristup.
- `src/pages/` sadrzi stvarni sadrzaj stranica.
- `src/components/layout/` daje zajednicki okvir stranica.
- `src/api/axios.js` salje zahtjeve backendu.

## Struktura foldera

```text
client/
|-- public/                         staticki javni fajlovi
|-- src/
|   |-- api/
|   |   `-- axios.js                Axios instanca, base URL i token
|   |-- assets/
|   |   |-- sections/               slike za hero dijelove modula
|   |   |-- background.png          pozadina layouta
|   |   `-- ucg-logo.png            UCG logo
|   |-- components/
|   |   |-- citaona/
|   |   |   `-- CitaonaLocationTracker.jsx
|   |   |-- layout/
|   |   |   |-- MainLayout.jsx      okvir prijavljenih stranica
|   |   |   |-- AuthLayout.jsx      okvir login/register stranica
|   |   |   |-- Sidebar.jsx         desktop navigacija
|   |   |   |-- MobileNav.jsx       mobilna navigacija
|   |   |   `-- Topbar.jsx          zaglavlje koje stranica moze koristiti
|   |   `-- ui/
|   |       |-- Avatar.jsx
|   |       |-- Badge.jsx
|   |       |-- Button.jsx
|   |       |-- Card.jsx
|   |       |-- EmptyState.jsx
|   |       `-- PageHero.jsx         zajednicki vrh stranice sa slikom
|   |-- data/
|   |   `-- navigation.js           stavke menija, role i admin moduli
|   |-- hooks/
|   |   `-- useStoredUser.js        reaktivno cita prijavljenog korisnika
|   |-- pages/                       kompletne stranice aplikacije
|   |-- routes/
|   |   `-- AppRoutes.jsx           svi URL putevi i zastita ruta
|   |-- utils/
|   |   |-- authStorage.js          token i user u local/session storage
|   |   `-- citaonaTracking.js      event za pracenje lokacije
|   |-- App.jsx                     ukljucuje AppRoutes
|   |-- main.jsx                    ulaz u React
|   `-- index.css                   globalni stilovi i Tailwind
|-- package.json                    biblioteke i npm komande
|-- tailwind.config.js              Tailwind podesavanja
`-- vite.config.js                  Vite podesavanja
```

## Javne i auth stranice

| URL | Fajl stranice | Layout | Namjena |
|---|---|---|---|
| `/login` | `src/pages/Login.jsx` | `AuthLayout` | prijava, poziva `/auth/login` |
| `/register` | `src/pages/Register.jsx` | `AuthLayout` | registracija studenta |
| `/forgot-password` | `src/pages/ForgotPassword.jsx` | `AuthLayout` | kod za reset i potvrda koda |
| `/partner-popusti` | `src/pages/PartnerPopusti.jsx` | `AuthLayout` | javna prijava popusta partnera |

`AuthLayout.jsx` kontrolise zajednicku pozadinu, centriranje i sirinu forme za
ove stranice.

## Studentske stranice

Sve ove stranice koriste `MainLayout` i zahtijevaju token.

| URL | Fajl stranice | Sta se nalazi unutra |
|---|---|---|
| `/dashboard` | `src/pages/Dashboard.jsx` | pregled modula i podaci sa `/dashboard` |
| `/dom` | `src/pages/Dom.jsx` | stanje doma, obaveze, uplate i obavjestenja |
| `/menza` | `src/pages/Menza.jsx` | sedmicni jelovnik i prikaz obroka |
| `/citaona` | `src/pages/Citaona.jsx` | rezervacija, otkazivanje i istorija |
| `/popusti` | `src/pages/Popusti.jsx` | lista, filteri i detalji popusta |
| `/stipendije` | `src/pages/Stipendije.jsx` | stipendije i krediti dostupni studentu |
| `/profil` | `src/pages/Profil.jsx` | profilna slika, lozinka i preference |

Hero slike ovih modula su u `src/assets/sections/`, a njihov zajednicki izgled
je u `src/components/ui/PageHero.jsx`.

## Admin stranice

Admin pristup zavisi od `user.role === "admin"` i vrijednosti
`user.admin_module`. Globalni admin koristi vrijednost `all`.

| URL | Fajl stranice | Admin modul | Namjena |
|---|---|---|---|
| `/admin/menza` | `AdminMenza.jsx` | `menza` | dodavanje i izmjena jelovnika |
| `/admin/menza/bonovi` | `AdminMenzaBonovi.jsx` | `menza` | pretraga studenata i broj bonova |
| `/admin/menza/obavjestenja` | `AdminMenzaObavjestenja.jsx` | `menza` | CRUD obavjestenja menze |
| `/admin/dom` | `AdminDom.jsx` | `dom` | studenti, obaveze i status doma |
| `/admin/dom/obavjestenja` | `AdminDomObavjestenja.jsx` | `dom` | CRUD obavjestenja doma |
| `/admin/citaona` | `AdminCitaona.jsx` | `citaona` | rezervacije, potvrde i pracenje |
| `/admin/popusti/moderacija` | `PopustiModeracija.jsx` | `popusti` | odobravanje i odbijanje prijava |
| `/admin/popusti/api-partneri` | `AdminApiPartneri.jsx` | `popusti` | API partner i kljuc |
| `/admin/stipendije` | `AdminStipendije.jsx` | `stipendije` | CRUD stipendija |
| `/admin/krediti` | `AdminStipendije.jsx` | `stipendije` | isti ekran kao stipendije |
| `/admin/korisnici` | `AdminKorisnici.jsx` | samo `all` | upravljanje svim korisnicima |

Posebno postoji `src/pages/Admin.jsx` na ruti `/admin`. To je stariji opsti
formular za unos vise vrsta podataka. Nije dodat u sidebar navigaciju i ruta
trenutno provjerava samo token, a ne admin rolu.

## Layout i navigacija

### MainLayout

`src/components/layout/MainLayout.jsx` obavija prijavljene studentske i admin
stranice. On prikazuje:

- zajednicku pozadinu;
- `Sidebar` na desktopu;
- `MobileNav` na telefonu;
- glavni prostor u kojem se prikazuje stranica;
- `CitaonaLocationTracker` u pozadini.

### Sidebar i MobileNav

Stavke menija se prvenstveno definisu u:

```text
src/data/navigation.js
```

Tu se za svaku stavku zadaju:

```js
{
  title: "Menza",
  path: "/menza",
  icon: UtensilsCrossed,
  roles: ["student"]
}
```

Za admin stavku se dodaje i `module`, na primjer:

```js
{
  title: "Jelovnik",
  path: "/admin/menza",
  icon: UtensilsCrossed,
  roles: ["admin"],
  module: "menza"
}
```

`Sidebar.jsx` pravi desktop meni, a `MobileNav.jsx` mobilni meni. Globalni
admin dobija grupisanu navigaciju po modulima.

## Rute i zastita

Sve rute se dodaju u `src/routes/AppRoutes.jsx`.

- `ProtectedRoute` provjerava postoji li token.
- `AdminModuleRoute` provjerava admin rolu i dozvoljeni modul.
- `AdminRoute` kombinuje te dvije provjere.
- Nepoznat URL (`*`) vraca korisnika na `/login`.

Primjer studentske rute:

```jsx
<Route
  path="/nova-stranica"
  element={
    <ProtectedRoute>
      <NovaStranica />
    </ProtectedRoute>
  }
/>
```

Primjer admin rute:

```jsx
<Route
  path="/admin/novi-modul"
  element={
    <AdminRoute module="novi-modul" element={<AdminNoviModul />} />
  }
/>
```

## API i prijavljeni korisnik

`src/api/axios.js` pravi zajednicki `api` objekat. Backend adresa je:

```text
http://TRENUTNI_HOST:5000/api
```

Zato se u stranici pise:

```js
const res = await api.get("/menza");
```

a stvarni zahtjev ide na:

```text
http://TRENUTNI_HOST:5000/api/menza
```

Axios interceptor automatski dodaje:

```text
Authorization: Bearer TOKEN
```

Auth podaci se cuvaju i citaju kroz `src/utils/authStorage.js`. Za prikaz
trenutnog korisnika u komponenti koristi se:

```js
const user = useStoredUser();
```

## Zajednicke UI komponente

| Komponenta | Koristi se za |
|---|---|
| `Avatar.jsx` | sliku korisnika ili inicijale |
| `PageHero.jsx` | naslovni blok stranice sa slikom |
| `Card.jsx` | zajednicki izgled kartice |
| `Button.jsx` | zajednicki izgled dugmeta |
| `Badge.jsx` | status ili kratku oznaku |
| `EmptyState.jsx` | prikaz kada nema podataka |

Prije pravljenja nove kartice, dugmeta ili avatara treba provjeriti postoji li
vec odgovarajuca komponenta u `src/components/ui/`.

## Gdje mijenjam sta

| Zelim da promijenim | Fajl |
|---|---|
| sadrzaj konkretne stranice | `src/pages/ImeStranice.jsx` |
| URL ili zastitu stranice | `src/routes/AppRoutes.jsx` |
| stavku u meniju | `src/data/navigation.js` |
| desktop navigaciju | `src/components/layout/Sidebar.jsx` |
| mobilnu navigaciju | `src/components/layout/MobileNav.jsx` |
| okvir svih prijavljenih stranica | `src/components/layout/MainLayout.jsx` |
| izgled login/register pozadine | `src/components/layout/AuthLayout.jsx` |
| zajednicki hero modula | `src/components/ui/PageHero.jsx` |
| globalne stilove | `src/index.css` |
| sliku modula | `src/assets/sections/` |
| backend adresu ili slanje tokena | `src/api/axios.js` |
| cuvanje tokena i usera | `src/utils/authStorage.js` |
| pracenje lokacije citaonice | `src/components/citaona/CitaonaLocationTracker.jsx` |

## Kako dodati novu stranicu

1. Napravi `src/pages/NovaStranica.jsx`.
2. Obavij sadrzaj u `MainLayout` ili `AuthLayout`.
3. Importuj stranicu u `src/routes/AppRoutes.jsx`.
4. Dodaj njen `<Route />`.
5. Ako treba da bude u meniju, dodaj stavku u `src/data/navigation.js`.
6. Ako koristi backend, importuj `api` iz `src/api/axios.js`.

Minimalna prijavljena stranica:

```jsx
import MainLayout from "../components/layout/MainLayout";

function NovaStranica() {
  return (
    <MainLayout>
      <section className="rounded-3xl bg-white p-6">
        <h1 className="text-2xl font-black text-slate-900">
          Nova stranica
        </h1>
      </section>
    </MainLayout>
  );
}

export default NovaStranica;
```

## Pokretanje frontenda

Iz `client` foldera:

```bash
npm run dev
```

Provjera produkcijskog builda:

```bash
npm run build
```
