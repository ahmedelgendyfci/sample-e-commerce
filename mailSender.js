const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user:'95ahmedelgendy@gmail.com',
        pass:'ahmed01123488897...'
    }
})

const  mailOptions = {
    from:'ahmed',
    to: 'ahmedelgendyfci1@gmail.com',
    subject: 'test mail',
    text:'Checkout done Successfully'
}

transporter.sendMail(mailOptions,function (err,data) {
    if(err){
        console.log(err)
        console.log('Error Occurs')
    }else {
        console.log(data)
    }
})
