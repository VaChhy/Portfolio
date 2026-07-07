require('dotenv').config();
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'portfolio.json');
const PROFILE_FILE = path.join(__dirname, 'data', 'profile.json');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');

const DEFAULT_PROFILE = {
  name: 'Chhith Vachhy',
  title: 'Graphic Designer',
  bio: "Ambitious graphic designer with a background in IT and software development. Skilled in building brand identity, print, and digital assets, with hands-on experience translating concepts into polished designs using the Adobe Suite. Eager to keep growing professionally while contributing to real-world creative and technical challenges.",
  phone: '+855 98 966 486',
  website: 'https://t.me/chhee07',
  location: '467 5MC, Phnom Penh',
  photoUrl: '',
  skills: [
    { name: 'Adobe Photoshop', level: 90 },
    { name: 'Adobe Illustrator', level: 85 },
    { name: 'Microsoft Word', level: 75 },
    { name: 'Microsoft PowerPoint', level: 90 },
    { name: 'HTML5 / CSS3', level: 40 },
  ],
  education: [
    {
      degree: 'Management Information Systems',
      school: 'SETEC Institute',
      period: '2021 — Present',
      description:
        'Skilled in business technology solutions, data analysis, and IT systems optimization. Proficient in SQL, ERP systems, and Power BI. Experienced in developing cost-effective tech solutions for Cambodian businesses.',
    },
    {
      degree: 'High School — Bac II',
      school: 'Pouk High School',
      period: '2017 — 2020',
      description: 'Finished Bac II at Pouk High School.',
    },
  ],
  experience: [
    {
      role: 'Graphic Designer',
      company: 'Loma Technology',
      location: 'Phnom Penh',
      period: '2024 — Present',
      bullets: [
        'Created logos, game posters, brochures & digital assets while maintaining brand consistency',
        'Translated concepts into designs using the Adobe Suite (Photoshop, Illustrator, InDesign)',
        'Delivered multiple projects on deadline with precision',
      ],
    },
    {
      role: 'Image Editor',
      company: 'Laudert Media',
      location: 'Phnom Penh',
      period: '2023 — 2024',
      bullets: [
        'Enhanced and retouched images for media campaigns, ensuring high visual standards and alignment with client expectations',
        'Used advanced photo editing techniques to correct color, lighting, and composition',
        'Worked closely with the creative team to maintain a cohesive visual style across all projects',
      ],
    },
    {
      role: 'IT Support & Data Entry',
      company: 'Sea Games (Short-Term Project)',
      location: 'Phnom Penh',
      period: '2023',
      bullets: [
        'Provided technical support to staff and participants, troubleshooting hardware and software issues',
        'Managed accurate data entry and database maintenance, improving efficiency in reporting',
        'Assisted in the setup and maintenance of IT infrastructure during the event',
      ],
    },
  ],
  references: [
    {
      name: 'Touch Menghongly',
      position: 'Supervisor at Media',
      phone: '+855 68 256 168',
      telegram: '@Billy31xx',
    },
  ],
  languages: [
    { name: 'Khmer', percent: 100 },
    { name: 'English', percent: 60 },
  ],
  hobbies: ['Traveling', 'Gaming', 'Music', 'Camping', 'Editing'],
};

if (!fs.existsSync(PROFILE_FILE)) {
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(DEFAULT_PROFILE, null, 2));
}

// ---------- helpers ----------
function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function readProfile() {
  return JSON.parse(fs.readFileSync(PROFILE_FILE, 'utf-8'));
}
function writeProfile(profile) {
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(profile, null, 2));
}

// ---------- middleware ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-this-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 }, // 8 hours
  })
);
// guard the dashboard HTML itself server-side (belt & suspenders,
// on top of the client-side redirect in admin-dashboard.js)
app.get('/admin/dashboard.html', (req, res, next) => {
  if (req.session && req.session.loggedIn) return next();
  return res.redirect('/admin/index.html');
});

app.use(express.static(path.join(__dirname, 'public')));

function requireAuth(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  return res.status(401).json({ error: 'Not authenticated' });
}

// ---------- file upload (multer) ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|webm|mov/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) return cb(null, true);
    cb(new Error('Unsupported file type'));
  },
});

// ---------- auth routes ----------
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USER;
  const adminHash = process.env.ADMIN_PASS_HASH;

  if (!adminUser || !adminHash) {
    return res.status(500).json({ error: 'Admin account not configured on server' });
  }
  if (username !== adminUser) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const match = await bcrypt.compare(password || '', adminHash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  req.session.loggedIn = true;
  req.session.username = username;
  res.json({ success: true });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/api/session', (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.loggedIn) });
});

// ---------- profile / resume routes ----------
app.get('/api/profile', (req, res) => {
  res.json(readProfile());
});

app.put('/api/profile', requireAuth, upload.single('photo'), (req, res) => {
  const profile = readProfile();
  const body = req.body;

  const arrayFields = ['skills', 'education', 'experience', 'references', 'languages', 'hobbies'];
  arrayFields.forEach((field) => {
    if (body[field] !== undefined) {
      try {
        profile[field] = JSON.parse(body[field]);
      } catch {
        // leave existing value if malformed
      }
    }
  });

  ['name', 'title', 'bio', 'phone', 'website', 'location'].forEach((field) => {
    if (body[field] !== undefined) profile[field] = body[field];
  });

  if (req.file) {
    if (profile.photoUrl) {
      const oldPath = path.join(__dirname, 'public', profile.photoUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    profile.photoUrl = `/uploads/${req.file.filename}`;
  }

  writeProfile(profile);
  res.json(profile);
});

// ---------- public portfolio routes ----------
app.get('/api/portfolio', (req, res) => {
  const data = readData().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  res.json(data);
});

app.get('/api/portfolio/:id', (req, res) => {
  const item = readData().find((p) => p.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

// ---------- admin (protected) routes ----------
app.post('/api/portfolio', requireAuth, upload.single('media'), (req, res) => {
  const { title, category, type, description, tags } = req.body;
  if (!req.file) return res.status(400).json({ error: 'Media file is required' });

  const data = readData();
  const newItem = {
    id: uuidv4(),
    title: title || 'Untitled',
    category: category || 'General',
    type: type || (req.file.mimetype.startsWith('video') ? 'video' : 'image'),
    mediaUrl: `/uploads/${req.file.filename}`,
    description: description || '',
    tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    order: data.length,
    createdAt: new Date().toISOString(),
  };
  data.push(newItem);
  writeData(data);
  res.status(201).json(newItem);
});

app.put('/api/portfolio/:id', requireAuth, upload.single('media'), (req, res) => {
  const data = readData();
  const idx = data.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const { title, category, type, description, tags, order } = req.body;
  const existing = data[idx];

  if (req.file) {
    // remove old file
    const oldPath = path.join(__dirname, 'public', existing.mediaUrl);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    existing.mediaUrl = `/uploads/${req.file.filename}`;
  }

  existing.title = title ?? existing.title;
  existing.category = category ?? existing.category;
  existing.type = type ?? existing.type;
  existing.description = description ?? existing.description;
  if (tags !== undefined) {
    existing.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
  }
  if (order !== undefined) existing.order = Number(order);

  data[idx] = existing;
  writeData(data);
  res.json(existing);
});

app.delete('/api/portfolio/:id', requireAuth, (req, res) => {
  const data = readData();
  const idx = data.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const [removed] = data.splice(idx, 1);
  const filePath = path.join(__dirname, 'public', removed.mediaUrl);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  writeData(data);
  res.json({ success: true });
});

// reorder items (drag/drop support)
app.post('/api/portfolio/reorder', requireAuth, (req, res) => {
  const { order } = req.body; // array of ids in new order
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array of ids' });
  const data = readData();
  order.forEach((id, index) => {
    const item = data.find((p) => p.id === id);
    if (item) item.order = index;
  });
  writeData(data);
  res.json({ success: true });
});

// error handler for multer errors
app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message });
  next();
});

app.listen(PORT, () => {
  console.log(`Portfolio server running at http://localhost:${PORT}`);
  console.log(`Admin panel at http://localhost:${PORT}/admin`);
});
