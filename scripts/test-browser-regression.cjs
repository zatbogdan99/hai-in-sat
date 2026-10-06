// Local, deterministic browser regression checks. No request reaches production.
// Playwright is intentionally external to the application's dependency graph:
// install it in a parent tools directory or set NODE_PATH to that node_modules.
// node scripts/test-browser-regression.cjs --root <built checkout> --out <evidence>
// Add --baseline <previous evidence> to calculate image/geometry differences.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { createHash } = require('node:crypto');
const { once } = require('node:events');
const { setTimeout: delay } = require('node:timers/promises');
const { chromium } = require('playwright');
const sharp = require('sharp');

const args = process.argv.slice(2);
const option = (key, fallback) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const root = path.resolve(option('--root', path.join(__dirname, '..')));
const output = path.resolve(option('--out', path.join(root, 'tmp/browser-regression')));
const baseline = option('--baseline');
const port = Number(option('--port', '4132'));
const origin = `http://localhost:${port}`;
const apiOrigin = 'https://hai-in-sat-api.lm.r.appspot.com';
const images = ['/assets/poza_landing1.avif', '/assets/poza_landing2.avif', '/assets/logo.avif'];
const catalog = Array.from({ length: 10 }, (_, index) => ({
  id: `11111111-1111-1111-1111-${String(index + 1).padStart(12, '0')}`,
  name: index === 9 ? 'Casă tradițională în Horezu' : `Teren cu livadă în Costești ${index + 1}`,
  type: index === 9 ? 'house' : 'land',
  description: '<p>Loc liniștit, cu priveliște spre munți, livadă și acces la drum.</p><p>Suprafață: 2500 mp. Utilități la limita proprietății. Telefon: 0728 140 628.</p>',
  thumbnail: images[index % 2], sortOrder: index + 1, videoUrl: null,
}));
const report = { root, started: new Date().toISOString(), viewports: [], requests: [], blockedExternal: [], screenshots: [], failures: [] };
let server, browser, serverLog = '';

function apiResponse(url) {
  if (url.pathname === '/get-all-properties') {
    const selected = catalog.filter(item => !url.searchParams.get('type') || item.type === url.searchParams.get('type'));
    const number = Number(url.searchParams.get('page') || 0);
    const size = Number(url.searchParams.get('size') || 6);
    return { content: selected.slice(number * size, (number + 1) * size), totalElements: selected.length, totalPages: Math.ceil(selected.length / size), size, number };
  }
  if (url.pathname === '/get-by-id') return catalog.find(item => item.id === url.searchParams.get('id')) || null;
  if (url.pathname === '/get-photos') {
    const offset = Number(url.searchParams.get('offset') || 0);
    const limit = Number(url.searchParams.get('limit') || 2);
    return { photos: images.slice(offset, offset + limit), total: images.length };
  }
  return {};
}

async function startServer() {
  fs.mkdirSync(output, { recursive: true });
  assert.ok(fs.existsSync(path.join(root, 'dist/hai-in-sat/server/main.js')), 'Build browser and SSR first');
  report.bundleSha256 = {};
  for (const relative of ['dist/hai-in-sat/server/main.js', ...fs.readdirSync(path.join(root,'dist/hai-in-sat/browser')).filter(name => /^main\..*\.js$/.test(name)).map(name => `dist/hai-in-sat/browser/${name}`)]) {
    report.bundleSha256[relative] = createHash('sha256').update(fs.readFileSync(path.join(root,relative))).digest('hex');
  }
  const probe = net.createServer();
  probe.listen(port, '127.0.0.1');
  await once(probe, 'listening');
  await new Promise(resolve => probe.close(resolve));
  const fixture = path.join(output, 'browser-api-fixture.cjs');
  fs.writeFileSync(fixture, `const apiOrigin = ${JSON.stringify(apiOrigin)};\nconst catalog = ${JSON.stringify(catalog)};\nconst images = ${JSON.stringify(images)};\nconst apiResponse = ${apiResponse.toString()};\nglobalThis.fetch = async (input) => { const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url); if(url.origin !== apiOrigin) throw new Error('External SSR request blocked: ' + url); return new Response(JSON.stringify(apiResponse(url)), {status:200, headers:{'Content-Type':'application/json'}}); };\n`);
  server = spawn(process.execPath, ['--require', fixture, path.join(root, 'dist/hai-in-sat/server/main.js')], {
    cwd: root, windowsHide: true, env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', chunk => { serverLog += chunk; });
  server.stderr.on('data', chunk => { serverLog += chunk; });
  for (let attempt = 0; attempt < 200 && !serverLog.includes('Node Express server listening'); attempt++) {
    assert.equal(server.exitCode, null, serverLog);
    await delay(100);
  }
  assert.ok(serverLog.includes('Node Express server listening'), serverLog);
}

async function settled(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(700);
}

async function capture(page, viewport, name) {
  await settled(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  const file = `${viewport}-${name}.png`;
  const metrics = await page.evaluate(() => {
    const result = { viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, documentHeight: document.documentElement.scrollHeight, elements: [] };
    for (const selector of ['.topbar', '.hero', 'h1', '.footer-links', '.property-filter-buttons', '.property-card', '.property-list-item', '.property-pagination', '.property-details-container', '.gallery', '.login-card', '.p-dialog', '.p-popover', '.parent-container', '.add-property-container', '.form-grid', '.village-swiper', '.mySwiper']) {
      for (const el of document.querySelectorAll(selector)) {
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        const style = getComputedStyle(el);
        result.elements.push({ selector, x: rect.x, y: rect.y + scrollY, width: rect.width, height: rect.height, font: style.font, color: style.color, background: style.backgroundColor });
      }
    }
    return result;
  });
  await page.screenshot({ path: path.join(output, file), fullPage: true, animations: 'disabled' });
  report.screenshots.push({ file, url: page.url().replace(origin, ''), configuredViewport:page.viewportSize(), ...metrics });
  console.log(`CAPTURE ${file} (${metrics.documentWidth} x ${metrics.documentHeight})`);
}

async function runViewport(viewport) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1, isMobile: viewport.width < 600, hasTouch: viewport.width < 600, reducedMotion: 'reduce', serviceWorkers: 'block', locale: 'ro-RO', timezoneId: 'Europe/Bucharest' });
  const result = { name: viewport.name, checks: [], pageErrors: [] };
  report.viewports.push(result);
  const pass = name => { result.checks.push(name); console.log(`PASS ${viewport.name}: ${name}`); };
  let authAttempts = 0;
  const jwt = `${Buffer.from(JSON.stringify({alg:'none',typ:'JWT'})).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: 'task132-test-user', user_id: 'task132-test-user', aud: 'hai-in-sat-api', iss: 'https://securetoken.google.com/hai-in-sat-api', email: 'task132@example.test', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+3600, auth_time: Math.floor(Date.now()/1000), firebase: { sign_in_provider:'password', identities: {email:['task132@example.test']} } })).toString('base64url')}.test-signature`;
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === origin) return route.continue();
    // Public static fonts are read once and reused verbatim for before/after.
    // This is the only external traffic allowed; application APIs stay mocked.
    if (url.hostname === 'fonts.gstatic.com' && request.method() === 'GET') {
      const fontDir = path.join(baseline || output, 'fonts');
      fs.mkdirSync(fontDir, {recursive:true});
      const cached = path.join(fontDir, createHash('sha256').update(request.url()).digest('hex') + '.woff2');
      if (!fs.existsSync(cached)) {
        const response = await route.fetch();
        assert.ok(response.ok(), `Font download failed: ${request.url()}`);
        fs.writeFileSync(cached, await response.body());
      }
      return route.fulfill({status:200, contentType:'font/woff2', body:fs.readFileSync(cached)});
    }
    if (url.origin === apiOrigin) {
      report.requests.push({ viewport: viewport.name, url: url.pathname + url.search, method: request.method(), body: request.postData(), hasBearerAuth:request.headers().authorization?.startsWith('Bearer ') || false, mocked: true });
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(apiResponse(url)) });
    }
    if (url.hostname === 'identitytoolkit.googleapis.com') {
      report.requests.push({ viewport: viewport.name, url: url.pathname, method: request.method(), mocked: true });
      let body = {};
      let status = 200;
      if (url.pathname.endsWith('accounts:signInWithPassword')) {
        authAttempts++;
        if (authAttempts === 1) { status = 400; body = { error: { code: 400, message: 'INVALID_LOGIN_CREDENTIALS', errors: [{ message:'INVALID_LOGIN_CREDENTIALS', domain:'global', reason:'invalid' }] } }; }
        else body = { localId:'task132-test-user', email:'task132@example.test', idToken:jwt, refreshToken:'task132-local-mock', expiresIn:'3600', registered:true };
      } else if (url.pathname.endsWith('accounts:lookup')) {
        body = { users:[{ localId:'task132-test-user', email:'task132@example.test', emailVerified:true, passwordUpdatedAt:Date.now(), providerUserInfo:[{ providerId:'password', email:'task132@example.test', federatedId:'task132@example.test' }], validSince:String(Math.floor(Date.now()/1000)-100), createdAt:String(Date.now()), lastLoginAt:String(Date.now()) }] };
      }
      return route.fulfill({ status, contentType:'application/json', body:JSON.stringify(body) });
    }
    report.blockedExternal.push({ viewport: viewport.name, method:request.method(), url:request.url() });
    return route.abort('blockedbyclient');
  });
  const page = await context.newPage();
  page.on('pageerror', error => result.pageErrors.push(String(error)));
  page.setDefaultTimeout(15000);
  const go = async url => { await page.goto(origin + url); await settled(page); };
  const countCards = async count => page.waitForFunction(expected => document.querySelectorAll('.property-card, .property-list-item').length === expected, count);
  try {
    await go('/');
    result.initialMenuFocus = await page.locator('.topbar__menu-button button').evaluate(el => ({
      autofocus:el.hasAttribute('autofocus'), focused:el === document.activeElement,
      focusVisible:el.matches(':focus-visible'), outline:getComputedStyle(el).outline,
      boxShadow:getComputedStyle(el).boxShadow,
    }));
    assert.equal(await page.locator('p-button button[autofocus]').count(), 0, 'Buttons must not acquire native autofocus on page load');
    assert.equal(result.initialMenuFocus.focused, false, 'Mobile menu must not steal initial focus');
    await capture(page, viewport.name, 'home');
    assert.equal(await page.locator('.footer-links a').count(), 7);
    pass('homepage and seven footer links');
    if (viewport.width < 600) {
      for(let tab=0;tab<10 && !(await page.locator('.topbar__menu-button button').evaluate(el => el === document.activeElement));tab++) await page.keyboard.press('Tab');
      const keyboardFocus = await page.locator('.topbar__menu-button button').evaluate(el => {
        const style=getComputedStyle(el);
        return { focused:el === document.activeElement, visible:el.matches(':focus-visible'), outline:style.outline, boxShadow:style.boxShadow, hasIndicator:(style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) || style.boxShadow !== 'none' };
      });
      assert.ok(keyboardFocus.focused && keyboardFocus.visible && keyboardFocus.hasIndicator, 'Keyboard focus indicator must remain visible');
      result.menuKeyboardFocus = keyboardFocus;
      await page.keyboard.press('Enter');
      await page.locator('.mobile-menu-panel').waitFor({state:'visible'});
      await page.keyboard.press('Escape');
      await page.locator('.mobile-menu-panel').waitFor({state:'hidden'});
      pass('mobile menu keyboard Tab focus indicator, Enter and Escape');
      await page.locator('.topbar__menu-button button').click();
      await page.locator('.mobile-menu-panel').waitFor({state:'visible'});
      await capture(page, viewport.name, 'menu');
      await page.locator('.mobile-menu-panel a[href="/properties"]').click();
      await page.locator('.mobile-menu-panel').waitFor({state:'hidden'});
    } else await page.locator('.nav-chips a[href="/properties"]').click();
    await countCards(6);
    assert.equal(await page.locator('p-button button[autofocus]').count(), 0, 'Properties buttons must not acquire native autofocus');
    pass('desktop/mobile menu navigation');
    await capture(page, viewport.name, 'properties-grid');
    const newTabPromise = context.waitForEvent('page');
    await page.locator('.property-details-link').first().click({button:'middle'});
    const newTab = await newTabPromise;
    await newTab.bringToFront();
    await newTab.waitForLoadState('domcontentloaded');
    await newTab.locator('.property-title').waitFor();
    assert.match(newTab.url(), /\/property\//);
    await newTab.close();
    await page.bringToFront();
    pass('property opens in a new tab');
    await page.locator('a[aria-label="Pagina următoare"]').click();
    await countCards(3);
    await capture(page, viewport.name, 'properties-page2');
    await page.locator('.filter-button', {hasText:'Case'}).click();
    await countCards(1);
    assert.match(page.url(), /type=house/);
    await capture(page, viewport.name, 'properties-houses');
    await page.goBack(); await countCards(3);
    assert.match(page.url(), /page=1/);
    await page.goBack(); await countCards(6);
    pass('filter, pagination, browser Back restore page and totals');
    result.layoutToggleCount = await page.locator('p-selectbutton button').count();
    if (result.layoutToggleCount) {
      await page.locator('p-selectbutton button').first().click();
      await page.locator('.property-list-item').first().waitFor();
      await capture(page, viewport.name, 'properties-list');
    }
    await page.locator('.property-details-link').first().click();
    await page.locator('.property-title').waitFor();
    await page.waitForFunction(() => document.querySelector('.gallery-counter')?.textContent?.trim() === '1 / 3');
    await capture(page, viewport.name, 'details');
    await page.getByRole('button', {name:'Imagine următoare'}).click();
    await page.waitForFunction(() => document.querySelector('.gallery-counter')?.textContent?.trim() === '2 / 3');
    await capture(page, viewport.name, 'gallery-next');
    await page.getByRole('button', {name:'Imagine anterioară'}).click();
    await page.locator('.back-btn:visible').first().click(); await countCards(6);
    pass('detail gallery next/previous and return link');
    await page.getByRole('button',{name:'Vreau și eu!'}).click();
    await page.locator('.p-dialog').waitFor({state:'visible'});
    await capture(page, viewport.name, 'property-contact');
    await page.locator('.dialog-footer button').click();
    assert.ok(await page.locator('.field-error').count() >= 2);
    await page.locator('#firstName').fill('Test automat');
    await page.locator('#email').fill('task132@example.test');
    await page.locator('#village').fill('Costești');
    await page.locator('#propertyType').fill('Teren');
    await page.getByRole('option', {name:'Teren',exact:true}).click();
    await page.locator('#propertyDescription').fill('Fixture local fără trimitere în producție.');
    await page.locator('.dialog-footer button').click();
    await page.locator('.p-dialog').waitFor({state:'hidden'});
    assert.ok(report.requests.some(r => r.viewport === viewport.name && r.url === '/properties-form' && r.method === 'POST'));
    pass('property contact validation, autocomplete, mocked submission');
    await page.locator('.footer-links a[href="/homes"]').click();
    await page.locator('.form-hero-title').waitFor();
    await capture(page, viewport.name, 'home-form');
    const visible = selector => page.locator(`${selector}:visible`);
    await visible('input[formcontrolname="name"]').fill('Test');
    await visible('input[formcontrolname="surname"]').fill('Automat');
    await visible('input[formcontrolname="phoneNumber"]').fill('0700000000');
    await visible('input[formcontrolname="mail"]').fill('task132@example.test');
    await visible('textarea[formcontrolname="details"]').fill('Cerere locală pentru verificarea dependențelor.');
    await page.locator('label.pill-label:visible', {hasText:'TEREN'}).click();
    await visible('input[type="checkbox"]').check();
    await page.getByRole('button',{name:'HAI IN SAT',exact:true}).filter({visible:true}).click();
    await page.getByText('Formularul a fost trimis cu succes').first().waitFor();
    assert.ok(report.requests.some(r => r.viewport === viewport.name && r.url === '/home-form' && r.method === 'POST' && JSON.parse(r.body).propertyType === 'land'));
    pass('home form radio/checkbox and mocked submission');
    await page.locator('.footer-links a[href="/contact-us"]').click();
    await capture(page, viewport.name, 'contact');
    pass('footer navigation to contact');
    await go('/properties');
    assert.equal(await page.locator('p-button button[autofocus]').count(), 0, 'Direct properties load must not autofocus buttons');
    pass('direct home/properties loads preserve initial focus');
    await go('/add-property');
    await page.waitForURL('**/login');
    await capture(page, viewport.name, 'login');
    pass('unauthenticated admin route redirects to login');
    await page.locator('#email').fill('task132@example.test');
    await page.locator('#password').fill('local-test-password');
    await page.getByRole('button',{name:'Autentificare',exact:true}).click();
    await page.getByText('Email sau parolă incorectă.').waitFor();
    await capture(page, viewport.name, 'login-error');
    pass('mocked Firebase invalid credentials');
    await page.getByRole('button',{name:'Autentificare',exact:true}).click();
    await page.waitForURL('**/add-property');
    await capture(page, viewport.name, 'admin');
    await page.locator('#name').fill('Proprietate de test local');
    await page.locator('#description').fill('Nicio scriere în producție.');
    await page.locator('.type-dropdown').click();
    await page.getByRole('option', {name:'land',exact:true}).click();
    await capture(page, viewport.name, 'admin-filled');
    await page.getByRole('button',{name:'Save',exact:true}).click();
    await page.getByText('Proprietatea a fost salvată.').waitFor();
    assert.ok(report.requests.some(r => r.viewport === viewport.name && r.url === '/save-property' && r.method === 'POST' && r.hasBearerAuth), 'Admin save must carry the mocked Firebase bearer token');
    await page.getByRole('button',{name:'Deconectare'}).click();
    await page.waitForURL(origin + '/');
    pass('mocked Firebase success, admin select/save and logout');
    assert.deepEqual(result.pageErrors, [], 'Uncaught browser errors');
  } catch (error) {
    report.failures.push({viewport:viewport.name, error:String(error), stack:error.stack});
    fs.writeFileSync(path.join(output,`${viewport.name}-failure.html`),await page.content());
    await page.screenshot({path:path.join(output,`${viewport.name}-failure.png`),fullPage:true}).catch(() => {});
    console.error(`FAIL ${viewport.name}: ${error.stack}`);
  }
  try {
    await go('/under-the-mountain');
    await page.waitForFunction(() => document.querySelector('swiper-container')?.swiper?.initialized);
    const initial = await page.locator('swiper-container').evaluate(el => el.swiper.realIndex);
    await capture(page, viewport.name, 'villages');
    await page.locator('.discover-next').click();
    await page.waitForFunction(index => document.querySelector('swiper-container').swiper.realIndex !== index, initial);
    await capture(page, viewport.name, 'villages-next');
    await page.locator('.discover-prev').click();
    await page.waitForFunction(index => document.querySelector('swiper-container').swiper.realIndex === index, initial);
    pass('Swiper village carousel initialized, next and previous');
    async function swipe(locator) {
      await locator.scrollIntoViewIfNeeded();
      const box = await locator.boundingBox();
      const before = await locator.evaluate(el => el.swiper.realIndex);
      const start = {x:box.x+box.width*0.8,y:box.y+Math.min(box.height*0.5,150)};
      const end = {x:box.x+box.width*0.2,y:start.y};
      if (viewport.width < 600) {
        const cdp = await context.newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[start]});
        for(let i=1;i<=8;i++) await cdp.send('Input.dispatchTouchEvent', {type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*i/8,y:start.y}]});
        await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]});
        await cdp.detach();
      } else {
        await page.mouse.move(start.x,start.y); await page.mouse.down();
        await page.mouse.move(end.x,end.y,{steps:8}); await page.mouse.up();
      }
      await page.waitForTimeout(650);
      assert.notEqual(await locator.evaluate(el => el.swiper.realIndex), before, 'Swiper must move on drag/touch');
    }
    await swipe(page.locator('swiper-container'));
    pass('Swiper village carousel responds to drag/touch');
    await go('/see-the-area');
    await capture(page, viewport.name, 'area-choice');
    result.areaChoiceButtonCount = await page.locator('p-card:visible button').count();
    // Record an inaccessible pre-existing flow instead of invoking Angular internals.
    for(const [label, kind] of result.areaChoiceButtonCount ? [['Cumpără','buy'],['Închiriază','rent']] : []) {
      await page.locator('p-card:visible').filter({hasText:label}).locator('button').click();
      const swiper = page.locator(`app-see-the-area-${kind}:visible .mySwiper:visible`).last();
      await swiper.waitFor();
      assert.ok(await swiper.evaluate(el => el.swiper?.initialized), `${kind} Swiper initializes`);
      await capture(page, viewport.name, `area-${kind}`);
      await swipe(swiper);
      pass(`Swiper ${kind} carousel initialized and responds to drag/touch`);
      await page.locator('p-button.back-desktop:visible button, p-button.back-mobile:visible button').click();
    }
    assert.deepEqual(result.pageErrors, [], 'Uncaught browser errors including Swiper routes');
  } catch(error) {
    report.failures.push({viewport:viewport.name, suite:'swiper', error:String(error), stack:error.stack});
    fs.writeFileSync(path.join(output,`${viewport.name}-swiper-failure.html`),await page.content());
    await page.screenshot({path:path.join(output,`${viewport.name}-swiper-failure.png`),fullPage:true}).catch(() => {});
    console.error(`FAIL ${viewport.name} Swiper: ${error.stack}`);
  } finally { await context.close(); }
}

async function compare() {
  if (!baseline) return;
  const before = JSON.parse(fs.readFileSync(path.join(baseline,'report.json'),'utf8'));
  report.comparison = [];
  for (const current of report.screenshots) {
    const previous = before.screenshots.find(item => item.file === current.file);
    if (!previous) continue;
    const a = await sharp(path.join(baseline,current.file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const b = await sharp(path.join(output,current.file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const dimensionsEqual = a.info.width === b.info.width && a.info.height === b.info.height;
    let changedPixels = null;
    if (dimensionsEqual) {
      changedPixels = 0;
      for (let pixel = 0; pixel < a.data.length; pixel += 4) if ([0,1,2].some(c => Math.abs(a.data[pixel+c]-b.data[pixel+c]) > 8)) changedPixels++;
    }
    report.comparison.push({file:current.file, dimensionsEqual, before:[a.info.width,a.info.height], after:[b.info.width,b.info.height], changedPixels, changedPercent:changedPixels === null ? null : changedPixels/(a.info.width*a.info.height)*100, geometryEqual:JSON.stringify(previous.elements) === JSON.stringify(current.elements)});
  }
  console.log(`COMPARE ${report.comparison.length} screenshots: ${report.comparison.filter(item => !item.dimensionsEqual).length} dimensions changed; ${report.comparison.filter(item => !item.geometryEqual).length} geometry changed. Review report.json and images for visual acceptance.`);
}

(async () => {
  try {
    await startServer();
    browser = await chromium.launch({ headless:true, channel:process.env.BROWSER_CHANNEL || 'chrome' });
    report.browser = browser.version();
    for (const viewport of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844},{name:'small-mobile',width:320,height:740}].filter(item => !option('--viewport') || item.name === option('--viewport'))) await runViewport(viewport);
    await compare();
  } catch(error) { report.failures.push({error:String(error), stack:error.stack}); console.error(error); }
  finally {
    if (browser) await browser.close();
    if (server) { server.kill(); await once(server,'exit').catch(() => {}); }
    fs.writeFileSync(path.join(output,'server.log'),serverLog);
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
    console.log(`Evidence: ${output}`);
    if (report.failures.length) process.exitCode = 1;
  }
})();
