import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { ApiError } from './apiError';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadonCloudunary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        });
        console.log('file is uploaded successfully! path:: ', response.url);
        return response;
    } catch (error) {
        throw new ApiError(500, 'failed to upload image');
        // return null;
    } finally {
        fs.unlink(localFilePath);
    }
};

export { uploadonCloudunary };
