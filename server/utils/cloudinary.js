const cloudinary = require("cloudinary").v2;
const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = require("../config");

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

async function uploadImage(image) {
  if (!image) {
    throw new Error("No image provided for upload");
  }

  const result = await cloudinary.uploader.upload(image, {
    folder: "fragrance-products",
  });

  return result.secure_url;
}

module.exports = {
  uploadImage,
};

