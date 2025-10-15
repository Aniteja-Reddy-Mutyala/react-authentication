import { useState,useEffect } from "react";
import { useToken } from "./useToken";

export const useUser=()=>{
  const[token]=useToken();
  const getPayloafFromToken=token=>{
    const encodedPayLoad=token.split('.')[1];
    return JSON.parse(atob(encodedPayLoad));
    
  }
   const[user,setUser]=useState(()=>{
    if(!token){
      return null;
    }
    else{
      return getPayloafFromToken(token)
    }
   })
   useEffect(()=>{
      if(!token){
        setUser(null);
      }
      else{
        setUser(getPayloafFromToken(token))
      }
   },[token])
   return user;
}
