import multer from 'multer';
import serverConfig from '../config/server.js';

const storageA = multer.diskStorage({
  destination: function (req, file, cb) {
    if (serverConfig.NODE_ENV == 'production') {
      cb(null, 'public/images');
    } else if (serverConfig.NODE_ENV == 'development') {
      cb(null, 'public/images');
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  },
});

const image = multer({ storage: storageA });

export default { image };
