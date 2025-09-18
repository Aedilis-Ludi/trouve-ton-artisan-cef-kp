// models/Specialite.js
// Modèle Sequelize pour la table "specialites"

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Specialite = sequelize.define('Specialite', {
        // Clé primaire
        id_specialite: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            comment: 'Identifiant unique de la spécialité'
        },

        // Nom de la spécialité
        nom_specialite: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Le nom de la spécialité ne peut pas être vide'
                },
                len: {
                    args: [2, 100],
                    msg: 'Le nom doit contenir entre 2 et 100 caractères'
                },
                isValidName(value) {
                    if (!/^[A-Za-zÀ-ÿ\s\-'\/]+$/.test(value)) {
                        throw new Error('Le nom ne peut contenir que des lettres, espaces, tirets, apostrophes et barres obliques');
                    }
                }
            },
            comment: 'Nom de la spécialité (Menuiserie, Plomberie, etc.)'
        },

        // Clé étrangère vers categories
        id_categorie: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'categories',
                key: 'id_categorie'
            },
            validate: {
                notNull: {
                    msg: 'Une spécialité doit appartenir à une catégorie'
                },
                isInt: {
                    msg: 'L\'ID de catégorie doit être un nombre entier'
                }
            },
            comment: 'Référence vers la catégorie parente'
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
        tableName: 'specialites',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        
        // Index pour optimiser les recherches
        indexes: [
            {
                fields: ['id_categorie']
            },
            {
                fields: ['nom_specialite']
            },
            {
                unique: true,
                fields: ['nom_specialite', 'id_categorie'],
                name: 'unique_specialite_par_categorie'
            }
        ],

        // Hooks 
        hooks: {
            // Avant création : nettoyer et formater le nom
            beforeCreate: (specialite) => {
                specialite.nom_specialite = formatSpecialiteName(specialite.nom_specialite);
            },
            
            // Avant mise à jour : nettoyer et formater le nom
            beforeUpdate: (specialite) => {
                if (specialite.changed('nom_specialite')) {
                    specialite.nom_specialite = formatSpecialiteName(specialite.nom_specialite);
                }
            }
        },

        // Scopes pour des requêtes prédéfinies
        scopes: {
            // Avec la catégorie parente
            withCategorie: {
                include: [{
                    association: 'categorie',
                    attributes: ['id_categorie', 'nom_categorie']
                }]
            },

            // Avec le nombre d'artisans
            withArtisansCount: {
                include: [{
                    association: 'artisans',
                    attributes: []
                }],
                attributes: {
                    include: [
                        [sequelize.fn('COUNT', sequelize.col('artisans.id_artisan')), 'nb_artisans']
                    ]
                },
                group: ['Specialite.id_specialite']
            },

            // Avec tous les artisans
            withArtisans: {
                include: [{
                    association: 'artisans',
                    attributes: ['id_artisan', 'nom_entreprise', 'nom_artisan', 'ville', 'note_moyenne']
                }]
            },

            // Par catégorie
            byCategorie: (categorieId) => ({
                where: {
                    id_categorie: categorieId
                }
            }),

            // Ordre alphabétique
            ordered: {
                order: [['nom_specialite', 'ASC']]
            }
        }
    });


    Specialite.prototype.getNbArtisans = async function() {
        const count = await this.countArtisans();
        return count;
    };

    Specialite.prototype.getArtisansDuMois = async function() {
        return await this.getArtisans({
            where: {
                est_artisan_du_mois: true
            },
            order: [['note_moyenne', 'DESC']]
        });
    };

    Specialite.prototype.getMeilleursArtisans = async function(limit = 5) {
        return await this.getArtisans({
            order: [['note_moyenne', 'DESC']],
            limit: limit
        });
    };


    Specialite.getByCategorie = async function(categorieId) {
        return await this.findAll({
            where: {
                id_categorie: categorieId
            },
            include: [{
                association: 'categorie',
                attributes: ['nom_categorie']
            }],
            order: [['nom_specialite', 'ASC']]
        });
    };

    Specialite.getWithStats = async function(categorieId = null) {
        const whereClause = categorieId ? { id_categorie: categorieId } : {};
        
        return await this.findAll({
            where: whereClause,
            include: [
                {
                    association: 'categorie',
                    attributes: ['nom_categorie']
                },
                {
                    association: 'artisans',
                    attributes: []
                }
            ],
            attributes: [
                'id_specialite',
                'nom_specialite',
                'id_categorie',
                [sequelize.fn('COUNT', sequelize.col('artisans.id_artisan')), 'nb_artisans'],
                [sequelize.fn('AVG', sequelize.col('artisans.note_moyenne')), 'note_moyenne_specialite']
            ],
            group: ['Specialite.id_specialite', 'categorie.id_categorie'],
            order: [['nom_specialite', 'ASC']]
        });
    };

    Specialite.findByName = async function(name, categorieId = null) {
        const whereClause = { nom_specialite: name };
        if (categorieId) {
            whereClause.id_categorie = categorieId;
        }
        
        return await this.findOne({
            where: whereClause,
            include: [{
                association: 'categorie',
                attributes: ['nom_categorie']
            }]
        });
    };

    Specialite.search = async function(query) {
        return await this.findAll({
            where: {
                nom_specialite: {
                    [sequelize.Op.like]: `%${query}%`
                }
            },
            include: [{
                association: 'categorie',
                attributes: ['nom_categorie']
            }],
            order: [['nom_specialite', 'ASC']]
        });
    };

    return Specialite;
};


function formatSpecialiteName(name) {
    if (!name) return name;
    
    // Nettoyer les espaces
    name = name.trim();
    
    // Première lettre en majuscule
    name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    
    return name;
}