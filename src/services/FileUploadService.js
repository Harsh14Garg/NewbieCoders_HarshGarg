const cloudinary = require('cloudinary').v2;
const config = require('../config/config');

// Configure Cloudinary if credentials provided
if (config.cloudinary.cloudName && config.cloudinary.apiKey) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

class FileUploadService {
  /**
   * Upload event poster to Cloudinary
   */
  async uploadEventPoster(fileBuffer, fileName) {
    try {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'spoton/events',
            resource_type: 'auto',
            public_id: `poster_${Date.now()}`,
            transformation: [{ width: 1200, height: 630, crop: 'fill' }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve({
              url: result.secure_url,
              publicId: result.public_id,
              size: result.bytes,
              format: result.format,
            });
          }
        );

        stream.end(fileBuffer);
      });
    } catch (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Upload user avatar
   */
  async uploadUserAvatar(fileBuffer, userId) {
    try {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'spoton/avatars',
            resource_type: 'auto',
            public_id: `avatar_${userId}`,
            transformation: [{ width: 200, height: 200, crop: 'thumb', gravity: 'face' }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        );

        stream.end(fileBuffer);
      });
    } catch (error) {
      throw new Error(`Avatar upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('File deletion failed:', error);
      return false;
    }
  }

  /**
   * Mock upload for development
   */
  mockUpload(fileName) {
    return {
      url: `https://via.placeholder.com/1200x630?text=${encodeURIComponent(fileName)}`,
      publicId: `mock_${Date.now()}`,
    };
  }
}

module.exports = new FileUploadService();
