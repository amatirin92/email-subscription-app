const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const domain = 'amatirin.me';
const api_key = 'key-971866b68286f4f8713ecb2dd5ee44e9';
const mailgun = require('mailgun-js')({
    apiKey: api_key,
    domain: domain
});
const MongoClient = require('mongodb').MongoClient 
var db;
MongoClient.connect('mongodb://amatirin:ayami92@ds135946.mlab.com:35946/subscription-app', (err, database) => {
    if (err) return console.log(err)
    db = database;
    app.listen(process.env.PORT || 3000, () => {
    })
})
app.use(bodyParser.urlencoded({
    extended: true
}))
app.set('view engine', 'ejs')
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'public')))
    //index route
app.get('/', (req, res) => {
        res.sendFile(__dirname + '/public/index.html')
    })
    //confirm routes
app.get('/confirm', (req, res) => {
    res.sendFile(__dirname + '/public/confirm.html')
})
app.post('/confirm', (req, res) => {
        //send message to user
        var user = req.body;
        user.subscribed = false;
        //create the token
        var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var token = '';
        for (var i = 16; i > 0; --i) {
            token += chars[Math.round(Math.random() * (chars.length - 1))];
        }
//        var expires = new Date();
        user.token = token;
//        user.expires = expires.setHours(expires.getHours() + 6);
        var usertoken = user.token;
        console.log(user);
        var confirmUrl = 'http://email-subscription-app.herokuapp.com/confirm/' + usertoken;
        //message
        var data = {
            from: 'Admin <admin@amatirin.me>', to: user.email,
            subject: 'Please confirm',
            text: 'Thanks for signing up with us! :) Please confirm your subscription here!  ' + confirmUrl
        };
        mailgun.messages().send(data, function (error, body) {});
        //save user to database
        //       // give database TTL
        //    db.collection('subscribers').createIndex({'expires': 1}, {expiresAfterSeconds: 21} )
        //    
        db.collection('subscribers').save(req.body, (err, result) => {
            if (err) return console.log(err)
            res.redirect('/confirm')
        });
    })
    //subscribers route
app.get('/subscribers', (req, res) => {
        db.collection('subscribers').find().toArray((err, result) => {
            if (err) return err;
            res.render('list.ejs', {
                subscribers: result
            })
        })
    })
    //verify routes
app.get('/confirm/:token', (req, res) => {
    db.collection('subscribers').find({
        token: req.params.token
    }, function (err, result) {
        console.log(result)
        if (!result) {
            res.send("This is a bad token. Are you sure?")
        }
        else if (result) {
            db.collection('subscribers').update({
                token: req.params.token
            }, {
                $set: {
                    subscribed: true
                }
            })
            res.redirect('/confir')
        }
    })
});