// src/pages/NotFoundPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import '../styles/NotFound.css';

const NotFoundPage = () => {
  return (
    <main className="nf-container" role="main" aria-labelledby="nf-title">
      <Helmet>
        <title>Page non trouvée — Trouve ton artisan (AURA)</title>
        <meta
          name="description"
          content="La page demandée est introuvable. Retournez à l’accueil ou explorez la liste des artisans de la région Auvergne-Rhône-Alpes."
        />
        {/* On peut indiquer aux moteurs de ne pas indexer la 404 */}
        <meta name="robots" content="noindex,follow" />
      </Helmet>

      <section className="nf-card">
        <img
          src="/images/404-illustration.svg"
          alt=""
          className="nf-illustration"
          aria-hidden="true"
        />
        <h1 id="nf-title" className="nf-title">Page non trouvée</h1>
        <p className="nf-text">
          La page que vous avez demandée n'existe pas ou a été déplacée.
        </p>

        <div className="nf-actions">
          <Link to="/" className="btn btn-primary btn-lg" aria-label="Retour à l’accueil">
            Retour à l’accueil
          </Link>
          <Link to="/artisans" className="btn btn-outline-primary btn-lg" aria-label="Voir la liste des artisans">
            Voir les artisans
          </Link>
        </div>
      </section>
    </main>
  );
};

export default NotFoundPage;
