// src/pages/ArtisanDetailPage.js
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArtisanById, generateStarRating, sendContactMessage } from '../services/api';
import '../styles/ArtisansPages.css';

/** Chemin du favicon (dans public/) */
const FAVICON_SRC = '/favicon.png';

/** Choisit la meilleure URL d'image envoyée par l'API */
function pickImageCandidate(a) {
  const cand = [
    a?.image_url,
    a?.image,
    a?.logo,
    a?.photo,
    a?.avatar,
  ]
    .filter((v) => typeof v === 'string')
    .map((v) => v.trim())
    .find((v) => v.length > 0);
  return cand || null;
}

/** Construit une adresse si le back ne renvoie pas "adresse_complete" */
function buildAdresse(a) {
  if (a?.adresse_complete) return a.adresse_complete;
  const parts = [
    a?.adresse,
    [a?.code_postal, a?.ville].filter(Boolean).join(' '),
    a?.departement,
  ].filter(Boolean);
  return parts.join(', ');
}

const ArtisanDetailPage = () => {
  const { id } = useParams();
  const [artisan, setArtisan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Image réellement affichée
  const [imgSrc, setImgSrc] = useState(FAVICON_SRC);

  // Formulaire
  const [formData, setFormData] = useState({ nom: '', email: '', objet: '', message: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState(null);

  // Charge l'artisan
  useEffect(() => {
    let cancel = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getArtisanById(id);
        if (cancel) return;
        const data = res?.data?.data || res?.data || res;
        setArtisan(data || null);
      } catch (e) {
        if (!cancel) {
          setError("Impossible de charger les informations de l'artisan");
          setArtisan(null);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    load();
    return () => {
      cancel = true;
    };
  }, [id]);

  // Précharge la candidate ; si elle échoue/apparait vide -> favicon
  useEffect(() => {
    const candidate = artisan ? pickImageCandidate(artisan) : null;
    if (!candidate) {
      setImgSrc(FAVICON_SRC);
      return;
    }
    const test = new Image();
    // test.crossOrigin = 'anonymous'; // si tes images externes le permettent
    test.onload = () => setImgSrc(candidate);
    test.onerror = () => setImgSrc(FAVICON_SRC);
    test.src = candidate;
  }, [artisan]);

  const stars = useMemo(
    () => generateStarRating(artisan?.note_moyenne ?? artisan?.rating?.note ?? 4.2),
    [artisan]
  );

  const adresse = useMemo(() => buildAdresse(artisan || {}), [artisan]);

  // Formulaire
  const handleInputChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmitContact = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      setFormError(null);
      await sendContactMessage(id, formData);
      setFormSuccess(true);
      setFormData({ nom: '', email: '', objet: '', message: '' });
      setTimeout(() => setFormSuccess(false), 5000);
    } catch (err) {
      setFormError(err?.message || "Erreur lors de l'envoi du message");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="container artisans-page">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" aria-live="polite">
            <span className="visually-hidden">Chargement de la fiche artisan…</span>
          </div>
          <p className="mt-3 text-muted">Chargement de la fiche artisan…</p>
        </div>
      </main>
    );
  }

  if (error || !artisan) {
    return (
      <main className="container artisans-page">
        <div className="text-center py-5">
          <h1 className="h3 mb-3">Artisan introuvable</h1>
          <div className="alert alert-warning">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error || "Cet artisan n'existe pas ou n'est plus disponible."}
          </div>
          <Link to="/artisans" className="btn btn-primary">
            <i className="fas fa-arrow-left me-2"></i>
            Retour à la liste des artisans
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container artisans-page">
      {/* Fil d’Ariane */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Accueil</Link></li>
          <li className="breadcrumb-item"><Link to="/artisans">Artisans</Link></li>
          <li className="breadcrumb-item active" aria-current="page">
            {artisan?.nom_entreprise}
          </li>
        </ol>
      </nav>

      <div className="row g-4 align-items-start">
        {/* Colonne gauche */}
        <div className="col-lg-8">
          {/* En-tête */}
          <div className="d-flex align-items-start justify-content-between mb-4">
            <div>
              <h1 className="h2 mb-1">{artisan?.nom_entreprise}</h1>
              {artisan?.nom_artisan && (
                <p className="text-muted mb-2">Par {artisan.nom_artisan}</p>
              )}

              <div className="d-flex align-items-center mb-2">
                <span className="badge bg-primary me-2">
                  {artisan?.specialite?.nom || 'Artisan'}
                </span>
                <span className="text-muted">
                  <i className="fas fa-map-marker-alt me-1" />
                  {[artisan?.ville, artisan?.departement && `(${artisan.departement})`]
                    .filter(Boolean)
                    .join(' ')}
                </span>
              </div>

              <div className="mb-3" role="img" aria-label={`Note: ${stars.note.toFixed(1)} sur 5 étoiles`}>
                {Array.from({ length: stars.fullStars }).map((_, i) => (
                  <i key={`f-${i}`} className="fas fa-star text-warning" />
                ))}
                {stars.hasHalfStar && <i className="fas fa-star-half-alt text-warning" />}
                {Array.from({ length: stars.emptyStars }).map((_, i) => (
                  <i key={`e-${i}`} className="far fa-star text-warning" />
                ))}
                <span className="ms-2 text-muted">
                  ({stars.note.toFixed(1)}) • {artisan?.avis_count ?? 4} avis
                </span>
              </div>
            </div>

            {artisan?.est_artisan_du_mois && (
              <span className="badge bg-danger">
                <i className="fas fa-star me-1" />
                Artisan du mois
              </span>
            )}
          </div>

          {/* Bandeau image : candidate si ok, sinon favicon */}
          <div
            className="mb-4 rounded shadow-sm d-flex align-items-center justify-content-center bg-light"
            style={{ height: 220, border: '1px solid #e9ecef' }}
          >
            <img
              src={imgSrc}
              alt={artisan?.nom_entreprise || 'Illustration artisan'}
              style={{
                maxHeight: 160,
                maxWidth: '80%',
                objectFit: 'contain',
                display: 'block',
              }}
              onError={(e) => {
                // Si l'image candidate ne se charge pas -> favicon
                if (e.currentTarget.src !== window.location.origin + FAVICON_SRC &&
                    e.currentTarget.src !== window.location.origin.replace(/\/$/, '') + FAVICON_SRC) {
                  e.currentTarget.src = FAVICON_SRC;
                }
              }}
            />
          </div>

          {/* À propos */}
          <section className="mb-4">
            <h2 className="h4 mb-3">À propos</h2>
            <div className="card">
              <div className="card-body">
                {artisan?.description ? (
                  <p className="mb-0">{artisan.description}</p>
                ) : (
                  <p className="text-muted mb-0">
                    Aucune description disponible pour cet artisan.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Informations */}
          <section className="mb-4">
            <h2 className="h5 mb-3">Informations</h2>
            <div className="row g-3">
              {adresse && (
                <div className="col-md-6">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-map-marker-alt text-primary me-2" />
                    <div>
                      <small className="text-muted d-block">Adresse</small>
                      <span>{adresse}</span>
                    </div>
                  </div>
                </div>
              )}

              {artisan?.telephone && (
                <div className="col-md-6">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-phone text-primary me-2" />
                    <div>
                      <small className="text-muted d-block">Téléphone</small>
                      <a href={`tel:${artisan.telephone}`}>{artisan.telephone}</a>
                    </div>
                  </div>
                </div>
              )}

              {artisan?.email && (
                <div className="col-md-6">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-envelope text-primary me-2" />
                    <div>
                      <small className="text-muted d-block">Email</small>
                      <a href={`mailto:${artisan.email}`}>{artisan.email}</a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Site web */}
          {artisan?.site_web && (
            <div className="mb-4">
              <a
                href={artisan.site_web}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-primary"
                aria-label={`Visiter le site web de ${artisan?.nom_entreprise} (nouvelle fenêtre)`}
              >
                <i className="fas fa-external-link-alt me-2" />
                Visiter le site web
              </a>
            </div>
          )}
        </div>

        {/* Colonne droite : contact */}
        <div className="col-lg-4">
          <div className="card shadow-sm sticky-top" style={{ top: '100px' }}>
            <div className="card-body">
              <h2 className="h5 mb-3">
                <i className="fas fa-envelope me-2 text-primary" />
                Contacter {artisan?.nom_entreprise}
              </h2>

              {formSuccess && (
                <div className="alert alert-success">
                  <i className="fas fa-check-circle me-2" />
                  Votre message a été envoyé avec succès ! L'artisan vous répondra sous 48h.
                </div>
              )}

              {formError && (
                <div className="alert alert-danger">
                  <i className="fas fa-exclamation-triangle me-2" />
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmitContact}>
                <div className="mb-3">
                  <label htmlFor="nom" className="form-label">
                    Nom <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    className="form-control"
                    value={formData.nom}
                    onChange={handleInputChange}
                    required
                    disabled={formLoading}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={formLoading}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="objet" className="form-label">
                    Objet <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="objet"
                    name="objet"
                    className="form-control"
                    value={formData.objet}
                    onChange={handleInputChange}
                    required
                    disabled={formLoading}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="message" className="form-label">
                    Message <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="4"
                    className="form-control"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    disabled={formLoading}
                  />
                  <small className="form-text text-muted">
                    Décrivez votre projet ou vos besoins
                  </small>
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-2" />
                      Envoyer le message
                    </>
                  )}
                </button>

                <small className="form-text text-muted mt-2 d-block">
                  <i className="fas fa-info-circle me-1" />
                  Réponse sous 48h maximum
                </small>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ArtisanDetailPage;
