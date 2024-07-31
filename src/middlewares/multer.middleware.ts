import multer from 'multer'

const storage = multer.diskStorage({
    destination: (res,file,cb) => {
        cb(null, "./public/temp")
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now();
        let split = file.originalname.split('.');
        cb(null, `${split[0]}_${uniqueSuffix}.${split[split.length - 1]}`);
    }
    }
)
export const upload = multer({storage: storage})