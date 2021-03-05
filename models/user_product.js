const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userProductsSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    productsID:[]
})

module.exports = mongoose.model('UserProducts',userProductsSchema);



