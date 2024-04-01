// require('dotenv').config({path: './env'})

import dotenv from "dotenv"
import connectDB from "./db/index.js"
import { app } from "./app.js"

dotenv.config({
    path: './env'
})

connectDB()
.then( () => {
    app.listen(process.env.PORT || 4000 , () => {
        console.log(`Server is running at port: ${process.env.PORT}`);
    })
})
.catch( (err) => {
    console.log(`MONGO DB connection error,${err}`);
})




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