const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const multer = require('multer')
const mkdirp = require('mkdirp')
const fs = require('fs')


const Cart = require('../models/cart')
const Product = require('../models/product')
const Order = require('../models/order')
const UserProducts = require('../models/user_product')

router.get('/not-allowed', async (req, res) => {
    res.render('user/notAllowedPage');
})
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: '95ahmedelgendy@gmail.com',
        pass: 'ahmed01123488897...'
    }
})
router.get('/', async function (req, res) {
    const products = await Product.find({qty: {$gt: 0}})
        .limit(7)
        .sort({_id:-1})
        .lean();

    let successMsg = req.flash('success')[0]
    req.session.urlOld = req.originalUrl // to redirect

    res.render('shop/index', {
        products: products,
        successMsg: successMsg,
        noMessages: !successMsg
    });
});
router.get('/product/:id', async (req, res) => {
    const product_id = req.params.id;
    const product = await Product.findById(product_id).lean();
    const products = await Product.find().lean();
    req.session.urlOld = req.originalUrl
    res.render('shop/product_details', {
        product,
        qty: product.qty,
        products
    })
})

// make a function to take the id and add the cart
// redirect depend on the api url
addToCart = async (req, productID) => {
    // console.log(productID)
    let cart = new Cart(req.session.cart ? req.session.cart : {});
    const product = await Product.findById(productID);
    if (!product) {
        return false
    } else {
        cart.add(product, product.id);
        req.session.cart = cart;
        return true;
    }
}
router.get('/add-to-cart/:id', async (req, res) => {
    const productID = req.params.id;
    const added = await addToCart(req, productID);
    const oldUrl = req.session.urlOld;
    req.session.urlOld = null;
    if (!added) {
        console.log('product not added to the cart!');
        return res.redirect(oldUrl);
    } else {
        console.log('product added successfull!');
        res.redirect(oldUrl);
    }
})
router.get('/reduceOne/:id', async (req, res) => {
    const productID = req.params.id;
    let cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.reduceByOne(productID);
    req.session.cart = cart;
    res.redirect('/shopping-cart')
})
router.get('/removeItem/:id', async (req, res) => {
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
router.get('/checkout', isLoggedIn, async (req, res) => {
    console.log(req.user)
    // if (req.user && req.user.role==='buyer'){
    //
    // }
    if (!req.session.cart) {
        return res.redirect('/shopping-cart')
    }
    const cart = new Cart(req.session.cart)
    let errMsg = req.flash('error')[0]
    res.render('shop/checkout', {
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
    }, function (err, charge) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('/checkout')
        }

        const order = new Order({
            user: req.user,
            cart: cart,
            address: req.body.address,
            name: req.body.name,
            paymentId: charge.id
        })
        const mailOptions = {
            from: 'Shopping Cart Website',
            to: req.user.email,
            subject: 'Payment Confirmation',
            text: 'Checkout using stripe done Successfully with payment id: ' + charge.id
        }
        transporter.sendMail(mailOptions, function (err, data) {
            if (err) {
                console.log(err)
                console.log('Error Occurs')
            } else {
                console.log('payment e-mail sent successfully!')
            }
        })
        order.save(function (err, result) {
            req.flash('success', 'Products bought successfully!');
        })

        // req.session.cart = null;
        res.redirect('/reduceQty')

    })
})
router.get('/reduceQty', async (req, res) => {
    try {
        if (req.session.cart) {
            const cart = new Cart(req.session.cart)
            let itemsCount = 0;
            let itemsPrice = 0

            cart.generateArray().forEach(async (item) => {
                const itemDB = await Product.findById(item.item._id)
                if (cart.items[item.item._id].qty >= itemDB.qty) {
                    cart.items[item.item._id].qty = itemDB.qty;
                    itemDB.qty = 0;
                } else {
                    itemDB.qty -= cart.items[item.item._id].qty
                }
                itemsCount += cart.items[item.item._id].qty
                itemsPrice += cart.items[item.item._id].price

                await Product.findByIdAndUpdate(item.item._id, {qty: itemDB.qty},
                    function (err, product) {
                        if (err) {
                            console.log('not updated')
                        } else {
                            req.session.cart.totalQty = itemsCount
                            req.session.cart.totalPrice = itemsPrice
                        }
                    }
                )
                req.session.cart = null
                res.redirect('/')
            })
        }
    } catch (e) {
        console.log(e)
    }

})
router.get('/newProduct', async (req, res) => {
    if (!req.user || req.user.role !== 'seller') {
        return res.redirect('/not-allowed');
    }
    res.render('product/newProduct')
})
router.get('/updateProduct/:id', async (req, res) => {
    if (!req.user || req.user.role !== 'seller') {
        return res.redirect('/not-allowed');
    }
    const _id = req.params.id;
    const product = await Product.findById(_id).lean()
    // console.log(product)
    if (!product) {
        return res.send('Product Not Found !');
    }
    res.render('product/updateProduct', {product: product})
})
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            var dest = 'public/images/';
            mkdirp.sync(dest);
            cb(null, dest);
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + file.originalname)
        }
    }),
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('please upload an image !'))
        }
        cb(null, true);
    }
}).single('productImage');
router.post('/upload', function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            res.send(err)
        } else {
            var imageName = '';
            if (req.file) {
                imageName = req.file.filename
            }
            const product = new Product({
                imagePath: imageName,
                title: req.body.title,
                description: req.body.description,
                price: req.body.price,
                qty: req.body.qty
            })

            product.save(async function (err, doc) {
                try {
                    if (err)
                        throw err;

                    try {
                        // save user id and product id in the table of user and product ids
                        const user = await UserProducts.findOne({userId: req.user._id});
                        // console.log(user)
                        if (user) {
                            // console.log(user.productsID)
                            user.productsID.push(doc._id)
                            await user.save()
                        } else {
                            // new seller add first product
                            const newUserProducts = new UserProducts({
                                userId: req.user._id,
                                productsID: [doc._id]
                            })
                            await newUserProducts.save()
                        }
                    } catch (e) {
                        console.log(e)
                    }

                    // console.log('-----------all ids---------------')
                    // const user_product = await UserProducts.find();
                    // console.log(user_product)

                    res.redirect('/newProduct')
                } catch (err) {

                    const path = 'public/images/' + imageName;
                    // console.log(path)
                    fs.unlink(path, (err) => {
                        if (err) {
                            console.log('not deleted')
                            console.log(err)
                        } else {
                            console.log('deleted!');
                        }
                    });
                    res.send(err)
                }

            })
        }
    })
    //res.send('Success Uploading !!')
})
router.post('/updateProduct', async (req, res) => {
    await Product.findByIdAndUpdate(req.body._id, {
        title: req.body.title,
        description: req.body.description,
        qty: req.body.qty,
        price: req.body.price
    }, function (err, product) {
        if (err) {
            console.log(err)
        } else {
            console.log(product)
        }
    })

    res.redirect('/')

})

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.session.urlOld = req.url
        // console.log(req.session.urlOld)
        res.redirect("/user/signin");
    }
}
