const multer = require('multer');
const moment = require('moment');

// path 
const storage = multer.diskStorage({
    // path to image
    destination(req, file, cb) {
        cb(null, 'images');
    },
    
    // change image`s name
    filename(req, file, cb) {
        const date = moment().format('DDMMYYYY-HHmmss_SSS');
        cb(null, `${date}-${file.originalname}`);
    }
});

const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg'];

// validation to image
const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

module.exports = multer({
    storage,
    fileFilter
});