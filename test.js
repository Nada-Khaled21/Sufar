require("dotenv").config();
const cloudinary = require("./src/config/cloudinary");
cloudinary.uploader.upload("./Images/cairo/hilton-grand-nile/general/27.jpg")
.then(res => console.log(res.secure_url))
  .catch(err => console.log(err));























   //nodemon server.js 
  // npm run dev
  // npm install cloudinary
  // node test.js
  //npm install cloudinary mongoose dotenv fs-extra path
  //npm install axios
  // node seedData.js

  //GET /api/hotels?city=cairo
//GET /api/hotels/:slug
