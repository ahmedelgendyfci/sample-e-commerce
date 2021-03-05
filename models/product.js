const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const productSchema = new Schema({
    imagePath: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    qty: {
        type: Number,
        required: true,
        default: 0
    }
})

module.exports = mongoose.model('Product', productSchema);
