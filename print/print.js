(() => {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const load = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u); return r.json(); });
  const chips = (a) => `<div class="chips">${a.map((x) => `<span>${esc(x)}</span>`).join('')}</div>`;

  Promise.all([load('../data/profile.json'), load('../data/rpa-company.json'), load('../data/projects.json')])
    .then(([p, r, pr]) => {
      const cover = `
        <section class="cover"><img src="../assets/profile.png" alt="">
          <div><p class="eyebrow">${esc(p.title)}</p><h1>${esc(p.name)}</h1>
          <p class="tagline">${esc(p.tagline)}</p><p class="muted">${esc(p.email)}</p></div></section>
        <p>${esc(p.summary)}</p>
        <h3>핵심 강점</h3><ul class="plain">${p.strengths.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
        <h3>경력</h3><table><tr><th>기관</th><th>역할</th><th>기간</th><th>내용</th></tr>
        ${p.career.map((c) => `<tr><td>${esc(c.org)}</td><td>${esc(c.role)}</td><td>${esc(c.period)}</td><td>${esc(c.note)}</td></tr>`).join('')}</table>
        <p class="muted">${esc(p.education)}</p>
        <h3>기술 스택</h3>${p.skills.map((s) => `<p><b>${esc(s.group)}</b></p>${chips(s.items)}`).join('')}`;

      const rows = (c) => r.tasks.filter((t) => t.category === c).map((t) =>
        `<tr><td><b>${esc(t.title)}</b></td><td>${esc(t.trigger)}</td>
         <td>${esc(t.problem)}<br><span class="muted">→ ${esc(t.solution)}</span></td><td>${esc(t.effect)}</td></tr>`).join('');
      const rpa = `<section class="page-break"><h2>${esc(r.headline)}</h2><p>${esc(r.story)}</p>
        <div class="metrics">${r.metrics.map((m) => `<div class="metric"><b>${esc(m.value)}</b><span>${esc(m.label)}</span></div>`).join('')}</div>
        <h3>운영 거버넌스</h3><ul class="gov">${r.governance.map((g) => `<li><b>${esc(g.title)}</b>${esc(g.body)}</li>`).join('')}</ul>
        ${r.categories.map((c) => `<h3>${esc(c)}</h3><table><thead><tr><th style="width:24%">과제</th><th style="width:14%">실행</th><th>문제 → 해결</th><th style="width:26%">효과</th></tr></thead><tbody>${rows(c)}</tbody></table>`).join('')}</section>`;

      const proj = `<section class="page-break"><h2>Projects</h2>${pr.map((x) => `<div class="proj"><h4>${esc(x.title)}</h4>
        <p class="meta">${esc(x.company)} · ${esc(x.period)}</p>
        <dl><dt>역할 </dt><dd>${esc(x.role)}</dd><dt>내용 </dt><dd>${esc(x.summary)}</dd><dt>성과 </dt><dd>${esc(x.achievement)}</dd></dl>${chips(x.tech)}</div>`).join('')}
        <footer>회사·고객사 정보는 익명 처리했습니다.</footer></section>`;

      document.getElementById('doc').innerHTML = cover + rpa + proj;
      document.fonts.ready.then(() => { document.body.dataset.ready = '1'; });
    })
    .catch((e) => { document.body.textContent = '로드 실패: ' + e.message; });
})();
