import { CLOUDINARY_UPLOAD_URL, CLOUDINARY_UPLOAD_PRESET } from '../constants/config';

// Uploads a picked image (expo-image-picker's local file:// URI) directly to Cloudinary and
// returns the permanent https:// URL. This has to happen before a post/avatar update reaches
// our backend — a local file:// URI only exists on the device that picked it, so sending that
// straight to the API would leave the image broken on every other user's screen.
const uploadImage = async (localUri) => {
  const filename = localUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename || '');
  const ext = match ? match[1].toLowerCase() : 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';

  const formData = new FormData();
  formData.append('file', { uri: localUri, name: filename || `upload.${ext}`, type: mimeType });
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: formData });
  const data = await response.json();

  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || 'Image upload failed. Please try again.');
  }
  return data.secure_url;
};

export default { uploadImage };
