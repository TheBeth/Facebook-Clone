const { Op } = require('sequelize');
const { Friend, User } = require('../models');

exports.getUnknownFriend = async (req, res, next) => {
    try {
        const friends = await Friend.findAll({ // find relatetion between 2 user have status ACCEPTED or REQUESTED
            where: {
                [Op.or]: [
                    { requestToId: req.user.id },
                    { requestFromId: req.user.id }
                ]
            }
        });

        // push friend id both request and recieve request
        const friendIds = friends.reduce((acc, item) => {
            if (req.user.id === item.requestFromId) {
                acc.push(item.requestToId)
            } else {
                acc.push(item.requestFromId)
            }
            return acc;
        }, [req.user.id]); // use for exclude user when find friend

        const users = await User.findAll({
            where: {
                id: {
                    [Op.notIn]: friendIds
                }
            }
        });
        res.status(200).json({ users });
    } catch (err) {
        next(err)
    }
}

// list of friend
exports.getAllFriend = async (req, res, next) => {
    try {
        const { status, searchName } = req.query; // query status 'ACCEPTED' or 'REQUESTED'
        let where = { // set default when find friend
            [Op.or]: [
                { requestToId: req.user.id },
                { requestFromId: req.user.id }
            ]
        };
        if (status === 'ACCEPTED') { // status 'ACCEPTED' and 'REQUESTED'
            where = {
                status,
                [Op.or]: [
                    { requestToId: req.user.id },
                    { requestFromId: req.user.id }
                ]
            }
        } else if (status === 'REQUESTED') {
            where = { status, requestToId: req.user.id }
        }

        // get friend id
        const friends = await Friend.findAll({ where });

        // push friend id both request and recieve request
        const friendIds = friends.reduce((acc, item) => {
            if (req.user.id === item.requestFromId) {
                acc.push(item.requestToId)
            } else {
                acc.push(item.requestFromId)
            }
            return acc;
        }, []);

        // search with firstName or lastName use in get info friend
        let userWhere = {}
        if (searchName) {
            userWhere = {
                [Op.or]: [
                    {
                        firstName: {
                            [Op.substring]: searchName
                        }
                    },
                    {
                        lastName: {
                            [Op.substring]: searchName
                        }
                    }
                ]
            };
        }

        // get info of friend except password
        const users = await User.findAll({
            where: {
                id: friendIds,
                ...userWhere
            },
            attributes: {
                exclude: ['password']
            }
        });

        res.status(200).json({ users }); // send object value

    } catch (err) {
        next(err);
    };
};

// send request
exports.requestFriend = async (req, res, next) => {
    try {
        const { requestToId } = req.body;

        // check if request yourself
        if (req.user.id === requestToId) {
            return res.status(400).json({ message: "connot request yourself" })
        }

        // validate if user has sent or recive friend request before
        const existFriend = await Friend.findOne({
            where: {
                [Op.or]: [
                    {
                        requestFromId: req.user.id,
                        requestToId
                    },
                    {
                        requestFromId: requestToId,
                        requestToId: req.user.id
                    }
                ]
            }
        });

        // user sent or recive friend request to same friend
        if (existFriend) {
            return res
                .status(400)
                .json({ message: 'this friend has already been requested' });
        }

        // user sent request to new friend
        await Friend.create({
            requestToId,
            status: 'REQUESTED',
            requestFromId: req.user.id
        });
        res.status(200).json({ message: 'request has been sent' })

    } catch (err) {
        next(err)
    }
};

// accept request
exports.updateFriend = async (req, res, next) => {
    try {

        // it have only accept and delete request therefore don't sent status
        const { friendId } = req.params;
        const friend = await Friend.findOne({
            where: {
                requestToId: req.user.id,
                requestFromId: friendId,
                status: 'REQUESTED'
            }
        }); // friendId is id from table friends not friendRequestFrom or friendRequestTo

        // check it have request from friends table or not, this parameter id(primaryKey)
        if (!friend) {
            return res.status(400).json({ message: 'this friend request was not found' })
        }

        // if user follow by condition will change status from 'REQUESTED' to 'ACCEPTED'
        friend.status = 'ACCEPTED';
        await friend.save();
        res.status(200).json({ message: 'friend request accepted' });

    } catch (err) {
        next(err);
    }
};

// delete friend who have status 'ACCEPTED;
exports.deleteFriend = async (req, res, next) => {
    try {
        const { friendId } = req.params;
        const friend = await Friend.findOne({
            where: {
                [Op.or]: [
                    { requestToId: req.user.id, requestFromId: friendId },
                    { requestToId: friendId, requestFromId: req.user.id }
                ]
            }
        });

        if (!friend) {
            return res.status(400).json({ message: 'this friend request not fouund' })
        }

        await friend.destroy()
        res.status(204).json();

    } catch (err) {
        next(err)
    }

}