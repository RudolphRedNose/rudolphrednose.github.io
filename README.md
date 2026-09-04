# Monitor ofert pracy (pracuj.pl) — dashboard do codziennej akceptacji

Aplikacja, która przegląda oferty pracy na pracuj.pl, ocenia je pod kątem
Twojego CV i przygotowuje dopasowany list motywacyjny — a Ty w jednym miejscu
akceptujesz albo odrzucasz każdą propozycję.

## Jak to działa

pracuj.pl blokuje automatyczne scrapowanie (ochrona Cloudflare) — strona
wyszukiwania, API i nawet `robots.txt` zwracają 403 z wyzwaniem „Just a
moment...". Sesja w chmurze nie ma szans przez to przejść.

Rozwiązaniem jest **lokalna sesja Claude Code na komputerze Pawła**: prawdziwa
przeglądarka, prawdziwe IP, zalogowana sesja. Z punktu widzenia serwisu to po
prostu on przegląda oferty — bo faktycznie on.

```
Claude Code lokalnie (Twój Mac)
        │  steruje Twoim Chrome przez Playwright
        ▼
   pracuj.pl — wyszukiwanie wg config/criteria.json
        │
        ▼
   ocena dopasowania do cv/base-cv.md
   + list motywacyjny pod konkretną ofertę
        │
        ▼
   data/offers.json  →  commit  →  GitHub Pages
        │
        ▼
   Dashboard: przeglądasz, akceptujesz, kopiujesz list
   i sam klikasz „Aplikuj" na pracuj.pl
```

Setup i gotowy prompt: **[`docs/lokalna-sesja.md`](docs/lokalna-sesja.md)**

**Wysyłka aplikacji jest zawsze ręczna.** System przygotowuje dopasowany tekst,
decyzję i kliknięcie „Aplikuj" zostawia Tobie — żeby nic słabo dopasowanego nie
poszło do pracodawcy automatycznie.

### Ścieżka e-mailowa (wyłączona)

Wcześniej działała codzienna Routine w chmurze, która czytała z Gmaila alerty
„Powiadomienia o pracy" z pracuj.pl. **Wyłączona 04.09.2026** — alerty nie
zostały założone, więc przez trzy tygodnie produkowała tylko pusty commit
dziennie. Routine jest zachowana i da się ją włączyć z powrotem, gdybyś kiedyś
te alerty założył; wtedy oba źródła działałyby równolegle, deduplikując oferty
po `url`.

## Setup — stan na 04.09.2026

- [x] **CV uzupełnione** — `cv/base-cv.md` (źródło: „Pawel Struminski - AI Filmmaker CV",
      Google Drive, 05.2026). Numer telefonu celowo pominięty, bo repo jest publiczne.
- [x] **Kryteria uzupełnione** — `config/criteria.json` (wywiad z 27.08.2026).
- [x] **Scalone do `master`** — dashboard żyje pod https://rudolphrednose.github.io/
- [ ] **Uruchomienie lokalnej sesji** — patrz [`docs/lokalna-sesja.md`](docs/lokalna-sesja.md).
      To jedyna rzecz, która została.

### Twoje kryteria w skrócie

| | |
|---|---|
| **Kierunek** | Marketing / e-commerce oparty na wideo **oraz** AI filmmaking |
| **Lokalizacja** | Zdalnie (cała PL) lub Wrocław (stacjonarnie/hybrydowo) |
| **Forma** | Wszystko — UoP, B2B, freelance |
| **Poziom** | Mid / senior / lead / manager |
| **Widełki** | Bez filtra (wiele ofert ich nie podaje) — zawsze odnotowywane |
| **Dealbreakery** | Stacjonarnie poza Wrocławiem; agencje/domy mediowe z przeróbką |
| **Selektywność** | Wysoka — tylko realne trafienia trafiają na dashboard |

## Dashboard

- **Nowe** — oferty czekające na Twoją decyzję.
- **Zaakceptowane** — skopiuj gotowy list motywacyjny i zaaplikuj na pracuj.pl.
- **Odrzucone** — oferty, które pominąłeś.
- **Wszystkie** — pełna lista.

Każda karta ma rozwijany blok z listem motywacyjnym i przyciskiem „Kopiuj".

Status „Akceptuj/Odrzuć/Cofnij" zapisuje się **lokalnie w przeglądarce**
(localStorage) — to prosty dashboard bez backendu, więc decyzje nie
synchronizują się między urządzeniami. Sama lista ofert (`data/offers.json`)
jest wspólna, bo commituje ją do repo lokalna sesja.

## Ograniczenia, o których warto wiedzieć

- Dashboard aktualizuje się tylko wtedy, gdy uruchomisz lokalną sesję — nie ma
  już nic, co robi to samo w tle.
- Ocena dopasowania i treść listu motywacyjnego są generowane automatycznie
  na podstawie `cv/base-cv.md` — przejrzyj je przed użyciem.
- Status „Akceptuj/Odrzuć" siedzi w `localStorage` przeglądarki, więc nie
  synchronizuje się między urządzeniami.
- Wysyłka aplikacji jest zawsze ręczna (świadomie).

## Struktura repo

```
index.html            dashboard (statyczny, GitHub Pages)
assets/app.js          logika dashboardu
assets/style.css        wygląd
data/offers.json        lista ofert + dopasowania (pisane przez lokalną sesję)
cv/base-cv.md            bazowe CV Pawła (uzupełnione 27.08.2026)
config/criteria.json     kryteria wyszukiwania/oceny (uzupełnione 27.08.2026)
docs/lokalna-sesja.md     setup lokalnej sesji z przeglądarką
docs/prompt-startowy.md   prompt do wklejenia w lokalną sesję (gotowy do skopiowania)
```

## Uruchomienie

Odpal Claude Code lokalnie w tym repo (`claude`) i wklej prompt z
[`docs/prompt-startowy.md`](docs/prompt-startowy.md). Rób to, kiedy chcesz
sprawdzić rynek — nie ma harmonogramu, decydujesz sam.

Setup od zera (klon + Playwright) opisuje
[`docs/lokalna-sesja.md`](docs/lokalna-sesja.md).
