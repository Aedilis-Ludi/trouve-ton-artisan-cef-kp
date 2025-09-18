// src/App.js
// Composant principal (routing, accessibilité, perf)

import React, { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import './styles/App.css'; 

// Composants communs
import Header from './components/Header';
import Footer from './components/Footer';

// Pages 
const HomePage = lazy(() => import('./pages/HomePage'));
const ArtisansListPage = lazy(() => import('./pages/ArtisansListPage'));
const ArtisanDetailPage = lazy(() => import('./pages/ArtisanDetailPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));

// Pages légales 
const MentionsLegalesPage = lazy(() => import('./pages/MentionsLegalesPage'));
const DonneesPersonnellesPage = lazy(() => import('./pages/DonneesPersonnellesPage'));
const AccessibilitePage = lazy(() => import('./pages/AccessibilitePage'));
const CookiesPage = lazy(() => import('./pages/CookiesPage'));

// Loader 
const Loader = () => (
  <div className="container py-5 text-center" role="status" aria-live="polite">
    <div className="spinner-border text-primary" aria-hidden="true" />
    <p className="mt-3 mb-0">Chargement…</p>
  </div>
);

// Page 404
const NotFoundPage = () => (
  <div className="container py-5">
    <div className="text-center">
      <div className="error-404">
        <img
          src="/images/404-illustration.svg"
          alt="Page non trouvée"
          className="img-fluid mb-4"
          style={{ maxWidth: '300px' }}
        />
        <h1 className="display-1 fw-bold text-primary">404</h1>
        <h2>Page non trouvée</h2>
        <p className="lead text-muted mb-4">
          La page que vous avez demandée n'existe pas ou a été déplacée.
        </p>
        <div className="d-grid gap-2 d-md-flex justify-content-md-center">
          <Link to="/" className="btn btn-primary btn-lg">
            Retour à l'accueil
          </Link>
          <Link to="/artisans" className="btn btn-outline-primary btn-lg">
            Voir les artisans
          </Link>
        </div>
      </div>
    </div>
  </div>
);

// Gestion du focus et annonce des changements de page (WCAG)
const RouteAccessibility = ({ mainRef }) => {
  const location = useLocation();
  const liveRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (mainRef?.current) {
      mainRef.current.focus({ preventScroll: true });
    }
    if (liveRef.current) {
      const path = location.pathname || '/';
      const pageName = {
        '/': 'Accueil',
        '/artisans': 'Liste des artisans',
      }[path] || 'Changement de page';
      liveRef.current.textContent = pageName;
      setTimeout(() => {
        if (liveRef.current) liveRef.current.textContent = '';
      }, 1500);
    }
  }, [location, mainRef]);

  return (
    <div
      ref={liveRef}
      aria-live="polite"
      aria-atomic="true"
      className="visually-hidden"
    />
  );
};

const App = () => {
  const mainRef = useRef(null);

  return (
    <Router>
      <div className="app">
        <Helmet>
          <title>Trouve ton artisan ! - Région Auvergne-Rhône-Alpes</title>
          <meta
            name="description"
            content="Trouvez les meilleurs artisans d'Auvergne-Rhône-Alpes. Plus de 221 000 professionnels qualifiés pour tous vos projets."
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/'} />
          <meta property="og:site_name" content="Trouve ton artisan !" />
        </Helmet>

        <Header />

        <RouteAccessibility mainRef={mainRef} />

        <main
          id="main-content"
          className="main-content"
          role="main"
          tabIndex={-1}
          ref={mainRef}
        >
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />

              {/* Pages métiers */}
              <Route path="/artisans" element={<ArtisansListPage />} />
              <Route path="/artisan/:id" element={<ArtisanDetailPage />} />
              <Route path="/categorie/:categoryId" element={<CategoryPage />} />

              {/* Pages légales */}
              <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
              <Route path="/donnees-personnelles" element={<DonneesPersonnellesPage />} />
              <Route path="/accessibilite" element={<AccessibilitePage />} />
              <Route path="/cookies" element={<CookiesPage />} />

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </Router>
  );
};

export default App;
