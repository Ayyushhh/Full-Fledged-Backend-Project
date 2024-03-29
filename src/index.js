// require('dotenv').config({path: './env'})

import dotenv from "dotenv"
import connectDB from "./db/index.js"

dotenv.config({
    path: './env'
})

connectDB()







// FIRST APPROACH
/*
import express from "express";

const app = express()

// ifease
( async () => {
    try{
        // connect db and then / and name of the db
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        
        app.on("error",(error) =>{
            console.log("Unable to talk to Express");
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error){
        console.error("ERROR".error)
        throw error
    }
})() 
*/