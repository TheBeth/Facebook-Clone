const res = require('express/lib/response');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { User } = require('../models');

exports.updateProfileImg = (req, res, next) => {

    // upload to cloud in case use cloudinary
    // v--where multer upload file and use file from this field upload to cloud
    cloudinary.uploader.upload(req.file.path, async (err, result) => {
        if (err) return next(err)

        // upload url to database
        await User.update(
            { profileImg: result.secure_url },
            { where: { id: req.user.id } }
        );


        // delete pic from cloud when upload new picture
        if (req.user.profileImg) {
            const splited = req.user.profileImg.split('/');
            cloudinary.uploader.destroy(splited[splited.length - 1].split('.')[0])
        };

        fs.unlinkSync(req.file.path); // delete file from tempolary folder(public/images) when upload to cloud success
        res.json({
            message: "upload profile img complete",
            profileImg: result.secure_url // sent url file back to frontend
        })
    })
};

exports.getMe = (req, res, next) => {
    const { id, firstName, lastName, profileImg, email, phoneNumber } = req.user;
    res
      .status(200)
      .json({
        user: { id, firstName, lastName, profileImg, email, phoneNumber }
      });
}

