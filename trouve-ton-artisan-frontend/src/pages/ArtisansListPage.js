// src/pages/ArtisansListPage.js
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getArtisans } from '../services/api'; 
import ArtisanCard from '../components/ArtisanCard';
import '../styles/ArtisansPages.css';

const PAGE_SIZE = 12;

const ArtisansListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // filtres via URL (optionnels)
  const q = searchParams.get('q') || '';
  const categoryId = searchParams.get('categoryId') || '';

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [artisans, setArtisans] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setPage(1);
    setArtisans([]);
  }, [q, categoryId]);

  // charge depuis API (getArtisans)
  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        setLoading(true);
        setErr('');

        const params = {
          q: q || undefined,
          categoryId: categoryId || undefined,
          page,
          limit: PAGE_SIZE,
        };

        const { data } = await getArtisans(params);

        if (!alive) return;

        setArtisans(prev => (page === 1 ? data : [...prev, ...data]));

        setHasMore(Array.isArray(data) && data.length === PAGE_SIZE);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || 'Erreur lors du chargement');
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [q, categoryId, page]);

  // petite barre de recherche
  const onSubmitSearch = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nq = (fd.get('q') || '').toString().trim();
    const nc = (fd.get('categoryId') || '').toString().trim();

    const next = new URLSearchParams(searchParams);
    nq ? next.set('q', nq) : next.delete('q');
    nc ? next.set('categoryId', nc) : next.delete('categoryId');
    setSearchParams(next, { replace: true });
  };

  return (
    <main className="container py-4">
      {/* En-tête */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
        <div>
          <h1 className="h3 mb-1">Liste des artisans</h1>
          <p className="text-muted mb-0">Parcourez les professionnels de la région</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/" className="btn btn-light btn-sm">
            <i className="fas fa-home me-1" /> Accueil
          </Link>
        </div>
      </div>

      {/* Filtres (optionnels) */}
      <form className="row g-2 align-items-center mb-4" onSubmit={onSubmitSearch}>
        <div className="col-sm-6 col-md-5">
          <input
            name="q"
            type="search"
            defaultValue={q}
            className="form-control"
            placeholder="Rechercher un artisan…"
          />
        </div>
        <div className="col-sm-4 col-md-3">
          <input
            name="categoryId"
            type="text"
            defaultValue={categoryId}
            className="form-control"
            placeholder="Id catégorie (optionnel)"
          />
        </div>
        <div className="col-sm-auto">
          <button className="btn btn-primary" type="submit">
            <i className="fas fa-search me-1" /> Rechercher
          </button>
        </div>
      </form>

      {/* Erreur */}
      {err && (
        <div className="alert alert-warning">
          <i className="fas fa-exclamation-triangle me-2" />
          {err}
        </div>
      )}

      {/* Grille d’artisans (depuis l’API) */}
      <div className="artisans-grid">
        {artisans.map((a, idx) => (
          <ArtisanCard
            key={a.id ?? `${idx}-${a.nom_entreprise}`}
            artisan={a}
            rank={(page - 1) * PAGE_SIZE + idx + 1}
          />
        ))}
      </div>

      {/* Loader initial */}
      {loading && artisans.length === 0 && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="text-muted mt-3">Chargement…</p>
        </div>
      )}

      {/* Charger plus si nécessaire */}
      {!loading && hasMore && (
        <div className="text-center mt-4">
          <button
            className="btn btn-outline-primary"
            onClick={() => setPage(p => p + 1)}
          >
            Charger plus
          </button>
        </div>
      )}

      {/* État vide */}
      {!loading && artisans.length === 0 && !err && (
        <div className="text-center py-5 text-muted">
          Aucun artisan trouvé.
        </div>
      )}
    </main>
  );
};

export default ArtisansListPage;
