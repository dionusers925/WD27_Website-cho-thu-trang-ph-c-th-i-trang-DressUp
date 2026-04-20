import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

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

const uploadToBackend = async (file: File) => {
  const dataUrl = await toDataUrl(file);
  try {
    const res = await axios.post(`${API_BASE_URL}/api/uploads`, {
      dataUrl,
      fileName: file.name,
    });
    if (res?.data?.url) {
      return res.data.url as string;
    }
  } catch (error) {
    // fallback below
  }
  return dataUrl;
};

export const uploadImage = async (file: File) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return uploadToBackend(file);
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
    // fall back to backend/base64 below
  }

  return uploadToBackend(file);
};
