'use strict';
(() => {
  const config = window.SITE_PROFILE || {};
  const username = config.username;
  const $ = id => document.getElementById(id);
  let repositories = [];
  let language = 'all';
  $('year').textContent = new Date().getFullYear();
  const status = message => { $('project-status').textContent = message; $('project-status').hidden = !message; };
  const safeUrl = value => {
    try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
  };
  function showProfile(profile) {
    const name = config.displayName || profile.name || profile.login;
    const url = `https://github.com/${encodeURIComponent(profile.login)}`;
    const siteTitle = config.siteTitle || name;
    document.title = `${name} / ${siteTitle}`;
    ['brand-name', 'footer-name'].forEach(id => { $(id).textContent = siteTitle; });
    $('profile-name').textContent = name;
    $('hello').textContent = `你好，我是 ${name}。`;
    $('profile-handle').textContent = `@${profile.login}`;
    const bio = config.bio || profile.bio;
    if (bio) {
      $('bio').textContent = bio;
      $('about-bio').textContent = config.about || bio;
      document.querySelector('meta[name="description"]').content = `${name} · ${bio}`;
    }
    const avatarUrl = safeUrl(profile.avatar_url);
    if (avatarUrl) { $('avatar').src = avatarUrl; $('avatar').alt = `${name} 的 GitHub 头像`; $('avatar').hidden = false; }
    $('avatar').addEventListener('error', () => { $('avatar').hidden = true; }, {once:true});
    $('public-count').textContent = `${profile.public_repos ?? repositories.length} 个公开仓库`;
    document.querySelectorAll('.github-link').forEach(link => { link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; });
    $('connect-link').replaceChildren(document.createTextNode('在 GitHub 打个招呼 '), Object.assign(document.createElement('span'), {textContent:'↗'}));
  }
  function renderProjects() {
    const query = $('search').value.trim().toLowerCase();
    const visible = repositories.filter(repo => {
      const details = config.projects?.[repo.full_name];
      const searchable = `${repo.name} ${repo.description || ''} ${details?.title || ''} ${details?.description || ''}`;
      return (language === 'all' || repo.language === language) && searchable.toLowerCase().includes(query);
    });
    $('project-grid').replaceChildren();
    status(visible.length ? '' : repositories.length ? '没有匹配的项目，试试其他关键词或语言。' : '这里还没有公开项目。新的探索，正在路上。');
    visible.forEach((repo, index) => {
      const link = document.createElement('a');
      link.className = 'project-card'; link.href = `https://github.com/${repo.full_name.split('/').map(encodeURIComponent).join('/')}`;
      link.target = '_blank'; link.rel = 'noopener noreferrer';
      const top = document.createElement('div'); top.className = 'project-top';
      const number = document.createElement('span'); number.textContent = `${String(index + 1).padStart(2, '0')} / ${repo.fork ? 'FORK' : 'PROJECT'}`;
      const arrow = document.createElement('span'); arrow.className = 'arrow'; arrow.textContent = '↗'; top.append(number, arrow);
      const details = config.projects?.[repo.full_name];
      const title = document.createElement('h3'); title.textContent = details?.title || repo.name;
      const description = document.createElement('p'); description.textContent = details?.description || repo.description || '在 GitHub 上查看项目代码与更多信息。';
      const meta = document.createElement('div'); meta.className = 'project-meta';
      const lang = document.createElement('span');
      const dot = document.createElement('i'); dot.className = 'language-dot';
      lang.append(dot, document.createTextNode(repo.language || 'Code'));
      const stars = document.createElement('span'); stars.textContent = `☆ ${repo.stargazers_count || 0}`;
      meta.append(lang, stars); link.append(top, title, description, meta); $('project-grid').append(link);
    });
  }
  function showRepositories(repos) {
    repositories = repos.filter(repo => repo.full_name && !repo.private && !repo.archived).sort((a,b) => (b.stargazers_count || 0) - (a.stargazers_count || 0) || new Date(b.pushed_at) - new Date(a.pushed_at));
    $('filters').querySelectorAll('[data-language]:not([data-language="all"])').forEach(button => button.remove());
    [...new Set(repositories.map(repo => repo.language).filter(Boolean))].sort().forEach(name => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'filter'; button.dataset.language = name; button.textContent = name; button.setAttribute('aria-pressed', 'false'); $('filters').append(button);
    });
    renderProjects();
  }
  $('search').addEventListener('input', renderProjects);
  $('filters').addEventListener('click', event => {
    const button = event.target.closest('button[data-language]'); if (!button) return;
    language = button.dataset.language;
    $('filters').querySelectorAll('button').forEach(item => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
    renderProjects();
  });
  if (!username) { status('GitHub 主页尚未绑定，项目将在连接账号后显示。'); return; }
  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username)) { status('GitHub 用户名格式不正确，请检查配置。'); return; }
  async function request(path) {
    const response = await fetch(`https://api.github.com${path}`, {headers:{Accept:'application/vnd.github+json'}, signal:AbortSignal.timeout(12000)});
    if (!response.ok) throw new Error(response.status === 404 ? '找不到这个 GitHub 用户。' : 'GitHub 暂时无法访问，请稍后刷新重试。');
    return response.json();
  }
  async function load() {
    const snapshot = config.snapshot;
    if (snapshot) { showProfile(snapshot.profile); showRepositories(snapshot.repositories); }
    else status('正在从 GitHub 加载公开资料…');
    try {
      const profile = await request(`/users/${encodeURIComponent(username)}`);
      showProfile(profile);
      let repos = [];
      for (let page = 1; ; page++) {
        const batch = await request(`/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed&page=${page}`);
        repos.push(...batch);
        if (batch.length < 100) break;
      }
      showRepositories(repos);
    } catch (error) {
      if (snapshot) { $('public-count').textContent += ' · 已保存资料'; }
      else status(error.message || '资料加载失败，请稍后刷新。');
    }
  }
  load();
})();
