// ---------- profile / resume editor ----------
const profileForm = document.getElementById('profileForm');
const profileError = document.getElementById('profileError');
const profileSuccess = document.getElementById('profileSuccess');
const photoField = document.getElementById('p-photo');
const photoPreview = document.getElementById('photoPreview');

// config describing each repeater section: fields + how to render one row
const REPEATER_CONFIG = {
  skills: {
    container: 'skillsRepeater',
    fields: [
      { key: 'name', label: 'Skill name', type: 'text' },
      { key: 'level', label: 'Level (0-100)', type: 'number' },
    ],
  },
  education: {
    container: 'educationRepeater',
    fields: [
      { key: 'degree', label: 'Degree / program', type: 'text' },
      { key: 'school', label: 'School', type: 'text' },
      { key: 'period', label: 'Period', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  experience: {
    container: 'experienceRepeater',
    fields: [
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'company', label: 'Company', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'period', label: 'Period', type: 'text' },
      { key: 'bullets', label: 'Highlights (one per line)', type: 'textarea-lines' },
    ],
  },
  references: {
    container: 'referencesRepeater',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'position', label: 'Position', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'telegram', label: 'Telegram', type: 'text' },
    ],
  },
  languages: {
    container: 'languagesRepeater',
    fields: [
      { key: 'name', label: 'Language', type: 'text' },
      { key: 'percent', label: 'Fluency %', type: 'number' },
    ],
  },
};

function buildRepeaterRow(section, data = {}) {
  const config = REPEATER_CONFIG[section];
  const row = document.createElement('div');
  row.className = 'repeater-row';

  const grid = document.createElement('div');
  grid.className = 'repeater-row-grid';

  config.fields.forEach((field) => {
    const label = document.createElement('label');
    let valueStr = data[field.key] ?? '';
    if (field.type === 'textarea-lines' && Array.isArray(valueStr)) {
      valueStr = valueStr.join('\n');
    }
    const inputEl =
      field.type === 'textarea' || field.type === 'textarea-lines'
        ? document.createElement('textarea')
        : document.createElement('input');
    if (inputEl.tagName === 'INPUT') inputEl.type = field.type === 'number' ? 'number' : 'text';
    if (inputEl.tagName === 'TEXTAREA') inputEl.rows = 2;
    inputEl.dataset.field = field.key;
    inputEl.value = valueStr;
    label.appendChild(document.createTextNode(field.label));
    label.appendChild(inputEl);
    grid.appendChild(label);
  });

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-row';
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', () => row.remove());

  row.appendChild(grid);
  row.appendChild(removeBtn);
  return row;
}

document.querySelectorAll('.add-row').forEach((btn) => {
  btn.addEventListener('click', () => {
    const section = btn.dataset.target;
    const container = document.getElementById(REPEATER_CONFIG[section].container);
    container.appendChild(buildRepeaterRow(section, {}));
  });
});

function populateRepeater(section, items = []) {
  const container = document.getElementById(REPEATER_CONFIG[section].container);
  container.innerHTML = '';
  items.forEach((item) => container.appendChild(buildRepeaterRow(section, item)));
}

function collectRepeater(section) {
  const config = REPEATER_CONFIG[section];
  const container = document.getElementById(config.container);
  const rows = [...container.querySelectorAll('.repeater-row')];
  return rows.map((row) => {
    const obj = {};
    config.fields.forEach((field) => {
      const input = row.querySelector(`[data-field="${field.key}"]`);
      let val = input.value;
      if (field.type === 'number') val = Number(val) || 0;
      if (field.type === 'textarea-lines') {
        val = val.split('\n').map((l) => l.trim()).filter(Boolean);
      }
      obj[field.key] = val;
    });
    return obj;
  });
}

photoField.addEventListener('change', () => {
  const file = photoField.files[0];
  photoPreview.innerHTML = '';
  if (!file) return;
  const img = document.createElement('img');
  img.src = URL.createObjectURL(file);
  photoPreview.appendChild(img);
});

async function loadProfile() {
  const res = await fetch('/api/profile');
  const p = await res.json();

  document.getElementById('p-name').value = p.name || '';
  document.getElementById('p-title').value = p.title || '';
  document.getElementById('p-bio').value = p.bio || '';
  document.getElementById('p-phone').value = p.phone || '';
  document.getElementById('p-website').value = p.website || '';
  document.getElementById('p-location').value = p.location || '';
  document.getElementById('p-hobbies').value = (p.hobbies || []).join(', ');

  photoPreview.innerHTML = p.photoUrl ? `<img src="${p.photoUrl}" alt="">` : '';

  populateRepeater('skills', p.skills);
  populateRepeater('education', p.education);
  populateRepeater('experience', p.experience);
  populateRepeater('references', p.references);
  populateRepeater('languages', p.languages);
}

profileForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  profileError.hidden = true;
  profileSuccess.hidden = true;

  const fd = new FormData();
  fd.append('name', document.getElementById('p-name').value);
  fd.append('title', document.getElementById('p-title').value);
  fd.append('bio', document.getElementById('p-bio').value);
  fd.append('phone', document.getElementById('p-phone').value);
  fd.append('website', document.getElementById('p-website').value);
  fd.append('location', document.getElementById('p-location').value);

  const hobbies = document
    .getElementById('p-hobbies')
    .value.split(',')
    .map((h) => h.trim())
    .filter(Boolean);
  fd.append('hobbies', JSON.stringify(hobbies));

  fd.append('skills', JSON.stringify(collectRepeater('skills')));
  fd.append('education', JSON.stringify(collectRepeater('education')));
  fd.append('experience', JSON.stringify(collectRepeater('experience')));
  fd.append('references', JSON.stringify(collectRepeater('references')));
  fd.append('languages', JSON.stringify(collectRepeater('languages')));

  if (photoField.files[0]) fd.append('photo', photoField.files[0]);

  try {
    const res = await fetch('/api/profile', { method: 'PUT', body: fd });
    const data = await res.json();
    if (!res.ok) {
      profileError.textContent = data.error || 'Could not save profile';
      profileError.hidden = false;
      return;
    }
    profileSuccess.textContent = 'Profile saved.';
    profileSuccess.hidden = false;
    photoField.value = '';
  } catch (err) {
    profileError.textContent = 'Something went wrong saving the profile.';
    profileError.hidden = false;
  }
});

loadProfile();

// ---------- auth guard ----------
(async function checkAuth() {
  const res = await fetch('/api/session');
  const data = await res.json();
  if (!data.loggedIn) window.location.href = '/admin/index.html';
})();

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/admin/index.html';
});

// ---------- elements ----------
const form = document.getElementById('itemForm');
const itemIdField = document.getElementById('itemId');
const titleField = document.getElementById('title');
const categoryField = document.getElementById('category');
const typeField = document.getElementById('type');
const tagsField = document.getElementById('tags');
const descriptionField = document.getElementById('description');
const mediaField = document.getElementById('media');
const filePreview = document.getElementById('filePreview');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formError = document.getElementById('formError');
const formSuccess = document.getElementById('formSuccess');
const itemList = document.getElementById('itemList');
const itemCount = document.getElementById('itemCount');

let items = [];
let editingId = null;

// ---------- load ----------
async function loadItems() {
  const res = await fetch('/api/portfolio');
  items = (await res.json()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  renderList();
}

function renderList() {
  itemCount.textContent = `(${items.length})`;
  itemList.innerHTML = '';

  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.draggable = true;
    row.dataset.id = item.id;

    row.innerHTML = `
      ${
        item.type === 'video'
          ? `<video class="thumb" src="${item.mediaUrl}" muted></video>`
          : `<img class="thumb" src="${item.mediaUrl}" alt="">`
      }
      <div class="meta">
        <h4>${item.title}</h4>
        <p>${item.category} · ${item.type}${item.tags?.length ? ' · ' + item.tags.join(', ') : ''}</p>
      </div>
      <div class="row-actions">
        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
      </div>
    `;

    row.querySelector('.edit').addEventListener('click', () => startEdit(item));
    row.querySelector('.delete').addEventListener('click', () => deleteItem(item.id));

    // drag & drop reorder
    row.addEventListener('dragstart', () => row.classList.add('dragging'));
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      persistOrder();
    });

    itemList.appendChild(row);
  });
}

itemList.addEventListener('dragover', (e) => {
  e.preventDefault();
  const dragging = itemList.querySelector('.dragging');
  const afterEl = getDragAfterElement(itemList, e.clientY);
  if (!dragging) return;
  if (afterEl == null) {
    itemList.appendChild(dragging);
  } else {
    itemList.insertBefore(dragging, afterEl);
  }
});

function getDragAfterElement(container, y) {
  const rows = [...container.querySelectorAll('.item-row:not(.dragging)')];
  return rows.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

async function persistOrder() {
  const order = [...itemList.querySelectorAll('.item-row')].map((r) => r.dataset.id);
  await fetch('/api/portfolio/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order }),
  });
  loadItems();
}

// ---------- form: create / edit ----------
mediaField.addEventListener('change', () => {
  const file = mediaField.files[0];
  filePreview.innerHTML = '';
  if (!file) return;
  const url = URL.createObjectURL(file);
  const el = file.type.startsWith('video')
    ? Object.assign(document.createElement('video'), { src: url, controls: true })
    : Object.assign(document.createElement('img'), { src: url });
  filePreview.appendChild(el);
});

function startEdit(item) {
  editingId = item.id;
  itemIdField.value = item.id;
  titleField.value = item.title;
  categoryField.value = item.category;
  typeField.value = item.type;
  tagsField.value = (item.tags || []).join(', ');
  descriptionField.value = item.description || '';
  mediaField.required = false;
  filePreview.innerHTML =
    item.type === 'video'
      ? `<video src="${item.mediaUrl}" controls></video>`
      : `<img src="${item.mediaUrl}" alt="">`;

  formTitle.textContent = 'Edit piece';
  submitBtn.textContent = 'Save changes';
  cancelEditBtn.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

cancelEditBtn.addEventListener('click', resetForm);

function resetForm() {
  editingId = null;
  form.reset();
  itemIdField.value = '';
  filePreview.innerHTML = '';
  formTitle.textContent = 'Add new piece';
  submitBtn.textContent = 'Add piece';
  cancelEditBtn.hidden = true;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.hidden = true;
  formSuccess.hidden = true;

  const fd = new FormData(form);
  const url = editingId ? `/api/portfolio/${editingId}` : '/api/portfolio';
  const method = editingId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, { method, body: fd });
    const data = await res.json();
    if (!res.ok) {
      formError.textContent = data.error || 'Something went wrong';
      formError.hidden = false;
      return;
    }
    formSuccess.textContent = editingId ? 'Piece updated.' : 'Piece added.';
    formSuccess.hidden = false;
    resetForm();
    loadItems();
  } catch (err) {
    formError.textContent = 'Upload failed. Check the file and try again.';
    formError.hidden = false;
  }
});

async function deleteItem(id) {
  if (!confirm('Delete this piece? This cannot be undone.')) return;
  await fetch(`/api/portfolio/${id}`, { method: 'DELETE' });
  loadItems();
}

loadItems();
