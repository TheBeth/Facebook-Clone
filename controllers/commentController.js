const { Post, Comment, Friend, User } = require('../models')
const { Op } = require('sequelize')

exports.createComment = async (req, res, next) => {
    try {
        const { title, postId } = req.body;

        // find it have post before
        const post = await Post.findOne({ where: { id: postId } });
        if (!post) {
            res.status(400).json({ message: 'post not found' });
        }

        // verify who can comment on post
        let canComment = req.user.id === post.userId; // user own post
        if (!canComment) { // check friend post or not?
            // WHERE status = 'ACCEPTED' AND 
            // ((requestToId = req.user.id AND requestFromId = post.userId) OR (requestToId = post.userIdAND requestFromId = req.user.id ))
            const friend = await Friend.findOne({
                where: {
                    status: 'ACCEPTED',
                    [Op.or]: [
                        {
                            requestToId: req.user.id,
                            requestFromId: post.userId
                        },
                        {
                            requestToId: post.userId,
                            requestFromId: req.user.id
                        }
                    ]
                }
            });

            if (!friend) {
                return res.status(403).json({ message: 'cannot comment this post' })
            }
        }

        const newComment = await Comment.create({
            title,
            postId,
            userId: req.user.id

        });

        const comment = await Comment.findOne({ // send new comment to database and user who comment or post
            where: { 
                id: newComment.id
            },
            include: [
                {
                    model: User,
                    attributes: ['id', "firstName", 'lastName', 'profileImg']
                }
            ]
        });

        res.status(201).json({ comment });
    } catch (err) {
        next(err);
    }
}

exports.deleteComment = async (req, res, next) => {
    try {
        // sent value postId that user want to delete to params (incase sent via json)
        const { id } = req.params;
        const comment = await Comment.findOne({ where: { id } })
        const post = await Post.findOne({ where: { id } })
        if (!comment) {
            return res.status(400).json({ message: "comment not found" })
        }

        //check comment own by user or not?
        if (req.user.id !== comment.userId && req.user.id !== post.userId) { // verify that user are own comment or own post or not?
            return res.status(403).json({ message: "cannot delete comment" })
        }

        await comment.destroy();

        res.status(204).json();

    } catch (err) {
        next(err);
    }
}