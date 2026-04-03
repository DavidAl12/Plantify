const CLOUDINARY_CLOUD_NAME = "dsmeua9up";
const CLOUDINARY_UPLOAD_PRESET = "plantify_uploads";

export const uploadToCloudinary = async (base64) => {
  const formData = new FormData();
  formData.append("file", `data:image/jpeg;base64,${base64}`);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "plantify");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) throw new Error(`Cloudinary error: ${response.status}`);

  const data = await response.json();
  return data.secure_url;
};