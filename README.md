# Monitor ofert pracy (pracuj.pl) — dashboard do codziennej akceptacji

Aplikacja, która pilnuje nowych ofert pracy na pracuj.pl, dopasowuje pod nie
Twoje CV i przygotowuje gotowy e-mail aplikacyjny — a Ty codziennie w jednym
miejscu akceptujesz albo odrzucasz każdą propozycję.

## Jak to działa

pracuj.pl blokuje automatyczne scrapowanie strony (ochrona Cloudflare), więc
zamiast "podglądać" serwis od zewnątrz, aplikacja korzysta z jego **własnej,
legalnej funkcji powiadomień e-mail** ("Powiadomienia o pracy" / job alerts):

```
pracuj.pl (alert e-mail)
        │
        ▼
   Twoja skrzynka Gmail
        │  codziennie rano, automatycznie
        ▼
  Routine (harmonogram) czyta nowe maile z alertami,
  wyciąga oferty, dopasowuje CV wg cv/base-cv.md,
  przygotowuje list motywacyjny / notatki pod ofertę
  (nic nie jest wysyłane ani wklejane automatycznie),
  zapisuje wynik do data/offers.json i commituje do repo
        │
        ▼
   Dashboard (ta strona, GitHub Pages)
   pokazuje nowe oferty + dopasowanie + gotowy tekst
        │
        ▼
   Ty klikasz "Akceptuj", kopiujesz gotowy list motywacyjny
   i sam aplikujesz na pracuj.pl (przycisk "Aplikuj")
   — albo, jeśli oferta ma bezpośredni e-mail kontaktowy,
   dostajesz też gotowy szkic w Gmailu do wysłania.
```

**Ważne:** większość ofert na pracuj.pl aplikuje się przez ich własny
formularz "Aplikuj" (upload CV w ich systemie), nie przez e-mail — dlatego
dashboard zawsze przygotowuje tekst do skopiowania, a szkic w Gmailu pojawia
się tylko wtedy, gdy oferta faktycznie podaje kontaktowy adres e-mail. Nic nie
jest nigdzie wysyłane ani wklejane bez Twojej ręcznej akcji — to świadomy
wybór, żeby nic słabo dopasowanego albo błędnego nie poszło do pracodawcy
automatycznie.

## Setup — stan na 27.08.2026

- [x] **CV uzupełnione** — `cv/base-cv.md` (źródło: „Pawel Struminski - AI Filmmaker CV",
      Google Drive, 05.2026). Numer telefonu celowo pominięty, bo repo jest publiczne.
- [x] **Kryteria uzupełnione** — `config/criteria.json` (wywiad z 27.08.2026).
- [ ] **Alert e-mail na pracuj.pl** — JEDYNA rzecz, która blokuje cały pipeline.
      Instrukcja niżej. Bez tego Routine nie ma czego czytać.
- [ ] **Scalenie do `master`** — dashboard ożyje pod `https://rudolphrednose.github.io/`.

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

### Jak założyć alerty na pracuj.pl (ok. 5 minut)

Wejdź na pracuj.pl, zaloguj się, wyszukaj wg poniższych fraz i przy każdym
wyszukiwaniu włącz **„Powiadomienia o pracy"** na e-mail
(pawel.struminski@gmail.com). Dla każdego wyszukiwania ustaw filtry:
**praca zdalna** ORAZ osobno **Wrocław** — albo jedno wyszukiwanie z obydwoma,
jeśli serwis na to pozwala.

Proponowane frazy (załóż 4–6 alertów, nie jeden — węższe alerty łapią lepiej):

1. `AI video` / `generative AI content`
2. `content marketing manager` + `video`
3. `e-commerce manager`
4. `creative director`
5. `video producer` / `montażysta` / `DaVinci Resolve`
6. `social media manager` + `TikTok`

Nie mogę tego kliknąć za Ciebie — pracuj.pl blokuje automatyczny dostęp
(Cloudflare), a ta sesja działa w kontenerze w chmurze, nie na Twoim
komputerze. Nie zweryfikowałem też dokładnych parametrów URL wyszukiwarki
z tego samego powodu, więc podaję frazy, a nie gotowe linki.

Gdy pierwszy alert dojdzie na skrzynkę, codzienna Routine (6:00 UTC) sama go
przetworzy: wyciągnie oferty, oceni dopasowanie do `config/criteria.json`,
napisze list motywacyjny na bazie `cv/base-cv.md` i wrzuci wszystko na dashboard.

## Dashboard

- **Nowe** — oferty czekające na Twoją decyzję.
- **Zaakceptowane** — otwórz gotowy szkic w Gmailu i wyślij go samodzielnie.
- **Odrzucone** — oferty, które pominąłeś.
- **Wszystkie** — pełna lista.

Status "Akceptuj/Odrzuć/Cofnij" zapisuje się **lokalnie w przeglądarce**
(localStorage) — to prosty dashboard bez backendu, więc decyzje nie
synchronizują się między urządzeniami/przeglądarkami. Sama lista ofert i
dopasowania (`data/offers.json`) jest wspólna dla wszystkich, bo aktualizuje
ją Routine i commituje do repo.

## Ograniczenia, o których warto wiedzieć

- Aplikacja widzi tylko te oferty, które pracuj.pl sam wyśle w ramach alertu
  — to nie jest pełny, niezależny skan wszystkich ofert w serwisie, tylko
  tyle, ile złapie mechanizm alertów pracuj.pl dla podanych kryteriów.
- Alerty pracuj.pl mają własny harmonogram wysyłki (zwykle godzinowy/dzienny)
  — nie ma tu opóźnienia z naszej strony, ale zależymy od ich częstotliwości.
- Dopasowanie CV i ocena trafności oferty to praca Claude na podstawie treści
  maila i Twojego `cv/base-cv.md` — zawsze przejrzyj szkic przed wysłaniem.
- Wysyłka jest zawsze ręczna (świadomie) — patrz sekcja wyżej.

## Struktura repo

```
index.html            dashboard (statyczny, GitHub Pages)
assets/app.js          logika dashboardu
assets/style.css        wygląd
data/offers.json        lista ofert + dopasowania (generowane przez Routine)
cv/base-cv.md            bazowe CV Pawła (uzupełnione 27.08.2026)
config/criteria.json     kryteria wyszukiwania/oceny (uzupełnione 27.08.2026)
```

## Ręczne uruchomienie

Jeśli nie chcesz czekać na codzienny harmonogram, możesz poprosić Claude o
"sprawdź teraz nowe oferty z pracuj.pl" w dowolnej chwili — logika jest ta
sama, co w Routine.
