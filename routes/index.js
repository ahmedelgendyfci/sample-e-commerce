const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');


const Cart = require('../models/cart')
const Product = require('../models/product')
const Order = require('../models/order')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user:'95ahmedelgendy@gmail.com',
        pass:'ahmed01123488897...'
    }
})

/* GET home page. */
router.get('/', async (req, res) => {
    const products = await Product.find().lean();
    let successMsg = req.flash('success')[0]
    res.render('shop/index', {
        products: products,
        successMsg: successMsg,
        noMessages: !successMsg
    });
});
router.get('/add-to-cart/:id', async (req, res) => {
    const productID = req.params.id;

    let cart = new Cart(req.session.cart ? req.session.cart : {});
    Product.findById(productID, function (err, product) {
        if (err) {
            return res.redirect('/')
        }
        cart.add(product, product.id);
        req.session.cart = cart;
        res.redirect('/')
    })
})
router.get('/reduceOne/:id',async(req,res)=>{
    const productID = req.params.id;
    let cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.reduceByOne(productID);
    req.session.cart = cart;
    res.redirect('/shopping-cart')
})
router.get('/removeItem/:id',async(req,res)=>{
    const productID = req.params.id;
    let cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.removeItem(productID);
    req.session.cart = cart;
    res.redirect('/shopping-cart')
})
router.get('/shopping-cart', async (req, res) => {
    if (!req.session.cart) {
        return res.render('shop/shopping-cart', {products: null})
    } else {
        let cart = new Cart(req.session.cart)
        //console.log(req.session.cart)
        return res.render('shop/shopping-cart', {products: cart.generateArray(), totalPrice: cart.totalPrice})
    }
})

router.get('/checkout',isLoggedIn, async (req, res) => {
    if (!req.session.cart) {
        return res.redirect('/shopping-cart')
    }
    const cart = new Cart(req.session.cart)
    let errMsg = req.flash('error')[0]
    res.render('shop/checkout',{
        totalPrice: cart.totalPrice,
        errMessage: errMsg,
        noErrors: !errMsg
    })
})

router.post('/checkout', async (req, res) => {
    if (!req.session.cart) {
        return res.redirect('/shopping-cart')
    }
    let cart = new Cart(req.session.cart)
    const stripe = require('stripe')('sk_test_51HnTbpIrLelfzOXdItkFFMPDVW5dNO2ivKwk6HPjSpqKgK9IbitzarhgPrv5XUAk7Wmp4TMd3n2aFWYMw60qVaHn00p9HxWQbT');

    stripe.charges.create({
        amount: cart.totalPrice * 100,
        currency: "usd",
        source: req.body.stripeToken,
        description: "Test Charge"
    },function (err, charge) {
        if (err){
            req.flash('error', err.message);
            return res.redirect('/checkout')
        }

        const order = new Order({
            user: req.user,
            cart: cart ,
            address: req.body.address,
            name: req.body.name,
            paymentId: charge.id
        })
        const  mailOptions = {
            from:'Shopping Cart Website',
            to: req.user.email,
            subject: 'Payment Confirmation',
            text:'Checkout using stripe done Successfully with payment id: '+charge.id
        }
        transporter.sendMail(mailOptions,function (err,data) {
            if(err){
                console.log(err)
                console.log('Error Occurs')
            }else {
                console.log('payment e-mail sent successfully!')
            }
        })
        order.save(function (err,result){
            req.flash('success', 'Products bought successfully!');
            req.session.cart = null;
            res.redirect('/')
        })

    })

})
module.exports = router;

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        next();
    } else{
        req.session.urlOld = req.url
        // console.log(req.session.urlOld)
        res.redirect("/user/signin");
    }
}
