require("dotenv").config();
const { sendEmail } = require("./sendEmail");
sendEmail({
  to: "aniteja.reddy@gmail.com",
  from: "aniteja.reddy@gmail.com",
  subject: "Does this work?.",
  text: `If you \'re reading this,then yes`,
})
  .then(() => console.log("Email sent"))
  .catch((error) => console.log(error));
