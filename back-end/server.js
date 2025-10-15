require('dotenv').config();
const express = require('express');
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
const {v4:uuidv4}=require('uuid')
const {db,saveDb}=require('./db')
const app = express();
app.use(express.json());

// Endpoints go here
app.post("/api/sign-up",async(req,res)=>{
  const {email,password}=req.body;
   const matching_users=db.users.find(user=>user.email===email);
   if(matching_users){
    return res.sendStatus(409);
   }
   const passwordHash= await bcrypt.hash(password,10);
   const id=uuidv4();
   const startingInfo={
    hairColor:'',
    favouriteFood:'',
    bio:''
   }
   db.users.push({
    id,
    email,
    passwordHash,
    info:startingInfo,
    isVerified:false
   })
   saveDb();
   jwt.sign({
    id,
    email,
    info:startingInfo,
    isVerified:false
   },process.env.JWT_SECRET,{
    expiresIn:"2d",
   },(err,token)=>{
    if(err){
      return res.status(500).send(err.message)
    }
    res.json({token});
   })
   
})

app.listen(3000, () => console.log('Server running on port 3000'));