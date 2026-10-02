import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const errors = [];
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const need = (cond, msg) => { if (!cond) errors.push(msg); };

const profile = read('data/profile.json');
need(profile.name && profile.email, 'profile: name/email 필수');
need(!('phone' in profile), 'profile: phone 필드 금지');

const rpa = read('data/rpa-company.json');
need(Array.isArray(rpa.metrics) && rpa.metrics.length >= 3, 'rpa: metrics 3개 이상');
need(Array.isArray(rpa.tasks) && rpa.tasks.length > 0, 'rpa: tasks 필요');
const taskKeys = ['id', 'category', 'title', 'problem', 'solution', 'tech', 'trigger', 'effect', 'steps'];
const ids = new Set();
for (const t of rpa.tasks || []) {
  for (const k of taskKeys) need(t[k] !== undefined && t[k] !== '' && t[k] !== null, `task ${t.id}: ${k} 누락`);
  need(Array.isArray(t.tech) && t.tech.length > 0, `task ${t.id}: tech 배열`);
  need(Array.isArray(t.steps) && t.steps.length >= 3, `task ${t.id}: steps 3개 이상`);
  need((rpa.categories || []).includes(t.category), `task ${t.id}: category가 categories에 없음`);
  need(!ids.has(t.id), `task ${t.id}: id 중복`); ids.add(t.id);
}

const projects = read('data/projects.json');
const pKeys = ['id', 'type', 'title', 'company', 'period', 'role', 'summary', 'achievement', 'tech'];
for (const p of projects) {
  for (const k of pKeys) need(p[k] !== undefined && p[k] !== '', `project ${p.id}: ${k} 누락`);
  need(['rpa', 'app'].includes(p.type), `project ${p.id}: type은 rpa|app`);
}

const fp = path.join(root, 'tools/forbidden.txt');
const forbidden = fs.existsSync(fp)
  ? fs.readFileSync(fp, 'utf8').split(/\r?\n/).filter(Boolean).map((s) => new RegExp(s))
  : (errors.push('tools/forbidden.txt 없음'), []);
const walk = (p) => fs.statSync(p).isDirectory()
  ? fs.readdirSync(p).flatMap((f) => walk(path.join(p, f))) : [p];
for (const s of ['data', 'index.html', 'css', 'js', 'print']) {
  const full = path.join(root, s);
  if (!fs.existsSync(full)) continue;
  for (const f of walk(full)) {
    if (!/\.(json|html|css|js|ps1)$/.test(f)) continue;
    const text = fs.readFileSync(f, 'utf8');
    for (const re of forbidden) if (re.test(text)) errors.push(`금지 패턴 ${re} 발견: ${path.relative(root, f)}`);
  }
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('validate OK');
