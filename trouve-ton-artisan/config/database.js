// config/database.js
// Configuration de la connexion à la base de données MySQL

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuration de la connexion Sequelize
const sequelize = new Sequelize(
    process.env.DB_NAME,     // trouve_ton_artisan
    process.env.DB_USER,     // root
    process.env.DB_PASSWORD, 
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        
        // Configuration du pool de connexions
        pool: {
            max: 10,        // Maximum 10 connexions simultanées
            min: 0,         // Minimum 0 connexions
            acquire: 30000, // Timeout pour obtenir une connexion 
            idle: 10000     // Temps avant fermeture d'une connexion inactive 
        },
        
        // Options MySQL spécifiques
        dialectOptions: {
            charset: 'utf8mb4',
            supportBigNumbers: true,
            bigNumberStrings: true,
            dateStrings: true,
            typeCast: true
        },
        
        // Timezone
        timezone: '+01:00' // Europe/Paris
    }
);

// Test de la connexion à la base de données
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connexion à MySQL réussie !');
    } catch (error) {
        console.error('❌ Erreur de connexion à MySQL:', error.message);
        
        // Messages d'erreur plus explicites
        if (error.message.includes('ECONNREFUSED')) {
            console.error('💡 Vérifiez que WAMP/MySQL est démarré');
        }
        if (error.message.includes('Unknown database')) {
            console.error('💡 Vérifiez que la base "trouve_ton_artisan" existe');
        }
        if (error.message.includes('Access denied')) {
            console.error('💡 Vérifiez vos identifiants MySQL dans .env');
        }
    }
};

// Synchronisation des modèles (création/mise à jour des tables)
const syncDatabase = async (force = false) => {
    try {
        await sequelize.sync({ 
            force,  
            alter: !force 
        });
        
        if (force) {
            console.log('🔄 Base de données synchronisée (tables recréées)');
        } else {
            console.log('✅ Base de données synchronisée');
        }
    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation:', error.message);
    }
};

module.exports = {
    sequelize,
    testConnection,
    syncDatabase
};