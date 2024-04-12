import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetials, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    //image bhej paaoge ab
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )


router.route("/login").post(loginUser)

//secure route
router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

//verifyJWT middleware just to check if the user is loggedin or not
router.route("/change-password").post(verifyJWT,changeCurrentPassword)

router.route("/current-user").get(verifyJWT,getCurrentUser)

//patch to only update specific things otherwise if we use post then it will update everything
router.route("/update-account-details").patch(verifyJWT,updateAccountDetials)

router.route("/update-user-avatar").patch(verifyJWT,upload.single("avatar"), updateUserAvatar)

router.route("/update-cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

// because data is coming from params that's why we have to use like this only /c/:username (this will be the same name as you used in there)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

router.route("/watch-history").get(verifyJWT, getWatchHistory);

export default router;