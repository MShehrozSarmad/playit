import { Router } from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import verifyJWT from '../middlewares/auth.middleware.js';
import {
    changePassword,
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory,
    loginUser,
    logoutUser,
    refreshAccsToken,
    registerUser,
    updateAvatarImg,
    updateCoverImg,
    updateUserDetails,
} from '../controllers/user.controller.js';

const router = Router();

router.route('/register').post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1,
        },
        {
            name: 'coverImage',
            maxCount: 1,
        },
    ]),
    registerUser
);

router.route('/login').post(loginUser);

// secure routes
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/refresh-token').post(refreshAccsToken);
router.route('/change-password').post(verifyJWT, changePassword);
router.route('/current-user').get(verifyJWT, getCurrentUser);
router.route('/update-account').patch(verifyJWT, updateUserDetails);
router
    .route('/update-avatar')
    .patch(verifyJWT, upload.single('file'), updateAvatarImg);
router
    .route('/update-cover')
    .patch(verifyJWT, upload.single('file'), updateCoverImg);
router.route('/channel/:username').get(verifyJWT, getUserChannelProfile);
router.route('/watch-history').get(verifyJWT, getWatchHistory);

export default router;
