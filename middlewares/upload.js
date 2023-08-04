import multer from "multer";
import path from "path";
import Jimp from "jimp";

const destination = path.resolve("tmp");

const storage = multer.diskStorage({
    destination,
    filename: (req, file, cb) => {
        const {originalname} = file;
        const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const filename = `${uniquePrefix}_${originalname}`;
        cb(null, filename);
    }
});

const limits = Jimp.read("/Users/admin/Desktop/GOIT/nodejs-homework-rest-api/public/avatars/IMG_4720.jpeg").then((image)=>{
    return image.resize(250,250);
    
}).catch((err)=>{
    console.error(err);
})



const upload = multer({
    storage,
    limits,
})

export default upload;