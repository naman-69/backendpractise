//first approach

// require('dotenv').config({path:'./env'});

// const mongoose = require('mongoose');

// const {DB_NAME}=require('./constants');
// const { default: connectDb } = require('./db');





// (async ()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

//         app.on("errorr:",(error)=>{
//             console.log("error is:",error);
//             throw error;
//         })

//         app.listen(process.env.PORT,()=>{
//             console.log(`APP is listing on the${process.env.PORT}`); 
//         })
//     }catch(error){
//         console.error("Error:",error);
//         throw err;
//     }
// })();


//second approach


// require('dotenv').config({path:'./env'});

import dotenv from "dotenv";
import {app} from './app.js'
import connectDb from './db/index.js';

dotenv.config({path:'./env'});

connectDb()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`server is running at the port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MongoDb Connection Failed!!",err);
})