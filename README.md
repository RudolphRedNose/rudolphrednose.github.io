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

## Setup (jednorazowo)

1. **Załóż alert e-mail na pracuj.pl**
   Zaloguj się na pracuj.pl → wyszukaj oferty wg swoich kryteriów (stanowisko,
   lokalizacja, tryb pracy) → włącz "Powiadomienia o pracy" na e-mail dla tego
   wyszukiwania. Możesz założyć kilka alertów dla różnych zapytań.

2. **Uzupełnij swoje CV** w [`cv/base-cv.md`](cv/base-cv.md) — im więcej
   konkretów (projekty, technologie, liczby, osiągnięcia), tym lepsze
   dopasowanie do ofert.

3. **Uzupełnij kryteria** w [`config/criteria.json`](config/criteria.json) —
   stanowiska, lokalizacje, widełki, must-have/nice-to-have, dealbreakery.
   Te dane pomagają ocenić, czy oferta faktycznie warta jest dopasowania CV
   (nie każda oferta z alertu musi być trafna).

4. **Scal tę gałąź do `master`** — GitHub Pages serwuje dashboard z gałęzi
   domyślnej. Po scaleniu dashboard będzie dostępny pod
   `https://rudolphrednose.github.io/`.

5. Codzienna Routine jest już skonfigurowana (patrz niżej) i od teraz sama
   sprawdza skrzynkę raz dziennie.

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
cv/base-cv.md            Twoje bazowe CV (Ty uzupełniasz)
config/criteria.json     kryteria wyszukiwania/oceny (Ty uzupełniasz)
```

## Ręczne uruchomienie

Jeśli nie chcesz czekać na codzienny harmonogram, możesz poprosić Claude o
"sprawdź teraz nowe oferty z pracuj.pl" w dowolnej chwili — logika jest ta
sama, co w Routine.
