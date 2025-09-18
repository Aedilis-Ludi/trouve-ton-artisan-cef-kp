Trouve ton artisan 

Plateforme web permettant de rechercher et contacter des artisans de la région Auvergne-Rhône-Alpes.
Architecture front React + API Node/Express + MySQL (Sequelize), conforme mobile-first, WCAG 2.1 AA et bonnes pratiques de sécurité.


Structure du projet
.
├── backend/       → API Node.js / Express
├── frontend/      → Application React
├── db/            → Scripts SQL (création + alimentation)
└── README.md      → Documentation du projet


Prérequis

Node.js  & npm 9+
MySQL 8.x 
Accès SMTP 
Git 

Installation

Cloner le projet :
git clone https://github.com/Aedilis-Ludi/trouve-ton-artisan.git
cd trouve-ton-artisan

Installer les dépendances :
cd backend && npm install
cd ../frontend && npm install

Base de données
Scripts SQL présents dans db/ :

 create_db.sql → création de la base et des tables
 insert_data.sql → jeu de données d’exemple

Exécution :
mysql -u root -p < db/create_db.sql
mysql -u root -p trouve-ton-artisan-cef-kp < db/insert_data.sql

Lancer le projet
Backend API
 cd backend
 npm run dev   # mode développement
 npm start     # mode production

Frontend React
cd frontend
npm start     # lancement en développement (http://localhost:3000)
npm run build # build de production 



Sécurité mise en place
Helmet → protection des en-têtes HTTP 
CORS → autorisation uniquement des origines définies
Rate limiting → limite de requêtes 
Validation & sanitation → express-validator + nettoyage des entrées
Logs sécurisés → détection de motifs suspects (XSS, SQLi)
Erreurs uniformisées → messages clairs sans info sensible

Accessibilité (WCAG 2.1)
Navigation clavier + focus visible
Structure sémantique (header, main, footer)
Texte alternatif pour les images
Couleurs contrastées 
Compatible mobile-first

API principale
GET /api/categories → liste des catégories
GET /api/artisans → liste des artisans
GET /api/artisans/:id → détail d’un artisan
GET /api/artisans/du-mois → artisans du mois
GET /api/artisans/search?q= → recherche
POST /api/contact/:id → envoyer un message à un artisan

Contenu du repository GitHub
Code backend et frontend
Scripts SQL (db/create_db.sql, db/insert_data.sql)
README.md (ce fichier)