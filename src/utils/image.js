import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const uploadsRoot = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsRoot)) {
    fs.mkdirSync(uploadsRoot, { recursive: true });
}

export const saveLogo = async (buffer, { companyId }) => {
    const filename = `company_${companyId}_logo_${Date.now()}.png`;
    const outPath = path.join(uploadsRoot, filename);

    await sharp(buffer)
        .resize(256, 256, {
            fit: 'cover',
            position: 'center'
        })
        .png({ quality: 90 })
        .toFile(outPath);

    return filename;
};

export const saveOrderImages = async (files, { orderId }) => {
    const width = parseInt(process.env.ORDER_IMAGE_WIDTH) || 800;
    const height = parseInt(process.env.ORDER_IMAGE_HEIGHT) || 600;
    const quality = parseInt(process.env.ORDER_IMAGE_QUALITY) || 85;

    const savedImages = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filename = `order_${orderId}_image_${i + 1}_${Date.now()}.png`;
        const outPath = path.join(uploadsRoot, filename);

        await sharp(file.buffer)
            .resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .png({ quality })
            .toFile(outPath);

        savedImages.push(`uploads/${filename}`);
    }

    return savedImages;
};


