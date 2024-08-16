const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Categorie = require('../models/Category.js');

const router = express.Router();

// Configuration de multer pour gérer le téléchargement d'images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and JPG are allowed.'));
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // Limiter la taille des fichiers à 2 Mo
});

router.post('/categories', upload.single('image'), async (req, res) => {
    try {
        if (!req.body.titre || !req.body.description) {
            return res.status(400).json({ message: 'Titre et Description sont obligatoires.' });
        }

        const image = req.file ? req.file.path : null; // Obtenir le chemin de l'image téléchargée

        // Convertir `vip` en booléen
        const vip = req.body.vip === 'true'; // Si la case est cochée, `vip` sera `true`, sinon `false`

        const categorie = new Categorie({
            titre: req.body.titre,
            description: req.body.description,
            image: image,
            sousTitre: req.body.sousTitre || '',
            descriptionSousTitre: req.body.descriptionSousTitre || '',
            descriptionExigences: req.body.descriptionExigences || '',
            contact: req.body.contact || '',
            vip: vip
        });

        const savedCategorie = await categorie.save();
        res.status(201).json(savedCategorie);
    } catch (error) {
        console.error('Erreur lors de la création de la catégorie:', error);
        res.status(400).json({ message: error.message });
    }
});

// Récupérer toutes les catégories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Categorie.find();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Récupérer une catégorie par ID
router.get('/categories/:id', async (req, res) => {
    try {
        const categorie = await Categorie.findById(req.params.id);
        if (!categorie) return res.status(404).json({ message: 'Catégorie non trouvée' });
        res.status(200).json(categorie);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mettre à jour une catégorie
router.put('/categories/:id', upload.single('image'), async (req, res) => {
    try {
        const updateData = { ...req.body };

        // Convertir `vip` en booléen
        if (req.body.vip === 'true') {
            updateData.vip = true;
        } else {
            updateData.vip = false;
        }

        // Ajouter ou mettre à jour l'image
        if (req.file) {
            updateData.image = req.file.path;
        }

        const updatedCategorie = await Categorie.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updatedCategorie) return res.status(404).json({ message: 'Catégorie non trouvée' });

        // Supprimer l'ancienne image si une nouvelle image a été téléchargée
        if (req.file && updatedCategorie.image) {
            fs.unlink(updatedCategorie.image, (err) => {
                if (err) console.error('Failed to delete old image:', err);
            });
        }

        res.status(200).json(updatedCategorie);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// Supprimer une catégorie
router.delete('/categories/:id', async (req, res) => {
    try {
        const deletedCategorie = await Categorie.findByIdAndDelete(req.params.id);
        if (!deletedCategorie) return res.status(404).json({ message: 'Catégorie non trouvée' });
        
        // Supprimer l'image associée à la catégorie
        if (deletedCategorie.image) {
            fs.unlink(deletedCategorie.image, (err) => {
                if (err) console.error('Failed to delete image:', err);
            });
        }
        
        res.status(200).json({ message: 'Catégorie supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
