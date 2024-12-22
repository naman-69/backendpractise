import multer from "multer";

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, "../../assets/temp")
//     },
//     filename: function (req, file, cb) {
      
//       cb(null, file.originalname)
//     }
//   })

//   export const upload = multer({
//     storage,
//   })

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     console.log("Destination:", file.originalname); // Debugging
//     cb(null, "../../assets/temp");
//   },
//   filename: function (req, file, cb) {
//     console.log("Filename:", file.originalname); // Debugging
//     cb(null, file.originalname);
//   }
// });

// export const upload = multer({
//   storage,
//   fileFilter: (req, file, cb) => {
//     console.log("File Filter:", file); // Debugging
//     cb(null, true);
//   },
// });

// export const upload = multer({
//   storage: multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, 'uploads/');
//     },
//     filename: function (req, file, cb) {
//       cb(null, `${Date.now()}-${file.originalname}`);
//     },
//   }),
// }).fields([
//   { name: 'profile_pic', maxCount: 1 },
//   { name: 'resume', maxCount: 1 },
// ]);


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './src/assets/temp');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });
export default upload;