// models/index.js
// Fichier principal qui initialise et relie tous les modèles Sequelize

const { sequelize } = require('../config/database');

// Import des modèles
const Category = require('./Category');
const Specialite = require('./Specialite');
const Artisan = require('./Artisan');

// Initialisation des modèles avec la connexion Sequelize
const models = {
    Category: Category(sequelize),
    Specialite: Specialite(sequelize),
    Artisan: Artisan(sequelize)
};

// Définition des associations (relations entre tables)
const setupAssociations = () => {
    const { Category, Specialite, Artisan } = models;

    // Une catégorie a plusieurs spécialités (1:n)
    Category.hasMany(Specialite, {
        foreignKey: 'id_categorie',
        as: 'specialites',
        onDelete: 'CASCADE',    
        onUpdate: 'CASCADE'
    });

    // Une spécialité appartient à une catégorie (n:1)
    Specialite.belongsTo(Category, {
        foreignKey: 'id_categorie',
        as: 'categorie'
    });

    // Une spécialité a plusieurs artisans (1:n)
    Specialite.hasMany(Artisan, {
        foreignKey: 'id_specialite',
        as: 'artisans',
        onDelete: 'RESTRICT',   
        onUpdate: 'CASCADE'
    });

    // Un artisan appartient à une spécialité (n:1)
    Artisan.belongsTo(Specialite, {
        foreignKey: 'id_specialite',
        as: 'specialite'
    });

    // Association indirecte : Artisan -> Spécialité -> Catégorie
    Artisan.belongsTo(Category, {
        foreignKey: 'id_specialite',
        targetKey: 'id_categorie',
        through: Specialite,
        as: 'categorie'
    });

    console.log('🔗 Associations des modèles configurées');
};

// Configuration des associations
setupAssociations();

// Fonction utilitaire pour obtenir un modèle par nom
const getModel = (modelName) => {
    if (!models[modelName]) {
        throw new Error(`Modèle "${modelName}" introuvable`);
    }
    return models[modelName];
};

// Fonction pour synchroniser tous les modèles
const syncAllModels = async (options = {}) => {
    try {
        await sequelize.sync(options);
        console.log('✅ Tous les modèles synchronisés avec la base de données');
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation des modèles:', error.message);
        return false;
    }
};

// Fonction pour obtenir les statistiques de la base
const getDatabaseStats = async () => {
    try {
        const stats = {};
        
        // Compter les enregistrements dans chaque table
        for (const [modelName, model] of Object.entries(models)) {
            stats[modelName.toLowerCase()] = await model.count();
        }
        
        return stats;
    } catch (error) {
        console.error('❌ Erreur lors du calcul des statistiques:', error.message);
        return null;
    }
};

module.exports = {
    sequelize,
    models,
    getModel,
    syncAllModels,
    getDatabaseStats,
    
    // Export direct des modèles pour faciliter l'import
    Category: models.Category,
    Specialite: models.Specialite,
    Artisan: models.Artisan
};