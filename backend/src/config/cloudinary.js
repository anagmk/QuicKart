import { v2 as cloudinary } from "cloudinary";

const cloudinaryUrl = process.env.CLOUDINARY_URL;

if (cloudinaryUrl) {
  const credentials = new URL(cloudinaryUrl);
  cloudinary.config({
    cloud_name: credentials.hostname.split(".")[0],
    api_key: decodeURIComponent(credentials.username),
    api_secret: decodeURIComponent(credentials.password),
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export default cloudinary;
