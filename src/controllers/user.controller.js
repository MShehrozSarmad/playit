import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { uploadonCloudunary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';

const registerUser = asyncHandler(async (req, res) => {
    //get user details form forntend
    const { username, fullName, password, email } = req.body;
    console.log(req.body);

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
    if (existedUser) throw new ApiError(409, 'User already exis');

    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) throw new ApiError(400, 'avatar file is reqquired!');

    // upload images to cloudinary
    const avatar = await uploadonCloudunary(avatarLocalPath);
    const coverImage = await uploadonCloudunary(coverImageLocalPath);
    if (!avatar) throw new ApiError(400, 'avatr file is required!');

    // create user object - create entry in db
    const user = await User.create({
        fullName,
        email,
        username: username.toLowercase(),
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

export { registerUser };