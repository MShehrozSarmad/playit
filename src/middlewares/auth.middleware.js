import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const verifyJWT = asyncHandler(async (req, _, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header('Authorization')?.replace('Bearer ', '') || req.body.accessToken;
    if (!token) throw new ApiError(401, 'unauthorized request');
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
        '-password -refreshToken'
    );
    if (!user) throw new ApiError(401, 'Invalid access token');
    req.user = user;
    next();
});

export default verifyJWT;
