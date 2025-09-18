// import-excel-data.js
// Script pour importer les données Excel dans la base MySQL

const XLSX = require('xlsx');
const { sequelize } = require('./config/database');
const { Category, Specialite, Artisan } = require('./models');
require('dotenv').config();

async function importExcelData() {
    try {
        console.log('🚀 Démarrage de l\'import des données Excel...');

        // 1. Lire le fichier Excel
        console.log('📖 Lecture du fichier Excel...');
        const workbook = XLSX.readFile('data.xlsx');
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convertir en JSON
        const data = XLSX.utils.sheet_to_json(sheet);
        console.log(`✅ ${data.length} artisans trouvés dans le fichier Excel`);

        // 2. Analyser les données
        const categories = [...new Set(data.map(item => item['Catégorie']))];
        console.log('📋 Catégories trouvées:', categories);

        // 3. Mapper les catégories existantes ou créer les manquantes
        const categoriesMap = {};
        for (const categorieName of categories) {
            let categorie = await Category.findOne({ 
                where: { nom_categorie: categorieName } 
            });
            
            if (!categorie) {
                console.log(`➕ Création de la catégorie: ${categorieName}`);
                categorie = await Category.create({ nom_categorie: categorieName });
            }
            
            categoriesMap[categorieName] = categorie;
        }

        // 4. Traiter les spécialités
        const specialitesMap = {};
        for (const row of data) {
            const specialiteName = row['Spécialité'];
            const categorieName = row['Catégorie'];
            
            if (!specialitesMap[specialiteName]) {
                let specialite = await Specialite.findOne({
                    where: { nom_specialite: specialiteName }
                });
                
                if (!specialite) {
                    console.log(`➕ Création de la spécialité: ${specialiteName}`);
                    specialite = await Specialite.create({
                        nom_specialite: specialiteName,
                        id_categorie: categoriesMap[categorieName].id_categorie
                    });
                }
                
                specialitesMap[specialiteName] = specialite;
            }
        }

        // 5. Importer les artisans
        let importCount = 0;
        let updateCount = 0;
        let skipCount = 0;

        for (const row of data) {
            try {
                const email = row['Email'];
                
                // Vérifier si l'artisan existe déjà (par email)
                let artisan = await Artisan.findOne({ where: { email } });
                
                const artisanData = {
                    nom_entreprise: row['Nom'],
                    nom_artisan: null, // Pas dans Excel, on laisse null
                    email: email,
                    telephone: null, // Pas dans Excel
                    adresse: null, // Pas dans Excel
                    code_postal: null, // Pas dans Excel
                    ville: row['Ville'],
                    departement: getDepartementFromVille(row['Ville']),
                    latitude: null,
                    longitude: null,
                    note_moyenne: parseFloat(row['Note']) || 0,
                    description: row['A propos'] || '',
                    site_web: row['Site Web'] || null,
                    image_url: null, // À ajouter manuellement plus tard
                    est_artisan_du_mois: row['Top'] === true || row['Top'] === 'true',
                    id_specialite: specialitesMap[row['Spécialité']].id_specialite
                };

                if (artisan) {
                    // Mettre à jour l'artisan existant
                    await artisan.update(artisanData);
                    updateCount++;
                    console.log(`🔄 Mis à jour: ${artisanData.nom_entreprise}`);
                } else {
                    // Créer un nouvel artisan
                    artisan = await Artisan.create(artisanData);
                    importCount++;
                    console.log(`✅ Importé: ${artisanData.nom_entreprise}`);
                }

            } catch (error) {
                console.error(`❌ Erreur avec ${row['Nom']}:`, error.message);
                skipCount++;
            }
        }

        // 6. Résumé
        console.log('\n📊 RÉSUMÉ DE L\'IMPORT:');
        console.log(`✅ Artisans importés: ${importCount}`);
        console.log(`🔄 Artisans mis à jour: ${updateCount}`);
        console.log(`⚠️ Artisans ignorés: ${skipCount}`);
        console.log(`📋 Total traités: ${importCount + updateCount + skipCount}`);

        // 7. Statistiques finales
        const totalArtisans = await Artisan.count();
        const totalSpecialites = await Specialite.count();
        const totalCategories = await Category.count();
        
        console.log('\n📈 STATISTIQUES FINALES:');
        console.log(`👥 Total artisans: ${totalArtisans}`);
        console.log(`🛠️ Total spécialités: ${totalSpecialites}`);
        console.log(`📁 Total catégories: ${totalCategories}`);

        // 8. Artisans du mois
        const artisansDuMois = await Artisan.count({ 
            where: { est_artisan_du_mois: true } 
        });
        console.log(`⭐ Artisans du mois: ${artisansDuMois}`);

        console.log('\n🎉 Import terminé avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
    } finally {
        await sequelize.close();
    }
}

// Fonction utilitaire pour déterminer le département selon la ville
function getDepartementFromVille(ville) {
    const departementsMap = {
        'Lyon': 'Rhône',
        'Villeurbanne': 'Rhône',
        'Grenoble': 'Isère',
        'Saint-Étienne': 'Loire',
        'Annecy': 'Haute-Savoie',
        'Chambéry': 'Savoie',
        'Valence': 'Drôme',
        'Clermont-Ferrand': 'Puy-de-Dôme',
        'Montélimar': 'Drôme',
        'Bourg-en-Bresse': 'Ain',
        'Moulins': 'Allier',
        'Privas': 'Ardèche',
        'Aurillac': 'Cantal',
        'Le Puy-en-Velay': 'Haute-Loire'
    };
    
    return departementsMap[ville] || 'Auvergne-Rhône-Alpes';
}

// Fonction utilitaire pour nettoyer les données
function cleanString(str) {
    if (!str) return null;
    return str.toString().trim();
}

// Validation des données avant import
function validateArtisanData(data) {
    const errors = [];
    
    if (!data.nom_entreprise) errors.push('Nom entreprise manquant');
    if (!data.email) errors.push('Email manquant');
    if (!data.ville) errors.push('Ville manquante');
    if (data.note_moyenne < 0 || data.note_moyenne > 5) {
        errors.push('Note invalide (doit être entre 0 et 5)');
    }
    
    return errors;
}

// Lancement du script
if (require.main === module) {
    importExcelData();
}

module.exports = { importExcelData };