import axios from "axios";

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Invalid file result"));
      }
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("File read error"));
    };
    reader.readAsDataURL(file);
  });

export const uploadImage = async (file: File) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return toDataUrl(file);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData
    );
    if (res?.data?.secure_url) {
      return res.data.secure_url;
    }
  } catch (error) {
    // fall back to data url below
  }

  return toDataUrl(file);
};
