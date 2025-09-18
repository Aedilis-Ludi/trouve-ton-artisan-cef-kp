// models/Artisan.js
// Modèle Sequelize pour la table "artisans"

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Artisan = sequelize.define('Artisan', {
        // Clé primaire
        id_artisan: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            comment: 'Identifiant unique de l\'artisan'
        },

        // Nom de l'entreprise (obligatoire)
        nom_entreprise: {
            type: DataTypes.STRING(200),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Le nom de l\'entreprise ne peut pas être vide'
                },
                len: {
                    args: [2, 200],
                    msg: 'Le nom de l\'entreprise doit contenir entre 2 et 200 caractères'
                }
            },
            comment: 'Nom de l\'entreprise ou raison sociale'
        },

        // Nom de l'artisan
        nom_artisan: {
            type: DataTypes.STRING(100),
            allowNull: true,
            validate: {
                len: {
                    args: [2, 100],
                    msg: 'Le nom de l\'artisan doit contenir entre 2 et 100 caractères'
                }
            },
            comment: 'Nom et prénom de l\'artisan'
        },

        // Email (obligatoire et unique)
        email: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: {
                name: 'unique_email',
                msg: 'Cette adresse email est déjà utilisée'
            },
            validate: {
                isEmail: {
                    msg: 'L\'adresse email n\'est pas valide'
                },
                notEmpty: {
                    msg: 'L\'email ne peut pas être vide'
                }
            },
            comment: 'Adresse email de contact'
        },

        // Téléphone 
        telephone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            validate: {
                isValidPhone(value) {
                    if (value && !/^[\d\s\.\-\(\)\+]{10,20}$/.test(value)) {
                        throw new Error('Le numéro de téléphone n\'est pas valide');
                    }
                }
            },
            comment: 'Numéro de téléphone'
        },

        // Adresse complète
        adresse: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Adresse complète de l\'artisan'
        },

        // Code postal
        code_postal: {
            type: DataTypes.STRING(10),
            allowNull: true,
            validate: {
                isValidPostalCode(value) {
                    if (value && !/^\d{5}$/.test(value)) {
                        throw new Error('Le code postal doit contenir 5 chiffres');
                    }
                }
            },
            comment: 'Code postal'
        },

        // Ville
        ville: {
            type: DataTypes.STRING(100),
            allowNull: true,
            validate: {
                len: {
                    args: [0, 100],
                    msg: 'Le nom de la ville ne peut pas dépasser 100 caractères'
                }
            },
            comment: 'Ville'
        },

        // Département
        departement: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Département'
        },

        // Coordonnées GPS
        latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: true,
            validate: {
                min: -90,
                max: 90
            },
            comment: 'Latitude GPS'
        },

        longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: true,
            validate: {
                min: -180,
                max: 180
            },
            comment: 'Longitude GPS'
        },

        // Note moyenne (0 à 5)
        note_moyenne: {
            type: DataTypes.DECIMAL(2, 1),
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
                max: 5,
                isDecimal: true
            },
            comment: 'Note moyenne sur 5 étoiles'
        },

        // Description/présentation
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            validate: {
                len: {
                    args: [0, 2000],
                    msg: 'La description ne peut pas dépasser 2000 caractères'
                }
            },
            comment: 'Description et présentation de l\'artisan'
        },

        // Site web (optionnel)
        site_web: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isUrl: {
                    msg: 'L\'URL du site web n\'est pas valide'
                }
            },
            comment: 'Site web de l\'artisan'
        },

        // Image/photo
        image_url: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'URL de l\'image de profil'
        },

        // Artisan du mois
        est_artisan_du_mois: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Indique si c\'est un artisan du mois'
        },

        // Clé étrangère vers specialites
        id_specialite: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'specialites',
                key: 'id_specialite'
            },
            validate: {
                notNull: {
                    msg: 'Un artisan doit avoir une spécialité'
                },
                isInt: {
                    msg: 'L\'ID de spécialité doit être un nombre entier'
                }
            },
            comment: 'Référence vers la spécialité'
        },

        // Timestamps
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
        tableName: 'artisans',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        
        // Index pour optimiser les recherches
        indexes: [
            {
                fields: ['id_specialite']
            },
            {
                fields: ['ville']
            },
            {
                fields: ['departement']
            },
            {
                fields: ['note_moyenne']
            },
            {
                fields: ['est_artisan_du_mois']
            },
            {
                unique: true,
                fields: ['email']
            }
        ],

        // Hooks
        hooks: {
            beforeCreate: (artisan) => {
                artisan.nom_entreprise = formatName(artisan.nom_entreprise);
                if (artisan.nom_artisan) {
                    artisan.nom_artisan = formatName(artisan.nom_artisan);
                }
                if (artisan.ville) {
                    artisan.ville = formatName(artisan.ville);
                }
                if (artisan.email) {
                    artisan.email = artisan.email.toLowerCase().trim();
                }
            },
            
            beforeUpdate: (artisan) => {
                if (artisan.changed('nom_entreprise')) {
                    artisan.nom_entreprise = formatName(artisan.nom_entreprise);
                }
                if (artisan.changed('nom_artisan') && artisan.nom_artisan) {
                    artisan.nom_artisan = formatName(artisan.nom_artisan);
                }
                if (artisan.changed('ville') && artisan.ville) {
                    artisan.ville = formatName(artisan.ville);
                }
                if (artisan.changed('email')) {
                    artisan.email = artisan.email.toLowerCase().trim();
                }
            }
        },

        // Scopes
        scopes: {
            // Avec spécialité et catégorie
            complete: {
                include: [{
                    association: 'specialite',
                    include: [{
                        association: 'categorie',
                        attributes: ['nom_categorie']
                    }]
                }]
            },

            // Artisans du mois uniquement
            duMois: {
                where: {
                    est_artisan_du_mois: true
                },
                order: [['note_moyenne', 'DESC']]
            },

            // Par note décroissante
            byNote: {
                order: [['note_moyenne', 'DESC']]
            },

            // Par ville
            byVille: (ville) => ({
                where: {
                    ville: ville
                }
            }),

            // Par département
            byDepartement: (departement) => ({
                where: {
                    departement: departement
                }
            }),

            // Par spécialité
            bySpecialite: (specialiteId) => ({
                where: {
                    id_specialite: specialiteId
                }
            }),

            // Note minimum
            withMinNote: (minNote) => ({
                where: {
                    note_moyenne: {
                        [sequelize.Op.gte]: minNote
                    }
                }
            })
        }
    });

    // Méthodes d'instance
    Artisan.prototype.getFormattedAddress = function() {
        const parts = [];
        if (this.adresse) parts.push(this.adresse);
        if (this.code_postal) parts.push(this.code_postal);
        if (this.ville) parts.push(this.ville);
        if (this.departement) parts.push(this.departement);
        return parts.join(', ');
    };

    Artisan.prototype.getStarRating = function() {
        const note = parseFloat(this.note_moyenne);
        const fullStars = Math.floor(note);
        const hasHalfStar = (note % 1) >= 0.5;
        
        return {
            fullStars,
            hasHalfStar,
            emptyStars: 5 - fullStars - (hasHalfStar ? 1 : 0),
            note: note
        };
    };

    // Méthodes statiques
    Artisan.getArtisansDuMois = async function(limit = 3) {
        return await this.scope('duMois').findAll({
            include: [{
                association: 'specialite',
                include: [{
                    association: 'categorie'
                }]
            }],
            limit: limit
        });
    };

    Artisan.search = async function(query, options = {}) {
        const whereClause = {
            [sequelize.Op.or]: [
                { nom_entreprise: { [sequelize.Op.like]: `%${query}%` } },
                { nom_artisan: { [sequelize.Op.like]: `%${query}%` } }
            ]
        };

        return await this.findAll({
            where: whereClause,
            include: [{
                association: 'specialite',
                include: [{
                    association: 'categorie'
                }]
            }],
            order: [['note_moyenne', 'DESC']],
            ...options
        });
    };

    Artisan.getByCategorie = async function(categorieId, options = {}) {
        return await this.findAll({
            include: [{
                association: 'specialite',
                where: { id_categorie: categorieId },
                include: [{
                    association: 'categorie'
                }]
            }],
            order: [['note_moyenne', 'DESC']],
            ...options
        });
    };

    Artisan.getStats = async function() {
        const total = await this.count();
        const parDepartement = await this.findAll({
            attributes: [
                'departement',
                [sequelize.fn('COUNT', sequelize.col('id_artisan')), 'count']
            ],
            group: ['departement'],
            order: [[sequelize.col('count'), 'DESC']]
        });

        const noteMoyenne = await this.findOne({
            attributes: [
                [sequelize.fn('AVG', sequelize.col('note_moyenne')), 'moyenne'],
                [sequelize.fn('MIN', sequelize.col('note_moyenne')), 'minimum'],
                [sequelize.fn('MAX', sequelize.col('note_moyenne')), 'maximum']
            ]
        });

        return {
            total,
            parDepartement,
            notes: noteMoyenne
        };
    };

    return Artisan;
};

// Fonction utilitaire pour formatter les noms
function formatName(name) {
    if (!name) return name;
    
    return name.trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}