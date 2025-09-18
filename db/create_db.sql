-- Script de création de la base "trouve_ton_artisan"


DROP DATABASE IF EXISTS trouve_ton_artisan;
CREATE DATABASE trouve_ton_artisan CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE trouve_ton_artisan;

=
-- Table : categories

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    description TEXT
);


-- Table : specialites

CREATE TABLE specialites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    categorie_id INT NOT NULL,
    FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE CASCADE
);


-- Table : artisans

CREATE TABLE artisans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom_artisan VARCHAR(100),
    nom_entreprise VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    telephone VARCHAR(50),
    adresse_complete TEXT,
    ville VARCHAR(100),
    departement VARCHAR(50),
    site_web VARCHAR(255),
    description TEXT,
    image_url VARCHAR(255),
    note_moyenne DECIMAL(2,1) DEFAULT 0,
    est_artisan_du_mois BOOLEAN DEFAULT FALSE,
    specialite_id INT NOT NULL,
    FOREIGN KEY (specialite_id) REFERENCES specialites(id) ON DELETE CASCADE
);


-- Table : contacts

CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    artisan_id INT NOT NULL,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    objet VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artisan_id) REFERENCES artisans(id) ON DELETE CASCADE
);
