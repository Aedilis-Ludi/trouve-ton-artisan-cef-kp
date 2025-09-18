-- Script d’alimentation de la base

USE trouve_ton_artisan;

-- Catégories
INSERT INTO categories (nom, description) VALUES
('Bâtiment', 'Tous les métiers du bâtiment et travaux publics'),
('Alimentation', 'Métiers de bouche et commerces alimentaires'),
('Services', 'Prestations de services aux particuliers et entreprises'),
('Fabrication', 'Métiers liés à la production artisanale');

-- Spécialités
INSERT INTO specialites (nom, description, categorie_id) VALUES
('Menuiserie', 'Fabrication et pose d’éléments en bois', 1),
('Plomberie', 'Travaux de plomberie et chauffage', 1),
('Électricité', 'Installations et réparations électriques', 1),
('Maçonnerie', 'Construction et rénovation de structures', 1),
('Boulangerie', 'Fabrication et vente de pains et viennoiseries', 2),
('Pâtisserie', 'Création de gâteaux et desserts artisanaux', 2),
('Coiffure', 'Salon de coiffure et soins capillaires', 3),
('Serrurerie', 'Installation et réparation de serrures', 3),
('Céramique', 'Fabrication artisanale de céramiques', 4),
('Textile', 'Création artisanale de vêtements et tissus', 4);

-- Artisans
INSERT INTO artisans (nom_artisan, nom_entreprise, email, telephone, adresse_complete, ville, departement, site_web, description, image_url, note_moyenne, est_artisan_du_mois, specialite_id) VALUES
('Jean Dupont', 'Menuiserie Dupont', 'contact@menuiseriedupont.fr', '0612345678', '12 rue des Bois', 'Lyon', '69', 'http://menuiseriedupont.fr', 'Menuisier expérimenté depuis 20 ans.', '/images/artisans/menuiserie.jpg', 4.5, TRUE, 1),
('Marie Martin', 'Plomberie Martin', 'marie.martin@plomberie.fr', '0623456789', '25 avenue du Rhône', 'Grenoble', '38', NULL, 'Plombière spécialisée en installation et dépannage.', '/images/artisans/plomberie.jpg', 4.2, FALSE, 2),
('Pierre Dubois', 'Boulangerie du Pont', 'contact@boulangeriedupont.fr', '0634567890', '5 place du Marché', 'Clermont-Ferrand', '63', 'http://boulangeriedupont.fr', 'Boulanger passionné, pains artisanaux bio.', '/images/artisans/boulangerie.jpg', 4.8, TRUE, 5),
('Sophie Leroy', 'Salon Sophie Coiffure', 'contact@sophiecoiffure.fr', '0645678901', '8 rue des Fleurs', 'Annecy', '74', NULL, 'Salon de coiffure mixte moderne et convivial.', '/images/artisans/coiffure.jpg', 4.6, FALSE, 7);

-- Exemple de contact
INSERT INTO contacts (artisan_id, nom, email, objet, message) VALUES
(1, 'Client Test', 'client@example.com', 'Demande de devis', 'Bonjour, je souhaiterais un devis pour une nouvelle fenêtre. Merci.');
