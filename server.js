const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const domain = 'amatirin.me';
const api_key = 'key-971866b68286f4f8713ecb2dd5ee44e9';
const mailgun = require('mailgun-js')({
    apiKey: api_key
    , domain: domain
});
const MongoClient = require('mongodb').MongoClient
var db;
MongoClient.connect('mongodb://amatirin:ayami92@ds135946.mlab.com:35946/subscription-app', (err, database) => {
    if (err) return console.log(err)
    db = database;
    app.listen(process.env.PORT || 3000, () => {
        console.log('App is listening')
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
    res.render('confirm.ejs', {
        title: "Confirm"
        , response: "Confirmation page"
    });
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
            user.token = token;
            var usertoken = user.token;
            //url
            var confirmUrl = 'http://the-email-subscription-app.herokuapp.com/confirm/' + usertoken;
            //message
            var data = {
                from: 'Admin <admin@amatirin.me>'
                , to: user.email
                , subject: 'Please confirm'
                , text: 'Thanks for signing up with us! :) Please confirm your subscription here!  ' + confirmUrl
            };
            mailgun.messages().send(data, function (error, body) {});
            //save user to database
            console.log(user);
            db.collection('subscribers').save(req.body, (err, result) => {
                if (err) return console.log(err)
                res.render('confirm.ejs', {
                    response: "Thanks! Please check your email!"
                    , title: "Confirmation"
                })
            });
        })
        //subscribers route
    app.get('/subscribers', (req, res) => {
            db.collection('subscribers').find().toArray((err, result) => {
                if (err) return err;
                res.render('list.ejs', {
                    subscribers: result
                    , title: "List"
                })
            })
        })
        //verify routes
    app.get('/confirm/:token', (req, res) => {
        db.collection('subscribers').findOne({
            token: req.params.token
        }, {
            token: 1
            , _id: 0
        }, (err, result) => {
            console.log(result)
            if (!result) {
                res.render('confirm.ejs', {
                    response: "This is a bad token. Are you sure?"
                    , title: "Error"
                })
            }
            else if (result) {
                db.collection('subscribers').update({
                    token: req.params.token
                }, {
                    $set: {
                        subscribed: true
                    }
                })
                res.render('confirm.ejs', {
                    response: "You're all set!"
                    , title: "Success"
                })
            }
        })
    })
});