import multer from "multer";

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, "./public/temp")
//     },
//     filename: function (req, file, cb) {
      
//       cb(null, file.originalname)
//     }
//   })

//   export const upload = multer({
//     storage,
//   })

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("Destination:", file.originalname); // Debugging
    cb(null, "../../assets/temp");
  },
  filename: function (req, file, cb) {
    console.log("Filename:", file.originalname); // Debugging
    cb(null, file.originalname);
  }
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    console.log("File Filter:", file); // Debugging
    cb(null, true);
  },
});
