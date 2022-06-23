const multer = require('multer')

const storage = multer.diskStorage({
    destination: (req, file, cb) => { //follow syntax cb = callback
        cb(null, 'public/images') //if error change null to error
    },
    filename: (req, file, cb) => {
        // console.log(req);
        // console.log(file);
        cb(null,'' + new Date().getTime() + '.' + file.mimetype.split('/')[1]); // rename by time and change to string use '' + .....
    }               // name string " date + . + mimetype(include jpg, png,...) "  
});

module.exports = multer({ storage });