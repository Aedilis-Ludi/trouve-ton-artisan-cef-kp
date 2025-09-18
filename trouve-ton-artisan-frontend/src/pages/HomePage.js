// src/pages/HomePage.js
// Page d'accueil : 4 étapes + "artisans du mois"

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import ArtisanCard from '../components/ArtisanCard';
import { getArtisansDuMois } from '../services/api';
import '../styles/HomePage.css';

const HomePage = () => {
  const [artisansDuMois, setArtisansDuMois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charge les artisans du mois au montage
  useEffect(() => {
    let canceled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await getArtisansDuMois(3); // l’API renvoie déjà { data: [...] }
        const list = Array.isArray(data) ? data.slice(0, 3) : [];
        if (!canceled) setArtisansDuMois(list);
      } catch (e) {
        if (!canceled) {
          console.error('Erreur artisans du mois:', e);
          setError("Impossible de charger les artisans du mois");
          setArtisansDuMois([]);
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    load();
    return () => { canceled = true; };
  }, []);

  return (
    <div className="homepage">
      <Helmet>
        <title>Accueil — Trouve ton artisan (AURA)</title>
        <meta
          name="description"
          content="Trouvez rapidement un artisan qualifié près de chez vous en Auvergne-Rhône-Alpes. 4 étapes simples et les artisans du mois mis en avant."
        />
      </Helmet>

      {/* HERO */}
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="container">
          <div className="row align-items-center min-vh-75">
            <div className="col-lg-6">
              <div className="hero-content">
                <h1 id="hero-title" className="hero-title">
                  Trouvez l’artisan parfait près de chez vous
                </h1>
                <p className="hero-description">
                  Découvrez les meilleurs artisans d’Auvergne-Rhône-Alpes.
                  Plus de 221&nbsp;000 professionnels qualifiés vous attendent pour
                  réaliser tous vos projets.
                </p>

                <div className="hero-stats" aria-label="Chiffres clés">
                  <div className="stat-item" aria-label="221 000 artisans">
                    <span className="stat-number">221K+</span>
                    <span className="stat-label">Artisans</span>
                  </div>
                  <div className="stat-item" aria-label="12 départements">
                    <span className="stat-number">12</span>
                    <span className="stat-label">Départements</span>
                  </div>
                  <div className="stat-item" aria-label="4 catégories">
                    <span className="stat-number">4</span>
                    <span className="stat-label">Catégories</span>
                  </div>
                </div>

                <div className="hero-actions">
                  <Link to="/categorie/1" className="btn btn-primary btn-lg me-3">
                    Commencer ma recherche
                  </Link>
                  <a href="#comment-ca-marche" className="btn btn-outline-primary btn-lg">
                    Comment ça marche ?
                  </a>
                </div>
              </div>
            </div>

            <div className="col-lg-6" aria-hidden="true">
              <div className="hero-image">
                <div className="hero-illustration">
                  <div className="artisan-icons">
                    <div className="icon-item">🔨</div>
                    <div className="icon-item">🧱</div>
                    <div className="icon-item">⚡</div>
                    <div className="icon-item">🔧</div>
                    <div className="icon-item">🍞</div>
                    <div className="icon-item">✂️</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section
        id="comment-ca-marche"
        className="how-it-works-section"
        aria-labelledby="how-title"
      >
        <div className="container">
          <div className="text-center mb-5">
            <h2 id="how-title" className="section-title">Comment trouver mon artisan&nbsp;?</h2>
            <p className="section-subtitle">
              Suivez ces 4 étapes simples pour entrer en contact avec l’artisan idéal
            </p>
          </div>

          <div className="row g-4">
            <div className="col-lg-6 col-xl-3">
              <div className="step-card">
                <div className="step-number" aria-hidden="true">1</div>
                <div className="step-icon" aria-hidden="true">🎯</div>
                <h3 className="step-title">Choisir la catégorie</h3>
                <p className="step-description">Utilisez le menu pour sélectionner la catégorie d’artisanat.</p>
              </div>
            </div>

            <div className="col-lg-6 col-xl-3">
              <div className="step-card">
                <div className="step-number" aria-hidden="true">2</div>
                <div className="step-icon" aria-hidden="true">👨‍🔧</div>
                <h3 className="step-title">Choisir un artisan</h3>
                <p className="step-description">Parcourez la liste et ouvrez la fiche de l’artisan.</p>
              </div>
            </div>

            <div className="col-lg-6 col-xl-3">
              <div className="step-card">
                <div className="step-number" aria-hidden="true">3</div>
                <div className="step-icon" aria-hidden="true">📧</div>
                <h3 className="step-title">Contacter via le formulaire</h3>
                <p className="step-description">Envoyez votre demande depuis la fiche artisan.</p>
              </div>
            </div>

            <div className="col-lg-6 col-xl-3">
              <div className="step-card">
                <div className="step-number" aria-hidden="true">4</div>
                <div className="step-icon" aria-hidden="true">⏱️</div>
                <h3 className="step-title">Réponse sous 48&nbsp;h</h3>
                <p className="step-description">Recevez un retour rapidement.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ARTISANS DU MOIS */}
      <section className="featured-artisans-section" aria-labelledby="featured-title">
        <div className="container">
          <div className="text-center mb-5">
            <h2 id="featured-title" className="section-title">Nos artisans du mois</h2>
            <p className="section-subtitle">Découvrez les artisans mis en avant ce mois-ci</p>
          </div>

          {loading ? (
            <div className="text-center py-5" role="status" aria-live="polite">
              <div className="spinner-border text-primary" />
              <p className="mt-3 text-muted">Chargement des artisans du mois…</p>
            </div>
          ) : error ? (
            <div className="alert alert-warning text-center" role="alert" aria-live="assertive">
              <i className="fas fa-exclamation-triangle me-2" aria-hidden="true" />
              {error}
            </div>
          ) : artisansDuMois.length > 0 ? (
            <div className="row g-4 justify-content-center">
              {artisansDuMois.map((artisan, index) => (
                <div key={artisan.id ?? index} className="col-lg-4 col-md-6">
                  <div className="featured-artisan-wrapper">
                    <ArtisanCard
                      artisan={artisan}
                      showBadge
                      className="featured-artisan-card"
                    />
                    <div className="featured-ranking" aria-hidden="true">
                      <span className="ranking-badge">
                        <i className="fas fa-trophy me-1" />
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="empty-state">
                <i className="fas fa-star fa-3x text-muted mb-3" aria-hidden="true" />
                <h3 className="text-muted">Aucun artisan du mois pour le moment</h3>
                <p className="text-muted">
                  Les artisans du mois seront bientôt disponibles. Revenez plus tard&nbsp;!
                </p>
                <Link to="/artisans" className="btn btn-primary">
                  Voir tous les artisans
                </Link>
              </div>
            </div>
          )}

          {artisansDuMois.length > 0 && (
            <div className="text-center mt-5">
              <Link to="/artisans" className="btn btn-outline-primary btn-lg">
                Voir tous les artisans
                <i className="fas fa-arrow-right ms-2" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" aria-labelledby="cta-title">
        <div className="container">
          <div className="cta-content text-center">
            <h2 id="cta-title" className="cta-title">Prêt à trouver votre artisan&nbsp;?</h2>
            <p className="cta-description">
              Explorez notre réseau de professionnels qualifiés dans toute la région
              Auvergne-Rhône-Alpes et trouvez l’expert qu’il vous faut.
            </p>
            <div className="cta-actions">
              <Link to="/categorie/1" className="btn btn-primary btn-lg me-3">
                <i className="fas fa-search me-2" aria-hidden="true" />
                Commencer ma recherche
              </Link>
              <Link to="/artisans" className="btn btn-outline-light btn-lg">
                Parcourir les artisans
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
