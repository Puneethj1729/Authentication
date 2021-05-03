//jshint esversion:6
require('dotenv').config()
const express=require('express');
const bodyParser=require('body-parser');
const ejs=require('ejs');
const mongoose=require('mongoose');
const encrypt=require('mongoose-encryption');
const app=express();
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static('public'));
mongoose.connect('mongodb://localhost:27017/usersDB',{ useNewUrlParser: true, useUnifiedTopology: true});
const userSchema=new mongoose.Schema({
  email:String,
  password:String
});
const secret=process.env.SECRET;
userSchema.plugin(encrypt,{secret:secret,encryptedFields: ['password']});
const User=new mongoose.model('User',userSchema);
app.get('/',function(req,res){
  res.render('home');
});
app.get('/register',function(req,res){
  res.render('register');
});
app.get('/login',function(req,res){
  res.render('login');
});
app.post('/register',function(req,res){
  const userName=req.body.username;
  const passWord=req.body.password;
  const newUser=new User({
    email:userName,
    password:passWord
  });
  newUser.save(function(err){
    if (err){
      res.send(err);
    }
    else{
      res.render('secrets');
    }
  });
});
app.post('/login',function(req,res){
  const username=req.body.username;
  const password=req.body.password;
  User.findOne({email:username},function(err,foundUser){
    if (err) {
      console.log(err);
    }
      if (foundUser){
        if (foundUser.password===password){
          res.render('secrets');
        }
        else{
          res.send('Authentication Unsuccessfull!');
        }
      }
  });
});
app.listen(3000,function(err){
  if (err) throw err;
  else{
    console.log('Successfully started Server at 3000');
  }
});
