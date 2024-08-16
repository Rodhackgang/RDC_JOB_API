const mongoose = require('mongoose');

const categorieSchema = new mongoose.Schema({
    titre: { type: String},
    description: { type: String},
    image: { type: String }, 
    sousTitre: { type: String },
    descriptionSousTitre: { type: String },
    descriptionExigences: { type: String },
    contact: { type: String },
    vip: { type: Boolean, default: false }
});


const Categorie = mongoose.model('Categorie', categorieSchema);

module.exports = Categorie;
