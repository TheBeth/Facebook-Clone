const express = require('express');
const router = express.Router();
const authentication = require('../middlewares/authenticate');
const friendController = require('../controllers/friendController')

router.get('/unknown', authentication, friendController.getUnknownFriend) // grt user who don't have both of status 'ACCEPTED' or 'REQUSTED'
router.get('/',authentication, friendController.getAllFriend) // get friend that user accept request
router.post('/', authentication, friendController.requestFriend); // post for create friend request
router.patch('/:friendId', authentication, friendController.updateFriend); // patch for update friend status to accept or delete request
router.delete('/:friendId', authentication, friendController.deleteFriend); // delete friend who accepted


module.exports = router;