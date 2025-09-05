import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
    // this will save the file with its original name
    // you might want to add some unique identifier to avoid overwriting files
  }
})

export const upload = multer({
     storage,
})   