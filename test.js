require("dotenv").config();
const cloudinary = require("./src/config/cloudinary");
cloudinary.uploader.upload("./Images/cairo/hilton-grand-nile/general/27.jpg")
.then(res => console.log(res.secure_url))
  .catch(err => console.log(err));





















// https://sufar-7d5k88zza-nada-khaled21s-projects.vercel.app/api/....

   //nodemon server.js 
  // npm run dev
  // npm install cloudinary
  // node test.js
  //npm install cloudinary mongoose dotenv fs-extra path
  //npm install axios
  //  npm run seed
  //  git add .
  // git commit -m "update"
//  git add . && git commit -m "fix: vercel serverless support" && git push

  // https://sufar-rho.vercel.app/

  //GET /api/hotels?city=cairo
//GET /api/hotels/:slug
