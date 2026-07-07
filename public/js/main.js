document.getElementById('year').textContent = new Date().getFullYear();

// ---------- profile / resume ----------
async function loadProfile() {
  try {
    const res = await fetch('/api/profile');
    const p = await res.json();
    renderProfile(p);
  } catch (err) {
    console.error('Failed to load profile', err);
  }
}

function renderProfile(p) {
  const firstName = (p.name || '').split(' ')[0] || '';
  const restName = (p.name || '').split(' ').slice(1).join(' ');

  document.getElementById('brandName').innerHTML = `${firstName.toUpperCase()}<span>${restName.toUpperCase()}</span>`;
  document.title = `${p.name || 'Portfolio'} — ${p.title || ''}`;
  document.getElementById('profileName').textContent = p.name || '';
  document.getElementById('profileTitle').textContent = p.title || '';
  document.getElementById('profileBio').textContent = p.bio || '';
  document.getElementById('footerName').textContent = p.name || '';

  const contactLink = document.getElementById('contactLink');
  if (p.phone) contactLink.href = `tel:${p.phone.replace(/\s+/g, '')}`;

  const photoEl = document.getElementById('profilePhoto');
  if (p.photoUrl) {
    photoEl.src = p.photoUrl;
    photoEl.alt = p.name || '';
    photoEl.hidden = false;
  } else {
    photoEl.hidden = true;
  }

  // contact row
  const contactRow = document.getElementById('profileContact');
  const parts = [];
  if (p.phone) parts.push(`<a href="tel:${p.phone.replace(/\s+/g, '')}"><span class="dot">●</span>${p.phone}</a>`);
  if (p.website) parts.push(`<a href="${p.website}" target="_blank" rel="noopener"><span class="dot">●</span>${p.website.replace(/^https?:\/\//, '')}</a>`);
  if (p.location) parts.push(`<span><span class="dot">●</span>${p.location}</span>`);
  contactRow.innerHTML = parts.join('');

  // skills
  document.getElementById('skillsList').innerHTML = (p.skills || [])
    .map(
      (s) => `
      <div class="skill-item">
        <div class="skill-label"><span>${s.name}</span><span>${s.level}%</span></div>
        <div class="skill-bar-track"><div class="skill-bar-fill" style="width:${s.level}%"></div></div>
      </div>`
    )
    .join('');

  // education
  document.getElementById('educationList').innerHTML = (p.education || [])
    .map(
      (e) => `
      <div class="timeline-item">
        <p class="t-period">${e.period || ''}</p>
        <h3>${e.degree}</h3>
        <p class="t-sub">${e.school}</p>
        <p>${e.description || ''}</p>
      </div>`
    )
    .join('');

  // experience
  document.getElementById('experienceList').innerHTML = (p.experience || [])
    .map(
      (e) => `
      <div class="timeline-item">
        <p class="t-period">${e.period || ''}</p>
        <h3>${e.role}</h3>
        <p class="t-sub">${e.company}${e.location ? ' · ' + e.location : ''}</p>
        <ul>${(e.bullets || []).map((b) => `<li>${b}</li>`).join('')}</ul>
      </div>`
    )
    .join('');

  // references
  document.getElementById('referencesList').innerHTML = (p.references || [])
    .map(
      (r) => `
      <div class="reference-item">
        <h4>${r.name}</h4>
        <p class="r-position">${r.position || ''}</p>
        ${r.phone ? `<p>Tel: ${r.phone}</p>` : ''}
        ${r.telegram ? `<p>Telegram: ${r.telegram}</p>` : ''}
      </div>`
    )
    .join('');

  // languages
  document.getElementById('languagesList').innerHTML = (p.languages || [])
    .map(
      (l) => `
      <div class="language-item">
        <div class="language-ring">${l.percent}%</div>
        <p>${l.name}</p>
      </div>`
    )
    .join('');

  // hobbies
  document.getElementById('hobbiesList').innerHTML = (p.hobbies || [])
    .map((h) => `<span class="hobby-chip">${h}</span>`)
    .join('');
}

loadProfile();

// ---------- gallery ----------
const gallery = document.getElementById('gallery');
const emptyState = document.getElementById('emptyState');
const filterBar = document.getElementById('filterBar');

let items = [];
let activeFilter = 'all';

async function loadPortfolio() {
  try {
    const res = await fetch('/api/portfolio');
    items = await res.json();
    buildFilters();
    render();
  } catch (err) {
    console.error('Failed to load portfolio', err);
  }
}

function buildFilters() {
  const categories = ['all', ...new Set(items.map((i) => i.category))];
  filterBar.innerHTML = categories
    .map(
      (cat) =>
        `<button class="filter-btn${cat === 'all' ? ' active' : ''}" data-filter="${cat}">${cat.toUpperCase()}</button>`
    )
    .join('');

  filterBar.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      filterBar.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    });
  });
}

function render() {
  const filtered = activeFilter === 'all' ? items : items.filter((i) => i.category === activeFilter);

  if (filtered.length === 0) {
    emptyState.hidden = false;
    gallery.querySelectorAll('.tile').forEach((t) => t.remove());
    return;
  }
  emptyState.hidden = true;

  gallery.querySelectorAll('.tile').forEach((t) => t.remove());

  filtered.forEach((item, index) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.innerHTML = `
      <div class="sprockets">${'<span></span>'.repeat(10)}</div>
      <p class="frame-num">${String(index + 1).padStart(3, '0')}</p>
      ${item.type === 'video' ? '<p class="play-badge">▶ PLAY</p>' : ''}
      ${
        item.type === 'video'
          ? `<video src="${item.mediaUrl}" muted loop playsinline preload="metadata"></video>`
          : `<img src="${item.mediaUrl}" alt="${item.title}" loading="lazy">`
      }
      <div class="overlay">
        <p class="cat">${item.category}</p>
        <h3>${item.title}</h3>
      </div>
    `;

    if (item.type === 'video') {
      const video = tile.querySelector('video');
      tile.addEventListener('mouseenter', () => video.play().catch(() => {}));
      tile.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
      });
    }

    tile.addEventListener('click', () => openLightbox(item));
    gallery.appendChild(tile);
  });
}

// ---------- lightbox ----------
const lightbox = document.getElementById('lightbox');
const lightboxMedia = document.getElementById('lightboxMedia');
const lightboxCat = document.getElementById('lightboxCat');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxDesc = document.getElementById('lightboxDesc');
const lightboxTags = document.getElementById('lightboxTags');
const lightboxClose = document.getElementById('lightboxClose');

function openLightbox(item) {
  lightboxMedia.innerHTML =
    item.type === 'video'
      ? `<video src="${item.mediaUrl}" controls autoplay playsinline></video>`
      : `<img src="${item.mediaUrl}" alt="${item.title}">`;
  lightboxCat.textContent = item.category;
  lightboxTitle.textContent = item.title;
  lightboxDesc.textContent = item.description || '';
  lightboxTags.innerHTML = (item.tags || []).map((t) => `<span>${t}</span>`).join('');
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightboxMedia.innerHTML = '';
  document.body.style.overflow = '';
}

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

loadPortfolio();
