import { saveOrderImages } from '../../utils/image.js';

/**
 * Saves order images and attaches them to the order
 * This runs outside of the main transaction to avoid blocking
 * @param {Object} params
 * @param {Object} params.order - Order instance
 * @param {Array} params.files - Array of uploaded files
 * @returns {Array|null} Array of image filenames or null if no files
 */
export const saveAndAttachOrderImages = async ({ order, files }) => {
    if (!files || files.length === 0) {
        return null;
    }

    try {
        const imageFilenames = await saveOrderImages(files, { orderId: order.id });
        await order.update({ images: imageFilenames });
        return imageFilenames;
    } catch (error) {
        console.error('Failed to save order images:', error);
        // Continue without images rather than failing
        return null;
    }
};
