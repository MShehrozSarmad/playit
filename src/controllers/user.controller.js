import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { uploadonCloudunary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';

const gnrtAccssNdRfrshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, 'something went wrong');
    }
};

const registerUser = asyncHandler(async (req, res) => {
    //get user details form forntend
    const { username, fullName, password, email } = req.body;
    console.log(req.body);
    console.log(req.files);
    // valid - should not be empty
    if (
        [username, fullName, email, password].some((field) => {
            field?.trim() === '';
        })
    ) {
        throw new ApiError(400, 'All fields are required');
    }

    // check wether user already exist
    const existedUser = await User.findOne({
        $or: [{ email }, { username }],
    });
    if (existedUser) throw new ApiError(409, 'User already exist');

    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    if (!avatarLocalPath) throw new ApiError(400, 'avatar file is reqquired!');

    // upload images to cloudinary
    const avatar = await uploadonCloudunary(avatarLocalPath);
    const coverImage = await uploadonCloudunary(coverImageLocalPath);
    if (!avatar) throw new ApiError(400, 'avatr file is required!');

    // create user object - create entry in db
    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || '',
    });

    // check for user creation
    // remove pswrd and refresh token from response
    const createdUser = await User.findById(user._id).select(
        '-password -refreshToken'
    );
    if (!createdUser)
        throw new ApiError(500, 'something went wrong whilw registering user');

    // return response
    return res
        .status(201)
        .json(
            new ApiResponse(201, createdUser, 'user registered successfully')
        );
});

const loginUser = asyncHandler(async (req, res) => {
    // username or email based login
    // find the user
    // password check
    // access refresh token
    // send cookies

    const { email, username, password } = req.body;
    console.log(req.body);
    if (!(username || email))
        throw new ApiError(400, 'username or email is required');
    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (!user) throw new ApiError(404, 'user not found');
    const isPswrdVld = await user.isPasswordCorrect(password);
    if (!isPswrdVld) throw new ApiError(401, 'invalid cridentials');
    const { accessToken, refreshToken } = await gnrtAccssNdRfrshTokens(
        user._id
    );
    const loggedInUser = await User.findById(user._id).select(
        '-password -refreshToken'
    );
    const options = {
        httpOnly: true,
        secure: true,
    };
    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                'user loggedin successfully'
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: undefined } },
        { new: true }
    );
    const options = {
        httpOnly: true,
        secure: true,
    };
    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiError(200, {}, 'user logged out successfully'));
});

const refreshAccsToken = asyncHandler(async (req, res) => {
    const receivedRfrshTkn = req.cookies.refreshToken || req.body.refreshToken;
    if (!receivedRfrshTkn) throw new ApiError(401, 'unauthorized request');
    const decodedToken = jwt.verify(
        receivedRfrshTkn,
        process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken._id);
    if (!user) throw new ApiError(401, 'invald refresh token');
    if (receivedRfrshTkn !== user.refreshToken)
        throw new ApiError(401, 'expired or used refresh token');
    const { accessToken, refreshToken } = await gnrtAccssNdRfrshTokens(
        user._id
    );
    const options = {
        httpOnly: true,
        secure: true,
    };
    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken },
                'access token refreshed'
            )
        );
});

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = User.findById(req.user?._id);
    const isPswrdVld = await user.isPasswordCorrect(oldPassword);
    if (!isPswrdVld) throw new ApiError(401, 'invalid password');
    user.password = newPassword;
    await save({ validateBeforeSave: false });
    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'password changed successfully'));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, 'current user fetched successfully'));
});

const updateUserDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;
    if (!(fullName || email))
        throw new ApiError(401, 'all fields are required');
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { email, fullName },
        },
        { new: true }
    ).select('-password');
    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, 'details updated successfully')
        );
});

const updateAvatarImg = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) throw new ApiError(401, 'file is missing');

    const avatar = await uploadonCloudunary(avatarLocalPath);
    if (!avatar.url) throw new ApiError(401, 'failed to upload file');

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { avatar: avatar.url },
        },
        { new: true }
    ).select('-password');

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, 'avatar updated successfully'));
});

const updateCoverImg = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) throw new ApiError(401, 'file is missing');

    const coverImage = await uploadonCloudunary(coverImageLocalPath);
    if (!coverImage.url) throw new ApiError(401, 'failed to upload file');

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { coverImage: coverImage.url },
        },
        { new: true }
    ).select('-password');

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedUser,
                'cover image updated successfully'
            )
        );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccsToken,
    changePassword,
    getCurrentUser,
    updateUserDetails,
    updateAvatarImg,
    updateCoverImg
};
