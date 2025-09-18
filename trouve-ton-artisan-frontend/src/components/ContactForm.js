// src/components/ContactForm.js
import React, { useState } from 'react';

const ContactForm = ({ artisanName = 'l’artisan' }) => {
  const [values, setValues] = useState({ nom: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});

  const onChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const e = {};
    if (!values.nom.trim()) e.nom = 'Votre nom est requis.';
    if (!values.email.trim()) e.email = 'Votre e-mail est requis.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = 'E-mail invalide.';
    if (!values.message.trim()) e.message = 'Votre message est requis.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    console.log('Message envoyé =>', values);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="alert alert-success" role="status" aria-live="polite">
        <i className="fas fa-check-circle me-2"></i>
        Votre message a bien été préparé pour {artisanName}. Nous vous recontacterons rapidement.
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit}>
      <div className="mb-3">
        <label htmlFor="cf-nom" className="form-label">Votre nom</label>
        <input
          id="cf-nom"
          name="nom"
          type="text"
          className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
          value={values.nom}
          onChange={onChange}
          autoComplete="name"
        />
        {errors.nom && <div className="invalid-feedback">{errors.nom}</div>}
      </div>

      <div className="mb-3">
        <label htmlFor="cf-email" className="form-label">Votre e-mail</label>
        <input
          id="cf-email"
          name="email"
          type="email"
          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
          value={values.email}
          onChange={onChange}
          autoComplete="email"
        />
        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
      </div>

      <div className="mb-3">
        <label htmlFor="cf-message" className="form-label">Message</label>
        <textarea
          id="cf-message"
          name="message"
          rows="5"
          className={`form-control ${errors.message ? 'is-invalid' : ''}`}
          value={values.message}
          onChange={onChange}
        />
        {errors.message && <div className="invalid-feedback">{errors.message}</div>}
      </div>

      <button type="submit" className="btn btn-primary w-100">
        <i className="fas fa-paper-plane me-2"></i>
        Envoyer
      </button>
    </form>
  );
};

export default ContactForm;
