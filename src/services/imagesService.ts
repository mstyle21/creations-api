import sharp from "sharp";
import path from "path";

export const uploadImage = async (originalImage: Buffer, folder: string, filename: string) => {
  await processImage(originalImage, path.join(folder, filename));
  await createThumbnail(originalImage, path.join(folder, `thumbnail_${filename}`));
};

const createThumbnail = async (originalImage: Buffer, destination: string) => {
  try {
    await sharp(originalImage)
      .resize({
        width: 250,
        height: 250,
      })
      .toFormat("jpeg", { quality: 75 })
      .toFile(destination);
  } catch (error) {
    console.log(error);
  }
};

const processImage = async (originalImage: Buffer, destination: string) => {
  try {
    await sharp(originalImage).toFormat("jpeg", { quality: 75 }).toFile(destination);
  } catch (error) {
    console.log(error);
  }
};
