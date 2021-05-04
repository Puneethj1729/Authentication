//jshint esversion:6
require('dotenv').config()
const express=require('express');
const bodyParser=require('body-parser');
const ejs=require('ejs');
const mongoose=require('mongoose');
const session=require('express-session');
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');
const app=express();
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require('mongoose-findorcreate');
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static('public'));
//Session Initilaization
app.use(session({
  secret:'This a little secret.',
  resave: false,
  saveUninitialized: false,
}));
//Passport Initialization
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect('mongodb://localhost:27017/usersDB',{ useNewUrlParser: true, useUnifiedTopology: true,useCreateIndex:true});
const userSchema=new mongoose.Schema({
  email:String,
  password:String,
  googleId:String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User=new mongoose.model('User',userSchema);
passport.use(User.createStrategy());
// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
app.get('/',function(req,res){
  res.render('home');
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });
app.get('/register',function(req,res){
  res.render('register');
});
app.get('/login',function(req,res){
  res.render('login');
});
app.get('/secrets',function(req,res){
  if (req.isAuthenticated())
  {
    res.render('secrets');
  }
  else{
    res.redirect('/login');
  }

});
app.get('/logout',function(req,res){
  req.logout();
  res.redirect('/');
});
app.post('/register',function(req,res){
   User.register({username:req.body.username},req.body.password,function(err,user){
     if (err){
       console.log(err);
       res.redirect('/register');
     }
     else{
       passport.authenticate('local')(req,res,function(){
         res.redirect('/secrets');
       });
     }
   });

});
app.post('/login',function(req,res){
const user=new User({
  username:req.body.username,
  password:req.body.password
});
req.login(user,function(err){
  if (err){
    console.log(err);
  }
  else{
    passport.authenticate('local')(req,res,function(){
      res.redirect('/secrets');
    });
  }
});
});
app.listen(3000,function(err){
  if (err) throw err;
  else{
    console.log('Successfully started Server at 3000');
  }
});
