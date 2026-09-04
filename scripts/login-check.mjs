#!/usr/bin/env node
/**
 * login-check.mjs — sprawdza stan zalogowania na pracuj.pl BEZ ruszania karty,
 * w ktorej Pawel wlasnie cos robi. Otwiera osobna karte, czyta i ja zamyka.
 *
 *   node scripts/login-check.mjs           # sam sprawdz
 *   node scripts/login-check.mjs --open    # dodatkowo otworz ekran logowania na wierzchu
 */
import { connect, sleep } from './browse.mjs';

const { browser, ctx, page } = await connect();
const probe = await ctx.newPage();
try {
  await probe.goto('https://www.pracuj.pl/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(2000);
  const r = await probe.evaluate(() => {
    const el = document.getElementById('__NEXT_DATA__');
    if (!el) return { error: 'brak __NEXT_DATA__' };
    const pp = JSON.parse(el.textContent).props?.pageProps || {};
    const u = pp.user || null;
    return {
      zalogowany: !!(u && (u.isLogged || u.email || u.id)),
      email: u?.email ?? null,
      imie: u?.firstName ?? u?.name ?? null,
    };
  });
  console.log(JSON.stringify(r, null, 2));
} finally {
  await probe.close();
}

if (process.argv.includes('--open')) {
  await page.goto('https://login.pracuj.pl/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.bringToFront();
  console.log('Ekran logowania otwarty na wierzchu — zaloguj sie recznie.');
}
await browser.close();
