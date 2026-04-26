test-image.js
const hotelName = "Four Seasons Cairo";
const stars = 5;
const locationType = "City Center";

const category = stars >= 5 ? 'luxury' :
                 stars === 4 ? 'hotel' : 'budget';

const location = locationType === 'Beach' ? 'beach-resort' :
                 locationType === 'Mountain' ? 'mountain-lodge' :
                 locationType === 'Desert' ? 'desert-camp' : 'city-hotel';

const images = Array.from({ length: 5 }, (_, i) =>
  `https://picsum.photos/seed/${category}-${location}-${hotelName.replace(/\s/g,'-')}-${i+1}/800/600`
);

console.log(images);