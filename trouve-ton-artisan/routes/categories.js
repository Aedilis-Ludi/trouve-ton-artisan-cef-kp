// routes/categories.js
// Routes pour la gestion des catégories

const express = require('express');
const { Category, Specialite, Artisan } = require('../models');
const { validateId, handleValidationErrors } = require('../middleware/security');

const router = express.Router();


// GET /api/categories - Liste de toutes les catégories

router.get('/', async (req, res) => {
    try {
        const { with_stats = false } = req.query;
        
        let categories;
        
        if (with_stats === 'true') {
            // Avec statistiques (nombre de spécialités et artisans)
            categories = await Category.getWithStats();
            
            const formattedCategories = categories.map(cat => ({
                id: cat.id_categorie,
                nom: cat.nom_categorie,
                statistiques: {
                    nb_specialites: parseInt(cat.getDataValue('nb_specialites')) || 0,
                    nb_artisans: parseInt(cat.getDataValue('nb_artisans')) || 0
                }
            }));
            
            res.json({
                success: true,
                data: formattedCategories,
                message: `${formattedCategories.length} catégorie(s) trouvée(s) avec statistiques`
            });
            
        } else {
            // Version simple
            categories = await Category.findAll({
                order: [['nom_categorie', 'ASC']]
            });
            
            const formattedCategories = categories.map(cat => ({
                id: cat.id_categorie,
                nom: cat.nom_categorie
            }));
            
            res.json({
                success: true,
                data: formattedCategories,
                message: `${formattedCategories.length} catégorie(s) trouvée(s)`
            });
        }

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des catégories:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des catégories',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


// GET /api/categories/stats/general - Statistiques générales des catégories

router.get('/stats/general', async (req, res) => {
    try {
        const stats = await Category.getWithStats();
        
        const totalArtisans = stats.reduce((total, cat) => {
            return total + (parseInt(cat.getDataValue('nb_artisans')) || 0);
        }, 0);
        
        const totalSpecialites = stats.reduce((total, cat) => {
            return total + (parseInt(cat.getDataValue('nb_specialites')) || 0);
        }, 0);
        
        const repartition = stats.map(cat => ({
            categorie: cat.nom_categorie,
            nb_specialites: parseInt(cat.getDataValue('nb_specialites')) || 0,
            nb_artisans: parseInt(cat.getDataValue('nb_artisans')) || 0,
            pourcentage_artisans: totalArtisans > 0 ? 
                Math.round(((parseInt(cat.getDataValue('nb_artisans')) || 0) / totalArtisans) * 100) : 0
        })).sort((a, b) => b.nb_artisans - a.nb_artisans);

        res.json({
            success: true,
            data: {
                resume: {
                    nb_categories: stats.length,
                    nb_specialites_total: totalSpecialites,
                    nb_artisans_total: totalArtisans
                },
                repartition_par_categorie: repartition
            }
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


// GET /api/categories/search - Recherche par nom via query

router.get('/search', async (req, res) => {
    try {
        const { name } = req.query;
        
        if (!name || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Le paramètre "name" doit contenir au moins 2 caractères',
                usage: 'GET /api/categories/search?name=batiment'
            });
        }

        const categorie = await Category.findByName(name.trim());
        
        if (!categorie) {
            return res.status(404).json({
                success: false,
                message: 'Catégorie introuvable',
                code: 'CATEGORY_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: {
                id: categorie.id_categorie,
                nom: categorie.nom_categorie
            }
        });

    } catch (error) {
        console.error('❌ Erreur lors de la recherche de catégorie:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la recherche',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


// GET /api/categories/:id - Détail d'une catégorie

router.get('/:id',
    validateId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            
            const categorie = await Category.findByPk(id, {
                include: [{
                    model: Specialite,
                    as: 'specialites',
                    attributes: ['id_specialite', 'nom_specialite'],
                    order: [['nom_specialite', 'ASC']]
                }]
            });

            if (!categorie) {
                return res.status(404).json({
                    success: false,
                    message: 'Catégorie introuvable',
                    code: 'CATEGORY_NOT_FOUND'
                });
            }

            // Calculer le nombre d'artisans pour cette catégorie
            const nbArtisans = await categorie.getNbArtisans();

            const categorieComplete = {
                id: categorie.id_categorie,
                nom: categorie.nom_categorie,
                specialites: categorie.specialites.map(spec => ({
                    id: spec.id_specialite,
                    nom: spec.nom_specialite
                })),
                statistiques: {
                    nb_specialites: categorie.specialites.length,
                    nb_artisans: nbArtisans
                },
                dates: {
                    cree_le: categorie.created_at,
                    modifie_le: categorie.updated_at
                }
            };

            res.json({
                success: true,
                data: categorieComplete
            });

        } catch (error) {
            console.error('❌ Erreur lors de la récupération de la catégorie:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de la catégorie',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);


// GET /api/categories/:id/specialites - Spécialités d'une catégorie

router.get('/:id/specialites',
    validateId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { with_artisans_count = false } = req.query;
            
            const categorie = await Category.findByPk(id);
            if (!categorie) {
                return res.status(404).json({
                    success: false,
                    message: 'Catégorie introuvable',
                    code: 'CATEGORY_NOT_FOUND'
                });
            }

            let specialites;
            
            if (with_artisans_count === 'true') {
                // Avec le nombre d'artisans par spécialité
                specialites = await Specialite.findAll({
                    where: { id_categorie: id },
                    include: [{
                        model: Artisan,
                        as: 'artisans',
                        attributes: []
                    }],
                    attributes: [
                        'id_specialite',
                        'nom_specialite',
                        [Specialite.sequelize.fn('COUNT', Specialite.sequelize.col('artisans.id_artisan')), 'nb_artisans']
                    ],
                    group: ['Specialite.id_specialite'],
                    order: [['nom_specialite', 'ASC']]
                });
                
                const formattedSpecialites = specialites.map(spec => ({
                    id: spec.id_specialite,
                    nom: spec.nom_specialite,
                    nb_artisans: parseInt(spec.getDataValue('nb_artisans')) || 0
                }));
                
                res.json({
                    success: true,
                    data: formattedSpecialites,
                    categorie: {
                        id: categorie.id_categorie,
                        nom: categorie.nom_categorie
                    },
                    message: `${formattedSpecialites.length} spécialité(s) trouvée(s) avec statistiques`
                });
                
            } else {
                // Version simple
                specialites = await Specialite.findAll({
                    where: { id_categorie: id },
                    attributes: ['id_specialite', 'nom_specialite'],
                    order: [['nom_specialite', 'ASC']]
                });
                
                const formattedSpecialites = specialites.map(spec => ({
                    id: spec.id_specialite,
                    nom: spec.nom_specialite
                }));
                
                res.json({
                    success: true,
                    data: formattedSpecialites,
                    categorie: {
                        id: categorie.id_categorie,
                        nom: categorie.nom_categorie
                    },
                    message: `${formattedSpecialites.length} spécialité(s) trouvée(s)`
                });
            }

        } catch (error) {
            console.error('❌ Erreur lors de la récupération des spécialités:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des spécialités',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

// GET /api/categories/:id/artisans - Artisans d'une catégorie

router.get('/:id/artisans',
    validateId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { 
                page = 1, 
                limit = 12,
                ville,
                note_min = 0,
                sort = 'note'
            } = req.query;
            
            // Vérifier que la catégorie existe
            const categorie = await Category.findByPk(id);
            if (!categorie) {
                return res.status(404).json({
                    success: false,
                    message: 'Catégorie introuvable',
                    code: 'CATEGORY_NOT_FOUND'
                });
            }

            // Construction des conditions WHERE pour les artisans
            const whereConditions = {};
            
            if (ville) {
                whereConditions.ville = { [Artisan.sequelize.Op.like]: `%${ville}%` };
            }
            
            if (note_min > 0) {
                whereConditions.note_moyenne = { [Artisan.sequelize.Op.gte]: parseFloat(note_min) };
            }

            // Tri
            let orderBy = [['note_moyenne', 'DESC']];
            switch (sort) {
                case 'name':
                    orderBy = [['nom_entreprise', 'ASC']];
                    break;
                case 'city':
                    orderBy = [['ville', 'ASC'], ['nom_entreprise', 'ASC']];
                    break;
                case 'recent':
                    orderBy = [['created_at', 'DESC']];
                    break;
            }

            // Pagination
            const offset = (parseInt(page) - 1) * parseInt(limit);

            const { count, rows } = await Artisan.findAndCountAll({
                where: whereConditions,
                include: [{
                    model: Specialite,
                    as: 'specialite',
                    where: { id_categorie: id },
                    attributes: ['id_specialite', 'nom_specialite'],
                    include: [{
                        model: Category,
                        as: 'categorie',
                        attributes: ['id_categorie', 'nom_categorie']
                    }]
                }],
                order: orderBy,
                limit: parseInt(limit),
                offset: offset,
                distinct: true
            });

            const totalPages = Math.ceil(count / parseInt(limit));
            
            const artisans = rows.map(artisan => ({
                id: artisan.id_artisan,
                nom_entreprise: artisan.nom_entreprise,
                nom_artisan: artisan.nom_artisan,
                ville: artisan.ville,
                departement: artisan.departement,
                note_moyenne: parseFloat(artisan.note_moyenne),
                rating: artisan.getStarRating(),
                image_url: artisan.image_url,
                est_artisan_du_mois: artisan.est_artisan_du_mois,
                specialite: {
                    id: artisan.specialite.id_specialite,
                    nom: artisan.specialite.nom_specialite
                }
            }));

            res.json({
                success: true,
                data: artisans,
                categorie: {
                    id: categorie.id_categorie,
                    nom: categorie.nom_categorie
                },
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                filters: {
                    ville,
                    note_min: parseFloat(note_min),
                    sort
                }
            });

        } catch (error) {
            console.error('❌ Erreur lors de la récupération des artisans par catégorie:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des artisans',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

module.exports = router;