#!/usr/bin/env node
/**
 * browse.mjs — sterowanie prawdziwym Chrome na tej maszynie (Playwright + CDP).
 *
 * Dlaczego CDP, a nie launchPersistentContext: Chrome uruchomiony osobno zostaje
 * OTWARTY między kolejnymi wywołaniami tego skryptu. Dzięki temu Paweł może
 * w każdej chwili kliknąć coś ręcznie (logowanie, Cloudflare), a skrypt tylko
 * podłącza się na chwilę, robi swoje i się rozłącza.
 *
 * Profil: .browser-profile/ (w .gitignore — zawiera ciasteczka).
 * NIE używamy domyślnego profilu Chrome — jest zablokowany przez otwartą przeglądarkę.
 *
 * Użycie:
 *   node scripts/browse.mjs open              # uruchom Chrome z portem debugowania (jeśli nie działa)
 *   node scripts/browse.mjs status            # wejdź na pracuj.pl i zdaj raport (Cloudflare? logowanie?)
 *   node scripts/browse.mjs nav <url>         # otwórz URL
 *   node scripts/browse.mjs shot [plik.png]   # zrzut ekranu aktywnej karty
 *   node scripts/browse.mjs search <fraza> [--remote] [--city wroclaw] [--pages N]
 *   node scripts/browse.mjs offer <url>       # szczegóły pojedynczej oferty (JSON)
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROFILE = path.join(ROOT, '.browser-profile');
const CDP = 'http://127.0.0.1:9222';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** Odstęp między żądaniami — to asystowane przeglądanie, nie scraping. */
const polite = () => sleep(2500 + Math.floor(Math.random() * 2000));

async function cdpAlive() {
  try {
    const r = await fetch(`${CDP}/json/version`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch {
    return false;
  }
}

/** Uruchamia Chrome z portem debugowania, jeśli jeszcze nie działa. */
export async function ensureChrome() {
  if (await cdpAlive()) return false;
  if (!existsSync(PROFILE)) mkdirSync(PROFILE, { recursive: true });
  spawn(CHROME, [
    '--remote-debugging-port=9222',
    `--user-data-dir=${PROFILE}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    'https://www.pracuj.pl/',
  ], { detached: true, stdio: 'ignore' }).unref();
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    if (await cdpAlive()) return true;
  }
  throw new Error('Chrome nie wystawił portu 9222 — sprawdź, czy się otworzył.');
}

/** Podłącza się do działającego Chrome i zwraca { browser, ctx, page }. */
export async function connect() {
  await ensureChrome();
  const browser = await chromium.connectOverCDP(CDP);
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find((p) => !p.url().startsWith('devtools://')) || (await ctx.newPage());
  return { browser, ctx, page };
}

/** Czy strona to wyzwanie Cloudflare / ekran logowania / blokada? */
export async function diagnose(page) {
  const title = await page.title();
  const url = page.url();
  const bodyText = (await page.locator('body').innerText().catch(() => '')).slice(0, 4000);
  const t = (title + ' ' + bodyText).toLowerCase();
  const cloudflare = /just a moment|checking your browser|sprawdzamy|cf-browser-verification|attention required|weryfikacja przeglądarki/.test(t);
  const login = /zaloguj się do konta|wpisz hasło|sign in to your account/.test(t) && !/oferty pracy/.test(t);
  const blocked = /403|access denied|dostęp zabroniony/.test(t);
  return { url, title, cloudflare, login, blocked, excerpt: bodyText.slice(0, 600) };
}

async function cmdStatus() {
  const { browser, page } = await connect();
  await page.goto('https://www.pracuj.pl/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(3000);
  const d = await diagnose(page);
  const shot = path.join(ROOT, '.browser-profile', 'status.png');
  await page.screenshot({ path: shot, fullPage: false });
  console.log(JSON.stringify({ ...d, screenshot: shot }, null, 2));
  await browser.close();
}

async function cmdNav(url) {
  const { browser, page } = await connect();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(2500);
  console.log(JSON.stringify(await diagnose(page), null, 2));
  await browser.close();
}

async function cmdShot(out) {
  const { browser, page } = await connect();
  const file = out || path.join(ROOT, '.browser-profile', 'shot.png');
  await page.screenshot({ path: file });
  console.log(file);
  await browser.close();
}

/** Buduje URL wyszukiwarki pracuj.pl. */
export function searchUrl(keyword, { remote = false, city = null, page = 1 } = {}) {
  let u = `https://www.pracuj.pl/praca/${encodeURIComponent(keyword)};kw`;
  if (city) u += `/${city};wp`;
  const qs = [];
  if (remote) qs.push('wm=home-office');
  if (page > 1) qs.push(`pn=${page}`);
  if (qs.length) u += `?${qs.join('&')}`;
  return u;
}

/**
 * Wyciąga oferty z danych, które strona i tak wczytała (__NEXT_DATA__ / react-query).
 * Żadnych dodatkowych żądań do API — czytamy to, co przeglądarka już ma.
 */
async function extractOffers(page) {
  return page.evaluate(() => {
    const el = document.getElementById('__NEXT_DATA__');
    if (!el) return { error: 'brak __NEXT_DATA__', offers: [], total: null };
    const j = JSON.parse(el.textContent);
    const qs = j.props?.pageProps?.dehydratedState?.queries || [];
    const q = qs.find((x) => x.queryKey[0] === 'jobOffers');
    const d = q?.state?.data;
    if (!d) return { error: 'brak jobOffers', offers: [], total: null };
    const strip = (h) => (h || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const offers = (d.groupedOffers || []).flatMap((g) =>
      (g.offers || []).map((o) => ({
        title: g.jobTitle,
        company: g.companyName,
        location: o.displayWorkplace,
        wholePoland: o.isWholePoland,
        url: o.offerAbsoluteUri,
        salary: g.salaryDisplayText || null,
        workModes: g.workModes || [],
        positionLevels: g.positionLevels || [],
        contracts: g.typesOfContract || [],
        remoteAllowed: g.isRemoteWorkAllowed,
        published: g.lastPublicated,
        summary: strip(g.aiSummary) || strip(g.jobDescription),
      }))
    );
    return { total: d.offersTotalCount, offers };
  });
}

/** Szczegóły pojedynczej oferty ze strony ogłoszenia. */
async function extractOfferDetail(page) {
  return page.evaluate(() => {
    const el = document.getElementById('__NEXT_DATA__');
    const txt = document.body.innerText.replace(/\n{3,}/g, '\n\n');
    let meta = {};
    if (el) {
      try {
        const j = JSON.parse(el.textContent);
        const pp = j.props?.pageProps || {};
        const d = pp.dehydratedState?.queries?.map((q) => q.state?.data).find((x) => x && (x.jobTitle || x.attributes || x.textSections));
        if (d) {
          meta = {
            jobTitle: d.jobTitle,
            employer: d.employer?.name || d.employerName,
            salary: d.attributes?.salary?.text || d.salary?.text || null,
            workModes: d.attributes?.workModes || d.workModes || null,
            contracts: d.attributes?.typesOfContract || d.typesOfContracts || null,
            levels: d.attributes?.positionLevels || d.positionLevels || null,
            workplaces: (d.workplaces || []).map((w) => w.displayAddress || w.inlineAddress),
          };
        }
      } catch { /* strona ogłoszenia bywa renderowana inaczej — zostaje tekst */ }
    }
    return { url: location.href, title: document.title, meta, text: txt.slice(0, 12000) };
  });
}

async function cmdSearch() {
  const keyword = rest[0];
  const remote = rest.includes('--remote');
  const ci = rest.indexOf('--city');
  const city = ci !== -1 ? rest[ci + 1] : null;
  const pi = rest.indexOf('--pages');
  const pages = pi !== -1 ? Number(rest[pi + 1]) : 1;

  const { browser, page } = await connect();
  const all = [];
  let total = null;
  let error = null;
  for (let p = 1; p <= pages; p++) {
    const url = searchUrl(keyword, { remote, city, page: p });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(2500);
    const d = await diagnose(page);
    if (d.cloudflare || d.login || d.blocked) { error = d; break; }
    const r = await extractOffers(page);
    if (r.error) { error = r.error; break; }
    total = r.total;
    all.push(...r.offers);
    if (r.offers.length === 0) break;
    if (p < pages) await polite();
  }
  console.log(JSON.stringify({ keyword, remote, city, total, error, offers: all }, null, 2));
  await browser.close();
}

async function cmdOffer() {
  const { browser, page } = await connect();
  await page.goto(rest[0], { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(3000);
  console.log(JSON.stringify(await extractOfferDetail(page), null, 2));
  await browser.close();
}

const cmd = process.argv[2];
const rest = process.argv.slice(3);

if (import.meta.url === `file://${process.argv[1]}`) {
  const run = {
    open: async () => { const started = await ensureChrome(); console.log(started ? 'Chrome uruchomiony' : 'Chrome już działał'); },
    status: cmdStatus,
    nav: () => cmdNav(rest[0]),
    shot: () => cmdShot(rest[0]),
    search: cmdSearch,
    offer: cmdOffer,
  }[cmd];
  if (!run) {
    console.error('Nieznana komenda. Dostępne: open, status, nav <url>, shot [plik], search <fraza> [--remote] [--city <miasto>] [--pages N], offer <url>');
    process.exit(1);
  }
  run().catch((e) => { console.error('BŁĄD:', e.message); process.exit(1); });
}

export { polite, sleep };
