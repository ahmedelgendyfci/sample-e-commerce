const Product = require('../models/product')
const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost:27017/shopping',{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
} );

var products = [
    new Product({
        imagePath: 'https://via.placeholder.com/150/000000/FFFFFF/?text=Item',
        title: 'Cristiano Ronaldo',
        description: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.',
        price: 50
    }),
    new Product({
        imagePath: 'https://via.placeholder.com/150/000000/FFFFFF/?text=Item',
        title: 'Messi',
        description: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.',
        price: 40
    }),
    new Product({
        imagePath: 'https://via.placeholder.com/150/000000/FFFFFF/?text=Item',
        title: 'Zalatan Ibra',
        description: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.',
        price: 45
    }),
    new Product({
        imagePath: 'https://via.placeholder.com/150/000000/FFFFFF/?text=Item',
        title: 'Ozil',
        description: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.',
        price: 35
    }),
    new Product({
        imagePath: 'https://via.placeholder.com/150/000000/FFFFFF/?text=Item',
        title: 'Karim Benzema',
        description: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.',
        price: 3
    }),
    new Product({
        imagePath: 'https://via.placeholder.com/150/000000/FFFFFF/?text=Item',
        title: 'Hazard',
        description: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.',
        price: 25
    })
];

var done = 0
for (var i=0; i<products.length; i++){
    products[i].save(function (err,res){
        done++;
        if (done === products.length){
            exit();
        }
    })
}
function exit(){
    mongoose.disconnect();
}










