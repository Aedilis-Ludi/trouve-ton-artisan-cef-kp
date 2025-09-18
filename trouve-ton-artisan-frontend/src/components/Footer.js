// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="ft-footer" role="contentinfo">
      <div className="ft-container ft-footer__top" aria-label="Informations de la Région">
        {/* Bloc gauche : Logo + texte */}
        <div className="ft-footer__brand">
          <div className="ft-footer__logo-bubble">
            <img
              src="/images/Logo.png"
              alt="Région Auvergne-Rhône-Alpes"
              className="ft-footer__logo"
            />
          </div>
          <div className="ft-footer__brand-text">
            <h3 className="ft-footer__title">La Région</h3>
            <p className="ft-footer__subtitle">Auvergne-Rhône-Alpes</p>
            <p className="ft-footer__desc">Conseil régional</p>
          </div>
        </div>

        {/* Bloc coordonnées Lyon */}
        <div className="ft-footer__contact" aria-label="Coordonnées antenne de Lyon">
          <h4 className="ft-footer__h4">Lyon</h4>
          <address className="ft-footer__address">
            <p>101 cours Charlemagne</p>
            <p>CS 20033</p>
            <p>69269 LYON CEDEX 02</p>
            <p>France</p>
            <p className="ft-footer__hours">Ouvert du lundi au vendredi de 8h15 à 17h</p>
            <p className="ft-footer__phone">
              <span aria-hidden="true">📞 </span>
              <a href="tel:+33426734000">+33 (0)4 26 73 40 00</a>
            </p>
          </address>
        </div>
      </div>

      <div className="ft-footer__divider" aria-hidden="true" />

      {/* Liens légaux */}
      <div className="ft-container ft-footer__bottom">
        <nav className="ft-footer__nav" aria-label="Pages légales">
          <ul className="ft-footer__legal">
            <li><Link to="/mentions-legales">Mentions légales</Link></li>
            <li><Link to="/donnees-personnelles">Données personnelles</Link></li>
            <li><Link to="/accessibilite">Accessibilité</Link></li>
            <li><Link to="/cookies">Cookies</Link></li>
          </ul>
        </nav>

        <p className="ft-footer__copy">
          &copy; {new Date().getFullYear()} Région Auvergne-Rhône-Alpes — Tous droits réservés
        </p>
      </div>
    </footer>
  );
};

export default Footer;
