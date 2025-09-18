// src/components/Header.js
// Header : marteau + logo image, menu dynamique (API), recherche

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getCategories, searchArtisans } from '../services/api';
import '../styles/Header.css';

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const Header = () => {
  const [categories, setCategories] = useState([]);
  const [menuError, setMenuError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);

  // Chemin du logo dans /public/images
  const logoUrl = process.env.PUBLIC_URL + '/images/Logo.png';

  // Charge le menu (API uniquement)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getCategories();
        const list = toArray(res);
        setCategories(list);
        setMenuError(false);
      } catch (e) {
        setCategories([]);
        setMenuError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // recherche
  useEffect(() => {
    const t = setTimeout(() => {
      const q = searchQuery.trim();
      if (q.length >= 2) doSearch(q);
      else {
        setShowSearchResults(false);
        setSearchResults([]);
        setActiveIndex(-1);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const doSearch = async (q) => {
    try {
      setIsSearching(true);
      const res = await searchArtisans(q, 5);
      const list = toArray(res);
      setSearchResults(list);
      setShowSearchResults(true);
      setActiveIndex(-1);
    } catch {
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    if (activeIndex >= 0 && searchResults[activeIndex]) {
      navigate(`/artisan/${searchResults[activeIndex].id}`);
    } else {
      navigate(`/artisans?q=${encodeURIComponent(q)}`);
    }
    setShowSearchResults(false);
    setSearchQuery('');
    setActiveIndex(-1);
  };

  const selectArtisan = (a) => {
    navigate(`/artisan/${a.id}`);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const blurSearch = () => setTimeout(() => setShowSearchResults(false), 120);

  const keydownSearch = (e) => {
    if (!showSearchResults || searchResults.length === 0) {
      if (e.key === 'Escape') setShowSearchResults(false);
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => (i + 1) % searchResults.length); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex((i) => (i - 1 + searchResults.length) % searchResults.length); }
    if (e.key === 'Escape')    { setShowSearchResults(false); setActiveIndex(-1); }
  };

  const isActive = (id) => location.pathname === `/categorie/${id}`;
  const toggleMobile = () => setIsMenuOpen((v) => !v);
  const closeMobile = () => setIsMenuOpen(false);

  return (
    <>
      <a className="skip-link" href="#main-content">Aller au contenu</a>

      <header className="main-header sticky-top">
        <div className="container">
          <nav className="navbar navbar-expand-lg align-items-center">
            {/* Marque : marteau + logo image */}
            <Link
              to="/"
              className="navbar-brand d-flex align-items-center gap-3"
              onClick={closeMobile}
              aria-label="Aller à l'accueil"
            >
              <span className="brand-badge" aria-hidden="true">🔨</span>
              <img
                src={logoUrl}
                alt="Trouve ton artisan — Région Auvergne-Rhône-Alpes"
                className="brand-logo"
                width="180"
                height="40"
                loading="eager"
                decoding="async"
              />
            </Link>

            {/* Burger mobile */}
            <button
              className="navbar-toggler d-lg-none"
              type="button"
              onClick={toggleMobile}
              aria-expanded={isMenuOpen}
              aria-controls="navbarNav"
              aria-label="Ouvrir/fermer le menu"
            >
              <span className="navbar-toggler-icon">{isMenuOpen ? '✕' : '☰'}</span>
            </button>

            {/* Nav + recherche */}
            <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
              <ul className="navbar-nav mx-auto gap-lg-4">
                {loading && (
                  <li className="nav-item"><span className="nav-link">Chargement…</span></li>
                )}

                {!loading && menuError && (
                  <li className="nav-item"><span className="nav-link text-warning">Menu indisponible</span></li>
                )}

                {!loading && !menuError && Array.isArray(categories) && categories.map((c) => (
                  <li className="nav-item" key={c.id}>
                    <Link
                      to={`/categorie/${c.id}`}
                      className={`nav-link ${isActive(c.id) ? 'active' : ''}`}
                      aria-current={isActive(c.id) ? 'page' : undefined}
                      onClick={closeMobile}
                    >
                      {c.nom}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="search-form position-relative ms-lg-3">
                <form onSubmit={submitSearch} role="search" aria-label="Recherche d'artisans">
                  <div className="input-group">
                    <input
                      ref={inputRef}
                      type="search"
                      className="form-control"
                      placeholder="Rechercher un artisan…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={blurSearch}
                      onKeyDown={keydownSearch}
                      aria-label="Rechercher un artisan"
                      autoComplete="off"
                      enterKeyHint="search"
                      spellCheck="false"
                    />
                    <button
                      type="submit"
                      className="search-btn"
                      disabled={isSearching || !searchQuery.trim()}
                      aria-label="Lancer la recherche"
                    >
                      {isSearching ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : (
                        <i className="fas fa-search" aria-hidden="true"></i>
                      )}
                    </button>
                  </div>
                </form>

                {showSearchResults && (
                  <div className="search-results position-absolute w-100 mt-1 bg-white border rounded shadow-lg" role="listbox">
                    {searchResults.length > 0 ? (
                      searchResults.map((a, idx) => (
                        <button
                          key={a.id}
                          type="button"
                          className={`d-block w-100 px-3 py-2 text-start border-0 bg-transparent search-result-item ${idx === activeIndex ? 'active' : ''}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectArtisan(a)}
                          role="option"
                          aria-selected={idx === activeIndex}
                        >
                          <div className="fw-bold text-primary">{a.nom_entreprise}</div>
                          <small className="text-muted">{a.specialite?.nom} • {a.ville}</small>
                        </button>
                      ))
                    ) : (
                      !isSearching && searchQuery.length >= 2 && (
                        <div className="p-3 text-center text-muted" role="status">
                          Aucun artisan trouvé pour « {searchQuery} »
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;
