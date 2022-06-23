const util = require('util');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { Like, Comment, Post, Friend, User, sequelize } = require('../models')
const { Op } = require('sequelize');

const uploadPromise = util.promisify(cloudinary.uploader.upload); // upload via promise function

exports.getAllPost = async (req, res, next) => {
    try {
        const friends = await Friend.findAll({
            where: {
                [Op.or]: [{ requestToId: req.user.id }, { requestFromId: req.user.id }],
                status : 'ACCEPTED'
            }
        });

        const userIds = friends.reduce((acc, item) => {
            if (req.user.id === item.requestFromId) {
                acc.push(item.requestToId)
            } else {
                acc.push(item.requestFromId)
            }
            return acc;
        }, [req.user.id]); // initial value in case mean empty array wait for put a value

        const posts = await Post.findAll({
            where: { userId: userIds },
            include: [
                {
                    // get item id, firstName, lastName from model User to show in feed
                    model: User,
                    attributes: ['id', "firstName", 'lastName', 'profileImg']
                },
                {
                    model: Comment,
                    include: {
                        model: User,
                        attributes: ['id', 'firstName', 'lastName', 'profileImg']
                    }
                },
                {
                    model: Like,
                    include: {
                        model: User,
                        attributes: ['id', 'firstName', 'lastName']
                    }
                }
            ],
            order: [['createdAt', 'DESC']] // sort comment by date and time created
        });

        res.status(200).json({ posts });

    } catch (err) {
        next(err)
    }
}

// create post with text or/and title
exports.createPost = async (req, res, next) => {
    try {
        // post don't have title or image
        const { title } = req.body;
        if (!title && !req.file) {
            return res.status(400).json({ message: "require title or image " })
        }

        let result = {};

        // when upload file(in case image) successful then delete file from temp folder(public/imagess)
        if (req.file) {
            result = await uploadPromise(req.file.path);
            fs.unlinkSync(req.file.path);
        }

        // return value to database
        const post = await Post.create({
            title,
            userId: req.user.id,
            img: result.secure_url
        });

        res.status(201).json({ post });
    } catch (err) {
        next(err);
    }
};

// delete post that created by user
exports.deletePost = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        // delete post which have relation hasMany with Like and Comment that mean delete private key must to delete foreign key
        const { id, img } = req.params;
        const post = await Post.findOne({ where: { id } });
        if (!post) {
            return res.status(400).json({ message: 'post not found' });
        }

        await Like.destroy({ where: { postId: id } }, { transaction })
        await Comment.destroy({ where: { postId: id } }, { transaction })
        await Post.destroy({ where: { id } }, { transaction })
        await transaction.commit();
        res.status(200).json();
    } catch (err) {
        await transaction.rollback();
        next(err);
    }
}