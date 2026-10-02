(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const load = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u); return r.json(); });
  const chips = (arr) => `<div class="chips">${arr.map((x) => `<span>${esc(x)}</span>`).join('')}</div>`;

  const openModal = (html) => {
    const m = $('#modal');
    m.innerHTML = `<button class="close" aria-label="닫기">×</button><div class="modal-body">${html.replace('<h3>', '<h3 id="modal-title">')}</div>`;
    m.setAttribute('aria-labelledby', 'modal-title');
    m.showModal();
    $('.close', m).onclick = () => m.close();
  };
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') e.target.close(); });

  const renderHero = (p, r) => {
    $('#hero').innerHTML = `
      <img class="avatar" src="assets/profile.png" alt="${esc(p.name)} 프로필 사진" width="112" height="112">
      <div>
        <p class="eyebrow">${esc(p.title)}</p>
        <h1>${esc(p.name)}</h1>
        <p class="tagline">${esc(p.tagline)}</p>
        <p class="summary">${esc(p.summary)}</p>
        <div class="actions">
          <a class="btn primary" href="dist/portfolio.pdf" download>PDF 다운로드</a>
          <a class="btn" href="mailto:${esc(p.email)}">${esc(p.email)}</a>
        </div>
        <ul class="hero-stats">${r.metrics.slice(0, 3).map((m) => `<li><b>${esc(m.value)}</b> ${esc(m.label)}</li>`).join('')}</ul>
      </div>`;
  };

  const renderImpact = (r) => {
    $('#impact').innerHTML = `
      <h2>${esc(r.headline)}</h2>
      <p class="lead">${esc(r.story)}</p>
      <div class="metrics">${r.metrics.map((m) => `<div class="metric"><b>${esc(m.value)}</b><span>${esc(m.label)}</span></div>`).join('')}</div>`;
  };

  const renderRpa = (r) => {
    const gov = r.governance.map((g) => `<li><b>${esc(g.title)}</b><span>${esc(g.body)}</span></li>`).join('');
    const groups = r.categories.map((c) => {
      const cards = r.tasks.filter((t) => t.category === c).map((t) =>
        `<button class="card task-card" data-id="${esc(t.id)}"><span class="tag">${esc(t.category)}</span>
          <strong>${esc(t.title)}</strong><small>${esc(t.trigger)}</small></button>`).join('');
      return cards ? `<h3>${esc(c)}</h3><div class="grid">${cards}</div>` : '';
    }).join('');
    $('#rpa').innerHTML = `<h2>R사 RPA 도입·운영</h2>
      <p class="lead">카드를 누르면 문제, 해결 방식, 효과, 처리 흐름을 볼 수 있습니다.</p>
      <ul class="gov">${gov}</ul>${groups}`;
    $('#rpa').addEventListener('click', (e) => {
      const b = e.target.closest('.task-card'); if (!b) return;
      const t = r.tasks.find((x) => x.id === b.dataset.id);
      openModal(`<span class="tag">${esc(t.category)}</span><h3>${esc(t.title)}</h3>
        <dl><dt>문제</dt><dd>${esc(t.problem)}</dd><dt>해결</dt><dd>${esc(t.solution)}</dd>
        <dt>실행</dt><dd>${esc(t.trigger)}</dd><dt>효과</dt><dd>${esc(t.effect)}</dd></dl>
        ${chips(t.tech)}<h4>처리 흐름</h4><ol>${t.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`);
    });
  };

  const renderProjects = (list) => {
    let filter = 'all', q = '';
    const draw = () => {
      const items = list.filter((p) => (filter === 'all' || p.type === filter) &&
        (!q || ([p.title, p.summary, p.tech.join(' ')].join(' | ')).toLowerCase().includes(q)));
      $('#project-list').innerHTML = items.length
        ? items.map((p) => `<button class="card project-card" data-id="${esc(p.id)}">
            <span class="tag ${esc(p.type)}">${p.type === 'rpa' ? 'Power Automate' : 'Power Apps'}</span>
            <strong>${esc(p.title)}</strong><small>${esc(p.period)}</small><span class="ach">${esc(p.achievement)}</span></button>`).join('')
        : '<p class="empty">조건에 맞는 프로젝트가 없습니다.</p>';
    };
    document.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => {
      filter = b.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach((x) => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      draw();
    }));
    $('#project-search').addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); draw(); });
    $('#project-list').addEventListener('click', (e) => {
      const b = e.target.closest('.project-card'); if (!b) return;
      const p = list.find((x) => x.id === b.dataset.id);
      openModal(`<span class="tag ${esc(p.type)}">${p.type === 'rpa' ? 'Power Automate' : 'Power Apps'}</span><h3>${esc(p.title)}</h3>
        <p class="meta">${esc(p.company)} · ${esc(p.period)}</p>
        <dl><dt>역할</dt><dd>${esc(p.role)}</dd><dt>내용</dt><dd>${esc(p.summary)}</dd><dt>성과</dt><dd>${esc(p.achievement)}</dd></dl>${chips(p.tech)}`);
    });
    draw();
  };

  const renderSkills = (p) => {
    $('#skills').innerHTML = `<h2>Skills &amp; Career</h2>
      <div class="two">
        <div><h3>기술 스택</h3>${p.skills.map((s) => `<p class="skill"><b>${esc(s.group)}</b>${chips(s.items)}</p>`).join('')}</div>
        <div><h3>경력</h3><ul class="career">${p.career.map((c) =>
          `<li><b>${esc(c.org)}</b><span>${esc(c.role)} · ${esc(c.period)}</span><small>${esc(c.note)}</small></li>`).join('')}</ul>
          <h3>학력</h3><p>${esc(p.education)}</p>
          <h3>강점</h3><ul class="plain">${p.strengths.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
      </div>`;
  };

  Promise.all([load('data/profile.json'), load('data/rpa-company.json'), load('data/projects.json')])
    .then(([p, r, pr]) => { renderHero(p, r); renderImpact(r); renderRpa(r); renderProjects(pr); renderSkills(p); })
    .catch((e) => {
      const el = $('#load-error');
      el.hidden = false;
      el.textContent = `데이터를 불러오지 못했습니다. 새로고침해 주세요. (${e.message})`;
    });
})();
