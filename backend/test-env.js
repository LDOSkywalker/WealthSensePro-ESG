require('dotenv').config();
console.log('PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'OK' : 'NOT FOUND'); 