require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { db, saveDb } = require("./db");
const { sendEmail } = require("./sendEmail");
const app = express();
app.use(express.json());
console.log("Api key is :",process.env.SENDGRID_API_KEY)
// Endpoints go here
app.post("/api/sign-up", async (req, res) => {
  const { email, password } = req.body;
  const matching_users = db.users.find((user) => user.email === email);
  if (matching_users) {
    return res.sendStatus(409);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  const verificationString=uuidv4();
  const startingInfo = {
    hairColor: "",
    favoriteFood: "",
    bio: "",
  };
  db.users.push({
    id,
    email,
    passwordHash,
    info: startingInfo,
    isVerified: false,
    verificationString,
  });
  saveDb();
  try{
sendEmail({
  to: "aniteja.reddy@gmail.com",
  from: "aniteja.reddy@gmail.com",
  subject: "Please verify",
  text: `To verify please click here:http://localhost:5173/verify-email/${verificationString}`,
});
  }
  catch(e){
    console.log(e)
    res.sendStatus(500);
  }
  jwt.sign(
    {
      id,
      email,
      info: startingInfo,
      isVerified: false,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "2d",
    },
    (err, token) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.json({ token });
    }
  );
});
app.post("/api/log-in", async (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find((user) => user.email === email);
  if (!user) {
    return res.sendStatus(401);
  }
  const passwordIsCorrect = await bcrypt.compare(password, user.passwordHash);
  if (passwordIsCorrect) {
    const { id, email, info, isVerified } = user;
    jwt.sign(
      {
        id,
        email,
        info,
        isVerified,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2d",
      },
      (err, token) => {
        if (err) {
          return res.status(500).send(err.message);
        }
        res.json({ token });
      }
    );
  } else {
    res.sendStatus(401);
  }
});
app.put("/api/users/:userId", async (req, res) => {
  const { authorization } = req.headers;
  const { userId } = req.params;

  if (!authorization) {
    return res.status(401).json({ message: "No authorization header sent" });
  }
  const user = db.users.find((user) => user.id === userId);
  if (!user) {
    return res.sendStatus(404).json({ message: "Invalid user" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unable to verify token" });
    }
    const { id } = decoded;
    if (id !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this user" });
    }
    const { favoriteFood, hairColor, bio } = req.body;
    const updates = {
      favoriteFood,
      hairColor,
      bio,
    };
    user.info.favoriteFood = updates.favoriteFood || user.info.favoriteFood;
    user.info.hairColor = updates.hairColor || user.info.hairColor;
    user.info.bio = updates.bio || user.info.bio;
    saveDb();
    jwt.sign(
      {
        id:user.id,
        email:user.email,
        info:user.info,
        isVerified:user.isVerified,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2d",
      },
      (err, token) => {
        if (err) {
          return res.status(500).send(err.message);
        }
        res.json({ token });
      }
    );
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));
