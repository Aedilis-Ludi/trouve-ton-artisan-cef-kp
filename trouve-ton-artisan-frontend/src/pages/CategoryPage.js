// src/pages/CategoryPage.js
import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  getCategoryById,
  getCategorySpecialites,
  getArtisansByCategory,
} from '../services/api';
import ArtisanCard from '../components/ArtisanCard';
import '../styles/ArtisansPages.css';

/* Helpers */

function deepGet(obj, path) {
  if (!obj) return undefined;
  return path.split('.').reduce(
    (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
    obj
  );
}

function normalizeToArray(resp) {
  if (Array.isArray(resp)) return resp;

  const candidates = [
    'items',
    'data.items',
    'data.rows',
    'data.results',
    'data',
    'results',
    'rows',
    'list',
    'content',
    'hydra.member',
    'hydra:member',
  ];

  for (const key of candidates) {
    const val = deepGet(resp, key);
    if (Array.isArray(val)) return val;
  }

  const nestedData = deepGet(resp, 'data.data');
  if (Array.isArray(nestedData)) return nestedData;

  return [];
}

function normalizeArtisan(a) {
  const id =
    a.id ?? a._id ?? a.uuid ?? a.slug ?? a.code;

  const nom_entreprise =
    a.nom_entreprise ?? a.company ?? a.name ?? a.raison_sociale ?? a.title ?? 'Entreprise';

  const specialiteNom =
    a?.specialite?.nom ??
    a?.specialite ??
    a?.metier ??
    a?.profession ??
    a?.categoryName ??
    a?.categorie ??
    null;

  const specialite = specialiteNom ? { nom: specialiteNom } : a.specialite ?? null;

  const ville = a.ville ?? a.city ?? a.localite ?? a.commune ?? '';
  const departement = a.departement ?? a.department ?? a.dept ?? a.cp ?? a.postcode ?? '';

  const note_moyenne = parseFloat(
    a.note_moyenne ?? a.note ?? a.rating ?? a.score ?? 0
  ) || 0;

  const image_url = a.image_url ?? a.image ?? a.logo ?? a.avatar ?? '';
  const site_web = a.site_web ?? a.website ?? a.url ?? '';
  const description = a.description ?? a.bio ?? a.presentation ?? '';

  const est_artisan_du_mois = Boolean(
    a.est_artisan_du_mois ?? a.featured ?? a.isFeatured ?? false
  );

  return {
    id,
    nom_entreprise,
    specialite,
    ville,
    departement,
    note_moyenne,
    image_url,
    site_web,
    description,
    est_artisan_du_mois,
  };
}

/* Page Catégorie  */

const CategoryPage = () => {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();

  const [category, setCategory] = useState(null);
  const [specialites, setSpecialites] = useState([]);
  const [artisans, setArtisans] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const page = Number(searchParams.get('page') || 1);

  useEffect(() => {
    let cancel = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [cat, specs] = await Promise.all([
          getCategoryById(categoryId),
          getCategorySpecialites(categoryId, true),
        ]);

        if (cancel) return;
        setCategory(cat || null);
        setSpecialites(normalizeToArray(specs));

        const raw = await getArtisansByCategory(categoryId, { page, limit: 12 });
        const list = normalizeToArray(raw).map(normalizeArtisan);

        if (cancel) return;
        setArtisans(list);
      } catch (e) {
        if (cancel) return;
        setError(e?.message || 'Erreur lors du chargement de la catégorie');
      } finally {
        if (!cancel) setLoading(false);
      }
    };

    load();
    return () => {
      cancel = true;
    };
  }, [categoryId, page]);

  if (loading) {
    return (
      <main className="container py-5">
        <div className="placeholder-glow">
          <div className="placeholder col-6 mb-3" />
          <div className="placeholder col-8 mb-2" />
          <div className="placeholder col-5 mb-2" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container py-5">
        <div className="alert alert-warning" role="alert">
          <i className="fas fa-exclamation-triangle me-2" />
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="container py-5">
      {/* En-tête catégorie */}
      <header className="d-flex flex-wrap align-items-center justify-content-between mb-4">
        <div>
          <h1 className="page-title mb-1">
            {category?.nom ?? category?.name ?? 'Catégorie'}
          </h1>
          <p className="text-muted mb-0">
            {specialites.length
              ? `${specialites.length} spécialité(s) dans cette catégorie`
              : 'Spécialités à venir'}
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link to="/artisans" className="btn btn-outline-primary">
            <i className="fas fa-list-ul me-2" />
            Voir tous les artisans
          </Link>
        </div>
      </header>

      {/* Liste des “chips” de spécialités SUPPRIMÉE */}

      {/* Grille / Empty state */}
      {artisans.length > 0 ? (
        <div className="artisans-grid">
          {artisans.map((a) => (
            <ArtisanCard key={a.id ?? JSON.stringify(a)} artisan={a} />
          ))}
        </div>
      ) : (
        <section className="empty-state block-centered">
          <i className="fas fa-search mb-3 d-block" aria-hidden="true" />
          <h2 className="h4">
            Aucun artisan en “{category?.nom ?? category?.name ?? 'cette catégorie'}”
          </h2>
          <p className="text-muted">
            La catégorie existe mais aucun artisan n'est encore référencé par l'API.
          </p>
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            <Link to="/artisans" className="btn btn-primary">
              Parcourir tous les artisans
            </Link>
            <Link to="/" className="btn btn-outline-primary">
              Retour à l'accueil
            </Link>
          </div>
        </section>
      )}
    </main>
  );
};

export default CategoryPage;
