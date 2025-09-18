// models/Category.js
// Modèle Sequelize pour la table "categories"

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Category = sequelize.define('Category', {
        // Clé primaire
        id_categorie: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            comment: 'Identifiant unique de la catégorie'
        },

        // Nom de la catégorie
        nom_categorie: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: {
                name: 'unique_nom_categorie',
                msg: 'Cette catégorie existe déjà'
            },
            validate: {
                notEmpty: {
                    msg: 'Le nom de la catégorie ne peut pas être vide'
                },
                len: {
                    args: [2, 100],
                    msg: 'Le nom doit contenir entre 2 et 100 caractères'
                },
                isValidName(value) {
                    if (!/^[A-Za-zÀ-ÿ\s\-']+$/.test(value)) {
                        throw new Error('Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes');
                    }
                }
            },
            comment: 'Nom de la catégorie (Bâtiment, Services, etc.)'
        },

        // Timestamps automatiques
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: 'Date de création'
        },

        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: 'Date de dernière modification'
        }
    }, {
        // Options du modèle
        tableName: 'categories',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        
        // Index pour optimiser les recherches
        indexes: [
            {
                unique: true,
                fields: ['nom_categorie']
            }
        ],

        // Hooks (actions automatiques)
        hooks: {
            // Avant création : nettoyer et formater le nom
            beforeCreate: (category) => {
                category.nom_categorie = formatCategoryName(category.nom_categorie);
            },
            
            // Avant mise à jour : nettoyer et formater le nom
            beforeUpdate: (category) => {
                if (category.changed('nom_categorie')) {
                    category.nom_categorie = formatCategoryName(category.nom_categorie);
                }
            }
        },

        // Scopes pour des requêtes prédéfinies
        scopes: {
            // Avec le nombre de spécialités
            withSpecialitesCount: {
                include: [{
                    association: 'specialites',
                    attributes: []
                }],
                attributes: {
                    include: [
                        [sequelize.fn('COUNT', sequelize.col('specialites.id_specialite')), 'nb_specialites']
                    ]
                },
                group: ['Category.id_categorie']
            },

            // Avec toutes les spécialités
            withSpecialites: {
                include: [{
                    association: 'specialites',
                    attributes: ['id_specialite', 'nom_specialite']
                }]
            },

            // Ordre alphabétique
            ordered: {
                order: [['nom_categorie', 'ASC']]
            }
        }
    });

    // Méthodes d'instance (sur une catégorie spécifique)
    Category.prototype.getNbSpecialites = async function() {
        const count = await this.countSpecialites();
        return count;
    };

    Category.prototype.getNbArtisans = async function() {
        const specialites = await this.getSpecialites({
            include: [{
                association: 'artisans',
                attributes: []
            }]
        });
        
        let totalArtisans = 0;
        for (const specialite of specialites) {
            totalArtisans += await specialite.countArtisans();
        }
        
        return totalArtisans;
    };

    // Méthodes statiques (sur le modèle)
    Category.getWithStats = async function() {
        return await this.findAll({
            include: [{
                association: 'specialites',
                include: [{
                    association: 'artisans',
                    attributes: []
                }],
                attributes: []
            }],
            attributes: [
                'id_categorie',
                'nom_categorie',
                [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('specialites.id_specialite'))), 'nb_specialites'],
                [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('specialites.artisans.id_artisan'))), 'nb_artisans']
            ],
            group: ['Category.id_categorie'],
            order: [['nom_categorie', 'ASC']]
        });
    };

    Category.findByName = async function(name) {
        return await this.findOne({
            where: {
                nom_categorie: name
            }
        });
    };

    return Category;
};

// Fonction utilitaire pour formatter le nom de catégorie
function formatCategoryName(name) {
    if (!name) return name;
    
    // Nettoyer les espaces
    name = name.trim();
    
    // Première lettre en majuscule
    name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    
    return name;
}