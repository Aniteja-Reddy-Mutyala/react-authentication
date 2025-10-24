require("dotenv").config();
const {google}=require("googleapis");
const axios=require('axios')
const {db,saveDb}=require('./db')
const oauthClient=new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/auth/google/callback'

);
const getGoogleOauthUrl=()=>{
  const scopes=[
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ]
  return oauthClient.generateAuthUrl({
    access_type:'offline',
    prompt:"consent",
    scope:scopes,
  })
}
const getGoogleUser=async(code)=>{
  const {tokens}=await oauthClient.getToken(code);
  const response=await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo`,
    {headers:{Authorization:`Bearer ${tokens.access_token}`}},
  )
  return response.data;
}
const updateOrCreateUserFromOauth=async (oauthuserInfo)=>{
  const{
    id:googleId,
    verified_email:isVerified,
    email,
  }=oauthuserInfo
  const existingUser=db.users.find(user=>user.email===email)
  if(existingUser){
    existingUser.googleId=googleId;
    existingUser.isVerified=isVerified
    saveDb();
    return existingUser
  }else{
     const newUser={
      email,
      googleId,
      isVerified,
      info:{}
    }
    db.users.push(newUser)
  }
  saveDb();
  return newUser
}
module.exports={getGoogleOauthUrl,getGoogleUser,updateOrCreateUserFromOauth}