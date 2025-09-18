// routes/artisans.js
// Routes pour la gestion des artisans

const express = require('express');
const { Op, fn, col } = require('sequelize');
const { Artisan, Specialite, Category } = require('../models');
const {
  validateSearch,
  validateId,
  handleValidationErrors,
  searchLimiter
} = require('../middleware/security');

const router = express.Router();

/* GET /api/artisans - Liste paginée des artisans*/
router.get('/',
  searchLimiter,
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        q = '',
        page = 1,
        limit = 12,
        ville,
        departement,
        specialite_id,
        categorie_id,
        note_min = 0,
        sort = 'note'
      } = req.query;

      const where = {};

      // Recherche textuelle (nom entreprise, nom artisan, description)
      if (q && q.trim()) {
        where[Op.or] = [
          { nom_entreprise: { [Op.like]: `%${q.trim()}%` } },
          { nom_artisan: { [Op.like]: `%${q.trim()}%` } },
          { description: { [Op.like]: `%${q.trim()}%` } }
        ];
      }

      // Filtres géographiques
      if (ville) where.ville = { [Op.like]: `%${ville}%` };
      if (departement) where.departement = departement;

      // Note mini
      const min = parseFloat(note_min);
      if (!Number.isNaN(min) && min > 0) {
        where.note_moyenne = { [Op.gte]: min };
      }

      // Jointure spécialité (+ catégorie)
      const includeSpecialite = {
        model: Specialite,
        as: 'specialite',
        attributes: ['id_specialite', 'nom_specialite'],
        include: [{
          model: Category,
          as: 'categorie',
          attributes: ['id_categorie', 'nom_categorie']
        }]
      };

      // Filtre par spécialité
      if (specialite_id) {
        where.id_specialite = parseInt(specialite_id, 10);
      }

      // Filtre par catégorie (via spécialité)
      if (categorie_id) {
        includeSpecialite.include[0].where = {
          id_categorie: parseInt(categorie_id, 10)
        };
      }

      // Tri
      let orderBy = [['note_moyenne', 'DESC'], ['nom_entreprise', 'ASC']];
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
        case 'note':
        default:
          orderBy = [['note_moyenne', 'DESC'], ['nom_entreprise', 'ASC']];
          break;
      }

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 12;
      const offset = (pageNum - 1) * limitNum;

      const { count, rows } = await Artisan.findAndCountAll({
        where,
        include: [includeSpecialite],
        order: orderBy,
        limit: limitNum,
        offset,
        distinct: true // important avec les jointures
      });

      const totalPages = Math.ceil(count / limitNum);

      const artisans = rows.map(a => ({
        id: a.id_artisan,
        nom_entreprise: a.nom_entreprise,
        nom_artisan: a.nom_artisan,
        email: a.email,
        telephone: a.telephone,
        ville: a.ville,
        departement: a.departement,
        note_moyenne: a.note_moyenne != null ? parseFloat(a.note_moyenne) : null,
        rating: a.getStarRating ? a.getStarRating() : undefined,
        image_url: a.image_url,
        est_artisan_du_mois: !!a.est_artisan_du_mois,
        specialite: a.specialite ? {
          id: a.specialite.id_specialite,
          nom: a.specialite.nom_specialite,
          categorie: a.specialite.categorie ? {
            id: a.specialite.categorie.id_categorie,
            nom: a.specialite.categorie.nom_categorie
          } : null
        } : null,
        adresse_complete: a.getFormattedAddress ? a.getFormattedAddress() : undefined
      }));

      res.json({
        success: true,
        data: artisans,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        filters: {
          q: q.trim(),
          ville,
          departement,
          specialite_id,
          categorie_id,
          note_min: min || 0,
          sort
        }
      });

    } catch (error) {
      console.error('❌ Erreur /api/artisans :', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des artisans'
      });
    }
  }
);

/* GET /api/artisans/du-mois - Artisans du mois*/
router.get('/du-mois', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '3', 10);

    const rows = await Artisan.findAll({
      where: { est_artisan_du_mois: true },
      include: [{
        model: Specialite,
        as: 'specialite',
        include: [{ model: Category, as: 'categorie' }]
      }],
      order: [['note_moyenne', 'DESC'], ['nom_entreprise', 'ASC']],
      limit
    });

    const data = rows.map(a => ({
      id: a.id_artisan,
      nom_entreprise: a.nom_entreprise,
      nom_artisan: a.nom_artisan,
      ville: a.ville,
      departement: a.departement,
      note_moyenne: a.note_moyenne != null ? parseFloat(a.note_moyenne) : null,
      rating: a.getStarRating ? a.getStarRating() : undefined,
      image_url: a.image_url,
      specialite: a.specialite ? {
        id: a.specialite.id_specialite,
        nom: a.specialite.nom_specialite,
        categorie: a.specialite.categorie ? {
          id: a.specialite.categorie.id_categorie,
          nom: a.specialite.categorie.nom_categorie
        } : null
      } : null
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Erreur /api/artisans/du-mois :', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des artisans du mois'
    });
  }
});

/* GET /api/artisans/search - Recherche d'artisans */
router.get('/search',
  searchLimiter,
  validateSearch,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { q, limit = 10 } = req.query;
      const limitNum = parseInt(limit, 10) || 10;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'La recherche doit contenir au moins 2 caractères'
        });
      }

      const rows = await Artisan.findAll({
        where: {
          [Op.or]: [
            { nom_entreprise: { [Op.like]: `%${q.trim()}%` } },
            { nom_artisan: { [Op.like]: `%${q.trim()}%` } },
            { description: { [Op.like]: `%${q.trim()}%` } }
          ]
        },
        include: [{
          model: Specialite,
          as: 'specialite',
          include: [{ model: Category, as: 'categorie' }]
        }],
        order: [['note_moyenne', 'DESC'], ['nom_entreprise', 'ASC']],
        limit: limitNum
      });

      const data = rows.map(a => ({
        id: a.id_artisan,
        nom_entreprise: a.nom_entreprise,
        nom_artisan: a.nom_artisan,
        ville: a.ville,
        departement: a.departement,
        note_moyenne: a.note_moyenne != null ? parseFloat(a.note_moyenne) : null,
        specialite: a.specialite ? {
          nom: a.specialite.nom_specialite,
          categorie: a.specialite.categorie ? a.specialite.categorie.nom_categorie : null
        } : null
      }));

      res.json({ success: true, data, query: q.trim(), count: data.length });

    } catch (error) {
      console.error('❌ Erreur /api/artisans/search :', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche'
      });
    }
  }
);

/* GET /api/artisans/stats - Statistiques */
router.get('/stats', async (req, res) => {
  try {
    const total = await Artisan.count();

    const notesAgg = await Artisan.findOne({
      attributes: [
        [fn('AVG', col('note_moyenne')), 'moyenne'],
        [fn('MIN', col('note_moyenne')), 'minimum'],
        [fn('MAX', col('note_moyenne')), 'maximum']
      ],
      raw: true
    });

    const parDepartement = await Artisan.findAll({
      attributes: ['departement', [fn('COUNT', col('*')), 'total']],
      group: ['departement'],
      order: [['departement', 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: {
        total_artisans: total,
        repartition_departements: parDepartement,
        notes: {
          moyenne: notesAgg?.moyenne ? parseFloat(notesAgg.moyenne).toFixed(2) : null,
          minimum: notesAgg?.minimum != null ? parseFloat(notesAgg.minimum) : null,
          maximum: notesAgg?.maximum != null ? parseFloat(notesAgg.maximum) : null
        }
      }
    });
  } catch (error) {
    console.error('❌ Erreur /api/artisans/stats :', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

/* GET /api/artisans/:id - Détail d'un artisan*/
router.get('/:id',
  validateId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      const a = await Artisan.findByPk(id, {
        include: [{
          model: Specialite,
          as: 'specialite',
          include: [{ model: Category, as: 'categorie' }]
        }]
      });

      if (!a) {
        return res.status(404).json({
          success: false,
          message: 'Artisan introuvable',
          code: 'ARTISAN_NOT_FOUND'
        });
      }

      const artisanComplet = {
        id: a.id_artisan,
        nom_entreprise: a.nom_entreprise,
        nom_artisan: a.nom_artisan,
        email: a.email,
        telephone: a.telephone,
        adresse: a.adresse,
        code_postal: a.code_postal,
        ville: a.ville,
        departement: a.departement,
        adresse_complete: a.getFormattedAddress ? a.getFormattedAddress() : undefined,
        coordonnees: { latitude: a.latitude, longitude: a.longitude },
        note_moyenne: a.note_moyenne != null ? parseFloat(a.note_moyenne) : null,
        rating: a.getStarRating ? a.getStarRating() : undefined,
        description: a.description,
        site_web: a.site_web,
        image_url: a.image_url,
        est_artisan_du_mois: !!a.est_artisan_du_mois,
        specialite: a.specialite ? {
          id: a.specialite.id_specialite,
          nom: a.specialite.nom_specialite,
          categorie: a.specialite.categorie ? {
            id: a.specialite.categorie.id_categorie,
            nom: a.specialite.categorie.nom_categorie
          } : null
        } : null,
        dates: { cree_le: a.created_at, modifie_le: a.updated_at }
      };

      res.json({ success: true, data: artisanComplet });

    } catch (error) {
      console.error('❌ Erreur /api/artisans/:id :', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération de l'artisan"
      });
    }
  }
);

/* GET /api/artisans/categorie/:categorieId */
router.get('/categorie/:categorieId',
  validateId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { categorieId } = req.params;
      const { page = 1, limit = 12 } = req.query;

      const categorie = await Category.findByPk(categorieId);
      if (!categorie) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie introuvable',
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 12;
      const offset = (pageNum - 1) * limitNum;

      const { count, rows } = await Artisan.findAndCountAll({
        include: [{
          model: Specialite,
          as: 'specialite',
          where: { id_categorie: categorieId },
          include: [{ model: Category, as: 'categorie' }]
        }],
        order: [['note_moyenne', 'DESC']],
        limit: limitNum,
        offset,
        distinct: true
      });

      const totalPages = Math.ceil(count / limitNum);

      const artisans = rows.map(a => ({
        id: a.id_artisan,
        nom_entreprise: a.nom_entreprise,
        nom_artisan: a.nom_artisan,
        ville: a.ville,
        departement: a.departement,
        note_moyenne: a.note_moyenne != null ? parseFloat(a.note_moyenne) : null,
        rating: a.getStarRating ? a.getStarRating() : undefined,
        image_url: a.image_url,
        specialite: a.specialite ? {
          id: a.specialite.id_specialite,
          nom: a.specialite.nom_specialite
        } : null
      }));

      res.json({
        success: true,
        data: artisans,
        categorie: {
          id: categorie.id_categorie,
          nom: categorie.nom_categorie
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      });

    } catch (error) {
      console.error('❌ Erreur /api/artisans/categorie/:categorieId :', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des artisans'
      });
    }
  }
);

module.exports = router;
