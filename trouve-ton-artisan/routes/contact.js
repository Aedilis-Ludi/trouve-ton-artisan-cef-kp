// routes/contact.js
// Routes pour la gestion du formulaire de contact

const express = require('express');
const nodemailer = require('nodemailer');
const { Artisan, Specialite, Category } = require('../models');
const { 
    validateContact, 
    handleValidationErrors, 
    contactLimiter 
} = require('../middleware/security');

const router = express.Router();


// CONFIGURATION NODEMAILER


let transporter;

const createTransporter = () => {
    // Configuration pour Gmail 
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true pour 465, false pour autres ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false // Pour éviter les erreurs de certificat 
        }
    });
};

// Initialiser le transporteur
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    createTransporter();
    console.log('✅ Configuration email initialisée');
} else {
    console.warn('⚠️ Configuration email manquante - Les emails ne seront pas envoyés');
}


// POST /api/contact/:artisan_id - Envoyer un message à un artisan

router.post('/:artisan_id',
    contactLimiter,
    validateContact,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { artisan_id } = req.params;
            const { nom, email, objet, message } = req.body;

            // Vérifier que l'artisan existe
            const artisan = await Artisan.findByPk(artisan_id, {
                include: [{
                    model: Specialite,
                    as: 'specialite',
                    include: [{
                        model: Category,
                        as: 'categorie'
                    }]
                }]
            });

            if (!artisan) {
                return res.status(404).json({
                    success: false,
                    message: 'Artisan introuvable',
                    code: 'ARTISAN_NOT_FOUND'
                });
            }

            // Vérifier la configuration email
            if (!transporter) {
                console.error('❌ Transporteur email non configuré');
                return res.status(500).json({
                    success: false,
                    message: 'Service d\'email temporairement indisponible',
                    code: 'EMAIL_SERVICE_UNAVAILABLE'
                });
            }

            // Préparer le contenu de l'email
            const emailContent = {
                // Email à l'artisan
                to: artisan.email,
                from: process.env.EMAIL_USER,
                replyTo: email,
                subject: `[Trouve ton artisan] ${objet}`,
                html: generateArtisanEmailTemplate({
                    artisan,
                    client: { nom, email },
                    objet,
                    message
                })
            };

            // Email de confirmation au client
            const confirmationContent = {
                to: email,
                from: process.env.EMAIL_USER,
                subject: `Confirmation - Votre message à ${artisan.nom_entreprise}`,
                html: generateClientConfirmationTemplate({
                    artisan,
                    client: { nom, email },
                    objet,
                    message
                })
            };

            try {
                // Envoyer l'email à l'artisan
                await transporter.sendMail(emailContent);
                console.log(`✅ Email envoyé à ${artisan.email} pour ${artisan.nom_entreprise}`);

                // Envoyer la confirmation au client
                try {
                    await transporter.sendMail(confirmationContent);
                    console.log(`✅ Confirmation envoyée à ${email}`);
                } catch (confirmError) {
                    console.warn('⚠️ Erreur envoi confirmation:', confirmError.message);
                    // On continue même si la confirmation échoue
                }

                res.json({
                    success: true,
                    message: `Votre message a été envoyé à ${artisan.nom_entreprise}. Vous devriez recevoir une réponse sous 48h.`,
                    data: {
                        artisan: {
                            nom: artisan.nom_entreprise,
                            email: artisan.email,
                            specialite: artisan.specialite.nom_specialite
                        },
                        message_envoye_le: new Date().toISOString()
                    }
                });

            } catch (emailError) {
                console.error('❌ Erreur lors de l\'envoi d\'email:', emailError);
                
                // Messages d'erreur plus spécifiques
                let errorMessage = 'Erreur lors de l\'envoi du message';
                
                if (emailError.code === 'EAUTH') {
                    errorMessage = 'Erreur d\'authentification email';
                } else if (emailError.code === 'ECONNECTION') {
                    errorMessage = 'Impossible de se connecter au serveur email';
                } else if (emailError.responseCode === 550) {
                    errorMessage = 'Adresse email invalide';
                }

                res.status(500).json({
                    success: false,
                    message: errorMessage,
                    code: 'EMAIL_SEND_ERROR',
                    details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
                });
            }

        } catch (error) {
            console.error('❌ Erreur lors du traitement du contact:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du traitement de votre demande',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);


// POST /api/contact/test - Test de configuration email 

if (process.env.NODE_ENV === 'development') {
    router.post('/test/config', async (req, res) => {
        try {
            if (!transporter) {
                return res.status(500).json({
                    success: false,
                    message: 'Transporteur email non configuré'
                });
            }

            // Tester la connexion
            await transporter.verify();
            
            res.json({
                success: true,
                message: 'Configuration email valide',
                config: {
                    host: process.env.EMAIL_HOST,
                    port: process.env.EMAIL_PORT,
                    user: process.env.EMAIL_USER,
                    auth_configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur de configuration email',
                error: error.message
            });
        }
    });
}


// GET /api/contact/stats - Statistiques des contacts (optionnel)

router.get('/stats', async (req, res) => {
    try {
        const totalArtisans = await Artisan.count();
        const artisansActifs = await Artisan.count({
            where: {
                email: {
                    [Artisan.sequelize.Op.ne]: null
                }
            }
        });

        res.json({
            success: true,
            data: {
                artisans_total: totalArtisans,
                artisans_contactables: artisansActifs,
                taux_contactable: totalArtisans > 0 ? 
                    Math.round((artisansActifs / totalArtisans) * 100) : 0,
                info: 'Statistiques basées sur les artisans avec email valide'
            }
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


// TEMPLATES EMAIL


function generateArtisanEmailTemplate({ artisan, client, objet, message }) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Nouveau message - Trouve ton artisan</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #0074c7; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0;">🔨 Trouve ton artisan</h1>
                <p style="margin: 10px 0 0 0;">Nouvelle demande de contact</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
                <h2 style="color: #0074c7; margin-top: 0;">Bonjour ${artisan.nom_artisan || artisan.nom_entreprise},</h2>
                
                <p>Vous avez reçu un nouveau message via la plateforme <strong>Trouve ton artisan</strong> de la région Auvergne-Rhône-Alpes.</p>
                
                <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #384050;">Informations du contact :</h3>
                    <p><strong>Nom :</strong> ${client.nom}</p>
                    <p><strong>Email :</strong> <a href="mailto:${client.email}">${client.email}</a></p>
                    <p><strong>Objet :</strong> ${objet}</p>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #384050;">Message :</h3>
                    <p style="white-space: pre-line;">${message}</p>
                </div>
                
                <div style="background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h4 style="margin-top: 0; color: #0074c7;">💡 Conseils pour bien répondre :</h4>
                    <ul>
                        <li>Répondez dans les 48h pour un meilleur service</li>
                        <li>Proposez un devis gratuit si possible</li>
                        <li>Précisez vos disponibilités</li>
                        <li>N'hésitez pas à poser des questions complémentaires</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="mailto:${client.email}?subject=Re: ${objet}" 
                       style="background: #0074c7; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        📧 Répondre directement
                    </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #666; text-align: center;">
                    Ce message vous a été envoyé via la plateforme Trouve ton artisan<br>
                    Région Auvergne-Rhône-Alpes<br>
                    <a href="mailto:${client.email}">Répondre à ${client.nom}</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
}

function generateClientConfirmationTemplate({ artisan, client, objet, message }) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Confirmation - Trouve ton artisan</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #82b864; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0;">✅ Message envoyé avec succès</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
                <h2 style="color: #384050; margin-top: 0;">Bonjour ${client.nom},</h2>
                
                <p>Votre message a bien été transmis à <strong>${artisan.nom_entreprise}</strong>.</p>
                
                <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #384050;">Récapitulatif de votre demande :</h3>
                    <p><strong>Artisan contacté :</strong> ${artisan.nom_entreprise}</p>
                    <p><strong>Spécialité :</strong> ${artisan.specialite.nom_specialite}</p>
                    <p><strong>Objet :</strong> ${objet}</p>
                    <p><strong>Envoyé le :</strong> ${new Date().toLocaleString('fr-FR')}</p>
                </div>
                
                <div style="background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h4 style="margin-top: 0; color: #0074c7;">📋 Prochaines étapes :</h4>
                    <ul>
                        <li><strong>Réponse sous 48h :</strong> L'artisan s'engage à vous répondre rapidement</li>
                        <li><strong>Échange direct :</strong> Vous recevrez la réponse directement par email</li>
                        <li><strong>Devis gratuit :</strong> N'hésitez pas à demander un devis détaillé</li>
                    </ul>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0074c7;">
                    <h4 style="margin-top: 0; color: #384050;">Votre message :</h4>
                    <p style="white-space: pre-line; font-style: italic;">${message}</p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #666; text-align: center;">
                    Merci d'utiliser Trouve ton artisan<br>
                    Région Auvergne-Rhône-Alpes<br>
                    101 cours Charlemagne, 69269 LYON CEDEX 02
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
}

module.exports = router;