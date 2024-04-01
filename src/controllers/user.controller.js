import { asyncHandler } from "../utils/asyncHandler.js";

//method hai ye 
const registerUser = asyncHandler( async (req,res) => {
    res.status(200).json({
        message:"Finallyy Working!!!"
    })
})

export {registerUser}