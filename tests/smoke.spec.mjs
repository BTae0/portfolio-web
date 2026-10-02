import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.pdf': 'application/pdf' };
const server = createServer((req, res) => {
  const p = path.join(root, req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(4173);
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
let failed = 0;
const check = (c, m) => { if (!c) { failed++; console.error('FAIL', m); } else console.log('ok  ', m); };
for (const [name, vp] of [['desktop', { width: 1280, height: 800 }], ['mobile', { width: 375, height: 800 }]]) {
  const page = await browser.newPage({ viewport: vp });
  const errs = []; page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto('http://localhost:4173/');
  await page.waitForSelector('#rpa .task-card', { timeout: 5000 });
  check(errs.length === 0, `${name}: 콘솔 오류 없음 ${errs}`);
  check(await page.locator('#rpa .task-card').count() === 21, `${name}: R사 과제 카드 21`);
  check(await page.locator('#projects .project-card').count() === 8, `${name}: 프로젝트 8건`);
  check(await page.evaluate(() => [...document.querySelectorAll('body *')].every((e) => e.getBoundingClientRect().right <= innerWidth + 1 || getComputedStyle(e).position === 'fixed')), `${name}: 가로 넘침 요소 없음`);
  await page.locator('#rpa .task-card').first().click();
  check(await page.evaluate(() => document.querySelector('#modal').open), `${name}: 모달 열림`);
  await page.keyboard.press('Escape');
  check(await page.evaluate(() => !document.querySelector('#modal').open), `${name}: Esc로 모달 닫힘`);
  check(await page.evaluate(() => !!document.querySelector('#modal').getAttribute('aria-labelledby')), `${name}: 모달 접근성 이름`);
  check(await page.evaluate(() => document.querySelectorAll('.skill > p, #skills p p').length === 0), `${name}: p 중첩 없음`);
  check(await page.locator('.hero-stats li').count() === 3, `${name}: Hero 핵심 수치 3개`);
  await page.fill('#project-search', '존재하지않는검색어zzz');
  check(await page.locator('#projects .empty').isVisible(), `${name}: 0건 안내`);
  await page.fill('#project-search', '');
  await page.click('[data-filter="rpa"]');
  check(await page.locator('#projects .project-card').count() === 3, `${name}: RPA 필터 3건`);
  await page.click('[data-filter="all"]');
  await page.screenshot({ path: path.join(root, `tmp/${name}.png`), fullPage: true });
  await page.close();
}
// 데이터 로드 실패 시 안내
const bad = await browser.newPage();
await bad.route('**/data/projects.json', (r) => r.fulfill({ status: 500, body: '' }));
await bad.goto('http://localhost:4173/'); await bad.waitForTimeout(800);
check(await bad.locator('#load-error').isVisible(), '데이터 로드 실패 안내 표시');
await browser.close(); server.close();
process.exit(failed ? 1 : 0);
