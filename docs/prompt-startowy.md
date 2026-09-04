# Prompt startowy dla lokalnej sesji

Skopiuj wszystko poniżej poziomej linii i wklej jako pierwszą wiadomość do
Claude Code uruchomionego w tym repo na komputerze Pawła (`claude` w katalogu
klonu).

Nie wklejaj tego do sesji w chmurze — ona nie ma przeglądarki i pracuj.pl
i tak zablokuje jej ruch (Cloudflare, 403).

---

Pracujesz w repo `rudolphrednose.github.io` (Paweł Strumiński) — dashboard monitorowania ofert pracy, hostowany na GitHub Pages pod https://rudolphrednose.github.io/

**Zacznij od `git pull origin master`** — repo było rozwijane zdalnie i lokalny klon może być za stary.

## Kontekst

pracuj.pl stoi za Cloudflare i blokuje ruch z serwerowni — sesja w chmurze dostaje 403 na każdym żądaniu, łącznie z `robots.txt`. Ty działasz na maszynie Pawła: prawdziwa przeglądarka, jego IP, jego zalogowana sesja. Z punktu widzenia serwisu to po prostu on przegląda oferty — bo faktycznie on.

Wcześniejsza ścieżka (codzienna Routine czytająca alerty e-mail z Gmaila) została **wyłączona** — alerty nie zostały założone. Jesteś teraz jedynym źródłem danych dla tego dashboardu.

## Przeczytaj najpierw (źródło prawdy — nie zgaduj z pamięci)

- `config/criteria.json` — czego Paweł szuka, czego nie chce, jak selektywnie filtrować
- `cv/base-cv.md` — jego CV; podstawa oceny dopasowania i pisania listów
- `data/offers.json` — co już jest na dashboardzie (do deduplikacji)
- `docs/lokalna-sesja.md` — rozszerzona wersja tych instrukcji

Skrót profilu: AI Filmmaker / Creative Director, Wrocław, 2x Złoty Kopernik, 8+ lat doświadczenia, Runway/Veo 3/Kling/MidJourney, DaVinci Resolve, StoryBrand, obecnie AI Filmmaker & E-commerce Manager w Vitality Plus. Szuka: marketing/e-commerce oparty na wideo **oraz** AI filmmaking. Zdalnie lub Wrocław. Wszystkie formy zatrudnienia. Mid/senior/lead. Bez filtra widełek. Dealbreakery: praca wyłącznie stacjonarna poza Wrocławiem, agencje/domy mediowe z przeróbką.

## Przeglądarka

Ustaw Playwright tak, żeby sterował prawdziwym Chrome na tej maszynie (`channel: "chrome"`), **nie headless** — Paweł ma widzieć, co się dzieje. Jeśli `playwright` nie jest zainstalowany: `npm init -y && npm install playwright`.

Dwie drogi podpięcia — wybierz tę, która zadziała, i przetestuj na miejscu:
- `launchPersistentContext` z własnym `userDataDir` — Paweł loguje się raz ręcznie w otwartym oknie, logowanie zostaje na kolejne uruchomienia; najmniej problemów
- `connectOverCDP` do Chrome z `--remote-debugging-port` — zachowuje bieżącą sesję, ale nowsze Chrome ograniczają to dla domyślnego profilu

Nie używaj Playwrightem katalogu profilu, w którym Chrome jest *otwarty* — profil jest wtedy zablokowany.

Jeśli pojawi się logowanie albo wyzwanie Cloudflare — **zatrzymaj się i poproś Pawła, żeby kliknął ręcznie**, potem kontynuuj. Nie obchodź zabezpieczeń automatycznie. Zachowuj rozsądne odstępy między żądaniami, bez równoległego zalewania serwisu — to asystowane przeglądanie, nie scraping.

## Zadanie

1. Zrób kilka osobnych wyszukiwań (węższe łapią lepiej niż jedno szerokie): `AI video`, `generative AI content`, `content marketing manager`, `e-commerce manager`, `creative director`, `video producer`, `DaVinci Resolve`, `social media TikTok`. Każde z filtrem **praca zdalna** oraz osobno **Wrocław**.
2. Zbierz: tytuł, firmę, lokalizację, tryb pracy, widełki (jeśli podane), link. Wejdź w ofertę po szczegóły, jeśli lista ich nie pokazuje.
3. Odrzuć oferty łamiące `dealbreakers`.
4. Filtruj **selektywnie** (`selectivity: high` w kryteriach) — do pliku trafiają tylko realne trafienia. Oferta ewidentnie niepasująca ma być pominięta, a nie dodana z niską oceną. Przy wątpliwości — dodaj i zaznacz wątpliwość w `match_notes`.
5. Zdeduplikuj po `url` względem `data/offers.json`.
6. Dopisz każdą nową ofertę na początek tablicy `offers`:

```json
{
  "id": "slug-firma-stanowisko-data",
  "title": "Tytuł stanowiska",
  "company": "Nazwa firmy",
  "location": "Wrocław / zdalnie",
  "salary": "12 000 - 16 000 zł brutto",
  "work_mode": "zdalna / hybrydowa / stacjonarna",
  "url": "https://www.pracuj.pl/praca/...",
  "source_email_date": "2026-09-04",
  "source": "browser",
  "status": "new",
  "match_notes": "2-3 zdania po polsku: dlaczego pasuje, co budzi wątpliwość.",
  "cv_tailored": true,
  "cover_letter": "150-250 słów po polsku...",
  "draft_gmail_url": null
}
```

`salary`, `work_mode`, `draft_gmail_url` mogą być `null`, gdy oferta ich nie podaje — **nie wymyślaj wartości**. Pole `source_email_date` to data odkrycia (dashboard sortuje po nim i wyświetla jako „Znaleziono") — nazwa jest historyczna, nie zmieniaj jej, bo czyta ją `assets/app.js`.

7. `cover_letter` pisz konkretnie, odwołując się do **realnych** rzeczy z `cv/base-cv.md` i do wymagań konkretnej oferty. Żadnych ogólników, żadnych zmyślonych osiągnięć.
8. Zaktualizuj `generated_at` na aktualny czas UTC (ISO 8601).
9. `git pull --rebase origin master`, potem commit i push na `master`.

## Czego NIE robić

- **Nie klikaj „Aplikuj"** — nigdy. Wysyłkę robi Paweł sam po przejrzeniu na dashboardzie. To świadoma decyzja, nie ograniczenie techniczne.
- Nie wysyłaj żadnych maili.
- Nie zmieniaj `config/criteria.json` ani `cv/base-cv.md` bez pytania.
- Nie dodawaj numeru telefonu ani innych danych wrażliwych — **repo jest publiczne** (GitHub Pages). W `cv/base-cv.md` numer jest celowo pominięty.

## Na koniec

Powiedz krótko: ile ofert przejrzałeś, ile dodałeś, ile odrzuciłeś i dlaczego. Jeśli coś nie zadziałało (Cloudflare, zmiana układu strony, problem z profilem Chrome) — powiedz wprost, zamiast raportować sukces.
