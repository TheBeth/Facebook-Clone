const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const authenticate  = require('../middlewares/authenticate')
const upload = require('../middlewares/upload') // 1pic use .single many pic use .array

const router = express.Router();

router.get('/me',authenticate, userController.getMe);
router.post('/register', authController.register);
router.post('/login', authController.login);                
router.patch(
    '/profile-img', 
    authenticate, // req.user 
    upload.single('profileImg'), // req.file , key name when upload file via postman or another
    userController.updateProfileImg);

module.exports = router;