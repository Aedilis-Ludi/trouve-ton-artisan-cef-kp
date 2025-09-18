// components/ArtisanCard.js
// Composant pour afficher une carte d'artisan

import React from 'react';
import { Link } from 'react-router-dom';
import { generateStarRating } from '../services/api';
import '../styles/ArtisanCard.css';

/* Composant ArtisanCard */

const ArtisanCard = ({ 
  artisan,
  showBadge = true,
  className = ''
}) => {
  // Vérification que l'artisan existe
  if (!artisan) {
    return (
      <div className="artisan-card">
        <div className="artisan-info p-3 text-center text-muted">
          Artisan non trouvé
        </div>
      </div>
    );
  }

  // Génération des étoiles pour la note
  const starRating = generateStarRating(artisan.note_moyenne || 0);

  /* Génère l'affichage des étoiles selon la note*/
  const renderStars = () => {
    const stars = [];
    
    // Étoiles pleines
    for (let i = 0; i < starRating.fullStars; i++) {
      stars.push(
        <i key={`full-${i}`} className="fas fa-star" aria-hidden="true"></i>
      );
    }
    
    // Demi-étoile
    if (starRating.hasHalfStar) {
      stars.push(
        <i key="half" className="fas fa-star-half-alt" aria-hidden="true"></i>
      );
    }
    
    // Étoiles vides
    for (let i = 0; i < starRating.emptyStars; i++) {
      stars.push(
        <i key={`empty-${i}`} className="far fa-star" aria-hidden="true"></i>
      );
    }
    
    return stars;
  };

  /*Détermine l'image à afficher pour l'artisan */
  const getArtisanImage = () => {
    if (artisan.image_url) {
      return artisan.image_url;
    }
    
    // Icônes par défaut selon la spécialité
    const defaultIcons = {
      'Menuiserie': '🪚',
      'Plomberie': '🔧', 
      'Électricité': '⚡',
      'Maçonnerie': '🧱',
      'Boulangerie': '🍞',
      'Pâtisserie': '🧁',
      'Coiffure': '✂️',
      'default': '👨‍🔧'
    };
    
    const speciality = artisan.specialite?.nom || '';
    return defaultIcons[speciality] || defaultIcons.default;
  };

  /* Formate l'adresse de l'artisan pour l'affichage */
  const formatLocation = () => {
    const parts = [];
    if (artisan.ville) parts.push(artisan.ville);
    if (artisan.departement) parts.push(artisan.departement);
    return parts.join(', ');
  };

  const artisanImage = getArtisanImage();
  const isEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(artisanImage);

  // Texte alternatif informatif
  const imgAlt =
    `${artisan.nom_entreprise}` +
    `${artisan.specialite?.nom ? `, ${artisan.specialite.nom}` : ''}` +
    `${artisan.ville ? `, ${artisan.ville}` : ''}`;

  return (
    <article className={`artisan-card fade-in-up ${className}`}>
      {/* Badge "Artisan du mois" */}
      {showBadge && artisan.est_artisan_du_mois && (
        <div className="artisan-badge">
          <i className="fas fa-star me-1" aria-hidden="true"></i>
          Artisan du mois
        </div>
      )}

      {/* Image ou icône de l'artisan */}
      <div className="artisan-image">
        {isEmoji ? (
          <span 
            className="artisan-emoji"
            role="img" 
            aria-label={`Icône ${artisan.specialite?.nom || 'artisan'}`}
          >
            {artisanImage}
          </span>
        ) : (
          <img
            src={artisanImage}
            alt={imgAlt}
            loading="lazy"
            width={320}
            height={240}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `
                <span class="artisan-emoji" role="img" aria-label="Artisan">👨‍🔧</span>
              `;
            }}
          />
        )}
      </div>

      {/* Informations de l'artisan */}
      <div className="artisan-info">
        {/* Nom de l'entreprise  */}
        <h3 className="artisan-name">
          {artisan.nom_entreprise}
        </h3>

        {/* Nom de l'artisan si disponible */}
        {artisan.nom_artisan && (
          <p className="artisan-owner text-muted small mb-2">
            {artisan.nom_artisan}
          </p>
        )}

        {/* Note avec étoiles */}
        <div className="artisan-stars mb-2" role="img" aria-label={`Note: ${starRating.note} sur 5 étoiles`}>
          {renderStars()}
          <span className="ms-2 small text-muted">
            ({starRating.note.toFixed(1)})
          </span>
        </div>

        {/* Spécialité  */}
        <div className="artisan-specialty mb-2">
          <i className="fas fa-tools me-2" aria-hidden="true"></i>
          {artisan.specialite?.nom || 'Spécialité non précisée'}
        </div>

        {/* Localisation */}
        <div className="artisan-location">
          <i className="fas fa-map-marker-alt me-2" aria-hidden="true"></i>
          {formatLocation() || 'Localisation non précisée'}
        </div>

        {/* Description courte si disponible */}
        {artisan.description && (
          <p className="artisan-description mt-2 small text-muted">
            {artisan.description.length > 100 
              ? `${artisan.description.substring(0, 100)}...` 
              : artisan.description
            }
          </p>
        )}

        {/* Site web si disponible */}
        {artisan.site_web && (
          <div className="mt-2">
            <a 
              href={artisan.site_web} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-primary"
              aria-label={`Visiter le site web de ${artisan.nom_entreprise} (nouvelle fenêtre)`}
            >
              <i className="fas fa-external-link-alt me-2" aria-hidden="true"></i>
              Site web
            </a>
          </div>
        )}
      </div>

      {/* Lien vers la fiche complète */}
      <Link 
        to={`/artisan/${artisan.id}`}
        className="stretched-link"
        aria-label={`Voir la fiche complète de ${artisan.nom_entreprise}`}
      >
        <span className="sr-only">
          Voir la fiche complète de {artisan.nom_entreprise}, {artisan.specialite?.nom} à {artisan.ville}
        </span>
      </Link>
    </article>
  );
};

/* Composant pour afficher une grille d'artisans */
export const ArtisansGrid = ({ artisans = [], loading = false, error = null }) => {
  if (loading) {
    return (
      <div className="artisans-grid">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="artisan-card">
            <div className="artisan-image bg-light">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Chargement...</span>
              </div>
            </div>
            <div className="artisan-info">
              <div className="placeholder-glow">
                <span className="placeholder col-8"></span>
                <span className="placeholder col-6"></span>
                <span className="placeholder col-4"></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <div className="alert alert-warning" role="alert">
          <i className="fas fa-exclamation-triangle me-2" aria-hidden="true"></i>
          {error}
        </div>
      </div>
    );
  }

  if (!artisans.length) {
    return (
      <div className="text-center p-4">
        <div className="text-muted">
          <i className="fas fa-search mb-3 d-block" style={{fontSize: '3rem'}}></i>
          <h4>Aucun artisan trouvé</h4>
          <p>Essayez de modifier vos critères de recherche.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="artisans-grid">
      {artisans.map((artisan) => (
        <ArtisanCard 
          key={artisan.id} 
          artisan={artisan}
        />
      ))}
    </div>
  );
};

export default ArtisanCard;
