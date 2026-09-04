# Lokalna sesja Claude Code — przeglądanie pracuj.pl przez Twoją przeglądarkę

Ten dokument opisuje, jak uruchomić Claude Code **na własnym Macu**, żeby
przeglądał pracuj.pl bezpośrednio w Twojej zalogowanej przeglądarce i uzupełniał
to repo.

**To jest teraz główna (i jedyna aktywna) ścieżka.** Codzienna Routine w chmurze,
która czytała alerty e-mail z Gmaila, została wyłączona 04.09.2026 — przez trzy
tygodnie nie miała czego przetwarzać, bo alerty na pracuj.pl nie zostały
założone, a produkowała pusty commit dziennie.

## Dlaczego to działa, skoro zdalna sesja nie dawała rady

pracuj.pl stoi za Cloudflare i blokuje ruch z serwerowni. Zdalna sesja Claude
Code działa w kontenerze w chmurze — dostaje 403 na każdym żądaniu, łącznie
z `robots.txt`.

Sesja lokalna to inna sytuacja: prawdziwa przeglądarka, Twoje domowe IP, Twoja
zalogowana sesja i Twoje ciasteczka. Z punktu widzenia serwisu to po prostu Ty
przeglądasz oferty — bo faktycznie Ty. Żadnego obchodzenia zabezpieczeń.

## Setup (raz)

```bash
# 1. Zainstaluj Claude Code na Macu (jeśli jeszcze nie masz)
#    https://claude.com/claude-code

# 2. Sklonuj repo i wejdź do niego
git clone https://github.com/RudolphRedNose/rudolphrednose.github.io.git
cd rudolphrednose.github.io

# 3. Playwright do sterowania Chrome
npm init -y
npm install playwright

# 4. Odpal Claude Code w tym katalogu
claude
```

Potem wklej prompt z sekcji niżej.

## Uwaga o podpięciu Chrome

Są dwie drogi i **niech lokalna sesja sama wybierze tę, która zadziała na Twojej
maszynie** — może testować na miejscu, ja z chmury nie mogę tego zweryfikować:

- **Osobny profil Playwright** (`launchPersistentContext` z własnym
  `userDataDir`) — logujesz się do pracuj.pl raz, ręcznie, w oknie które otworzy
  Playwright. Logowanie zostaje w tym profilu na kolejne uruchomienia. Najmniej
  problemów.
- **Podpięcie do działającego Chrome przez CDP** (`connectOverCDP`) — Chrome
  uruchomiony z `--remote-debugging-port`. Zachowuje Twoją bieżącą sesję, ale
  nowsze wersje Chrome ograniczają to dla domyślnego profilu, więc może wymagać
  osobnego `--user-data-dir`.

Nie próbuj używać Playwrightem katalogu profilu, w którym masz *otwarty* Chrome
— profil jest wtedy zablokowany.

---

## Prompt do wklejenia

Skopiuj wszystko poniżej linii i wklej do lokalnej sesji Claude Code.

---

Pracujesz w repo `rudolphrednose.github.io` — to dashboard do monitorowania
ofert pracy dla Pawła Strumińskiego, hostowany na GitHub Pages pod
https://rudolphrednose.github.io/

Twoje zadanie: przeglądać pracuj.pl przez prawdziwą przeglądarkę na tej maszynie,
znajdować pasujące oferty i uzupełniać nimi `data/offers.json`.

### Zanim zaczniesz

Przeczytaj te dwa pliki — to źródło prawdy, nie zgaduj nic z pamięci:

- `config/criteria.json` — czego szuka Paweł, czego nie chce, jak selektywnie filtrować
- `cv/base-cv.md` — jego CV, podstawa do oceny dopasowania i pisania listów

Przeczytaj też `data/offers.json`, żeby wiedzieć, co już tam jest.

### Przeglądarka

Ustaw Playwright tak, żeby sterował prawdziwym Chrome na tej maszynie
(`channel: "chrome"`). Jeśli pracuj.pl poprosi o logowanie albo pokaże wyzwanie
Cloudflare — **zatrzymaj się i poproś Pawła, żeby to kliknął ręcznie w otwartym
oknie**, potem kontynuuj. Nie próbuj obchodzić zabezpieczeń automatycznie.

Nie uruchamiaj przeglądarki w trybie headless — Paweł ma widzieć, co się dzieje,
i móc interweniować.

Zachowuj się jak człowiek przeglądający oferty: rozsądne odstępy między
żądaniami, bez zalewania serwisu równoległymi requestami. To ma być asystowane
przeglądanie, nie scraping na skalę.

### Co zrobić

1. Wyszukaj oferty wg `config/criteria.json`. Zrób kilka osobnych wyszukiwań
   (frazy w stylu: `AI video`, `content marketing manager`, `e-commerce manager`,
   `creative director`, `video producer`, `social media TikTok`), z filtrem
   **praca zdalna** oraz osobno **Wrocław**.
2. Z każdego wyniku zbierz: tytuł, firmę, lokalizację, tryb pracy, widełki
   (jeśli podane), link do oferty. Wejdź w ofertę po szczegóły, jeśli lista
   ich nie pokazuje.
3. Odrzuć oferty, które łamią `dealbreakers` z kryteriów.
4. Filtruj **selektywnie** (`selectivity: high` w kryteriach) — do pliku trafiają
   tylko realne trafienia. Oferta ewidentnie niepasująca ma zostać pominięta,
   a nie dodana z niską oceną. Przy wątpliwości — dodaj i zaznacz wątpliwość
   w `match_notes`.
5. Zdeduplikuj po `url` względem tego, co już jest w `data/offers.json`.
6. Dla każdej nowej oferty dopisz obiekt do tablicy `offers` (na początek listy):

```json
{
  "id": "slug-firma-stanowisko-data",
  "title": "Tytuł stanowiska",
  "company": "Nazwa firmy",
  "location": "Wrocław / zdalnie",
  "salary": "12 000 - 16 000 zł brutto" ,
  "work_mode": "zdalna / hybrydowa / stacjonarna",
  "url": "https://www.pracuj.pl/praca/...",
  "source_email_date": "2026-09-01",
  "source": "browser",
  "status": "new",
  "match_notes": "2-3 zdania po polsku: dlaczego pasuje, co budzi wątpliwość.",
  "cv_tailored": true,
  "cover_letter": "150-250 słów po polsku...",
  "draft_gmail_url": null
}
```

Pola `salary`, `work_mode`, `draft_gmail_url` mogą być `null`, gdy oferta ich
nie podaje — nie wymyślaj wartości.

7. `cover_letter` pisz konkretnie, odwołując się do **realnych** rzeczy z
   `cv/base-cv.md` (2x Złoty Kopernik, Runway/Veo 3, DaVinci Resolve, StoryBrand,
   Vitality Plus, 400+ modułów wideo w WSKZ) i do wymagań z konkretnej oferty.
   Żadnych ogólników, żadnych zmyślonych osiągnięć.
8. Zaktualizuj `generated_at` na aktualny czas UTC (ISO 8601).
9. `git pull --rebase origin master`, potem commit i push na `master`.
   Rebase przed pushem to i tak dobra higiena — repo bywa aktualizowane
   z innych miejsc.

### Czego NIE robić

- **Nie klikaj „Aplikuj"** — nigdy, pod żadnym pozorem. Wysyłkę aplikacji robi
  Paweł sam, po przejrzeniu na dashboardzie. To nie jest ograniczenie techniczne,
  tylko świadoma decyzja.
- Nie wysyłaj żadnych maili.
- Nie zmieniaj `config/criteria.json` ani `cv/base-cv.md` bez pytania Pawła.
- Nie dodawaj do repo numeru telefonu ani innych danych wrażliwych — repo jest
  **publiczne**.

### Na koniec

Powiedz krótko: ile ofert przejrzałeś, ile dodałeś, ile odrzuciłeś i dlaczego.
Jeśli coś nie zadziałało (Cloudflare, zmiana układu strony) — powiedz wprost,
zamiast udawać, że poszło.

---

## Co zadziałało na tej maszynie (sesja 05.09.2026)

Pierwsze uruchomienie lokalne. Poniżej stan faktyczny, nie plan.

### Metoda: osobny Chrome + CDP (nie `launchPersistentContext`)

Z dwóch opisanych wyżej dróg wybrana została **druga: `connectOverCDP`**, ale
z jedną modyfikacją — Chrome uruchamiamy sami, z **osobnym** katalogiem profilu.
Powód jest praktyczny: przy `launchPersistentContext` przeglądarka zamyka się
razem z procesem node, więc każda komenda otwierałaby nowe okno i nie dałoby się
niczego kliknąć ręcznie między krokami. Przy CDP okno Chrome **zostaje otwarte**,
a skrypt tylko podłącza się na chwilę, robi swoje i się rozłącza.

Konfiguracja, która zadziałała:

- Chrome 152.0.7977.76, `/Applications/Google Chrome.app`
- Playwright 1.62.1, Node v25.8.2
- profil: `.browser-profile/` w katalogu repo (jest w `.gitignore`)
- port debugowania: `9222`
- domyślny profil Chrome (`~/Library/Application Support/Google/Chrome`) był
  w tym czasie **otwarty i zablokowany** — dlatego osobny katalog jest konieczny,
  nie opcjonalny

### Skrypt

Wszystko siedzi w [`scripts/browse.mjs`](../scripts/browse.mjs):

```bash
node scripts/browse.mjs open                 # uruchom Chrome z portem 9222 (jeśli nie działa)
node scripts/browse.mjs status               # wejdź na pracuj.pl i zdaj raport
node scripts/browse.mjs nav <url>            # otwórz URL
node scripts/browse.mjs shot [plik.png]      # zrzut ekranu
node scripts/browse.mjs search "content marketing" --remote
node scripts/browse.mjs search "video" --city wroclaw --pages 2
node scripts/browse.mjs offer <url-oferty>   # szczegóły ogłoszenia
```

`ensureChrome()` sam odpala przeglądarkę, jeśli port 9222 nie odpowiada —
w praktyce wystarczy od razu wywołać `status`.

### Co trzeba kliknąć ręcznie

**Na tej maszynie: nic.** Weryfikacja przeszła za pierwszym razem:

- brak wyzwania Cloudflare,
- brak ściany logowania — pracuj.pl pokazuje oferty bez zalogowania,
- pojawia się baner zgody na cookies („Cenimy Twoją prywatność"), ale **jest
  nieszkodliwy**: wyniki wyszukiwania i strony ofert czytają się normalnie mimo
  niego. Skrypt go **nie klika** — to najbardziej prywatna opcja. Jeśli kiedyś
  zacznie realnie blokować, kliknij „Dostosuj" i odrzuć zbędne cookies ręcznie.

Gdyby jednak pojawił się Cloudflare albo logowanie: okno Chrome jest otwarte,
wystarczy kliknąć w nim ręcznie i uruchomić komendę ponownie. Sesja zostaje
w `.browser-profile/`.

### Skąd biorą się dane ofert

Skrypt **nie parsuje HTML-a i nie wali w API**. Czyta `__NEXT_DATA__` — blok
JSON, który pracuj.pl i tak wstawia w każdą stronę wyników (react-query,
klucz `jobOffers`). Wyciąga z niego tytuł, firmę, lokalizację, tryb pracy,
widełki, poziom stanowiska, rodzaj umowy i streszczenie. Jedno wejście na stronę
= komplet danych, bez dodatkowych żądań. Odstępy między żądaniami: 2,5–4,5 s.

### Pułapki wyszukiwarki pracuj.pl (ważne przy kolejnych przeglądach)

Frazy wielowyrazowe są dopasowywane **ściśle (AND)** i potrafią dać zero
wyników mimo że oferty istnieją. Z ośmiu fraz z promptu cztery zwróciły 0:
`AI video`, `creative director`, `video producer`, `generative AI content`
(zdalnie). Dlatego **rób drugą rundę na węższych, jedno- i dwuwyrazowych
wariantach** — `video`, `wideo`, `content marketing`, `TikTok`, `montazysta`,
`generative AI`, `social media manager`, `performance marketing`. To one
przyniosły większość trafień.

Uwaga: polskie znaki w słowie kluczowym działają, ale `montazysta` bez ogonka
łapie poprawnie, więc nie trzeba kombinować z kodowaniem.

Format URL-i (zweryfikowany):

- fraza: `https://www.pracuj.pl/praca/<fraza>;kw`
- zdalne: `...;kw?wm=home-office`
- miasto: `...;kw/wroclaw;wp` (domyślnie promień 30 km)
- strona: `&pn=2`

### Znane usterki

- Jedno z 36 wyszukiwań zwróciło `brak __NEXT_DATA__` (`produkcja wideo`,
  zdalnie). Powtórzenie tej samej komendy zadziałało. Wniosek: to przejściowy
  błąd renderowania, warto ponawiać pojedyncze niepowodzenia zamiast przerywać
  przegląd.
