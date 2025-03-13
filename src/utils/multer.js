import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(`public/${file.fieldname}`)) {
            fs.mkdirSync(`public/${file.fieldname}`);
        }
        cb(null, `public/${file.fieldname}`)
    },
    filename: function (req, file, cb) {
        let exe = file.originalname.split(".").pop();
        let filename = `${Date.now()}.${exe}`;
        cb(null, filename);
    }
})

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        let ext = path.extname(file.originalname);
        if (ext === '.pdf' || ext === '.jpg' || ext === '.png') {
            cb(null, true);
        } else {
            cb(new Error('Only.pdf,.jpg,.png files are allowed.'));
        }
    }
})


export default upload