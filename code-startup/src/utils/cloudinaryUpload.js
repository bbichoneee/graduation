const CLOUDINARY_CLOUD_NAME = "db45mrscc"; // e.g., "my-cloud-account"
const CLOUDINARY_UPLOAD_PRESET = "codestartup"; // e.g., "unsigned_uploads"
// !!! IMPORTANT: Do NOT commit your actual credentials to a public repository !!!

export async function uploadImageToCloudinary(file) {
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  try {
    console.log("Attempting real Cloudinary upload for:", file.name);
    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Cloudinary upload failed: ${errorData.error.message}`);
    }

    const data = await response.json();
    console.log("Cloudinary upload successful:", data.secure_url);
    return data.secure_url; // This is the public URL of the uploaded image
  } catch (error) {
    console.error("Error during Cloudinary upload:", error);
    throw error; // Re-throw the error to be handled by the calling component
  }
}