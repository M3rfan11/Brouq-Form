const QRCode = require('qrcode');

/**
 * Generate QR code as buffer
 * @param {string} data - Data to encode in QR code
 * @returns {Promise<Buffer>} QR code image buffer
 */
async function generateQRCode(data) {
  try {
    const qrCodeBuffer = await QRCode.toBuffer(data, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeBuffer;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Generate QR code as data URL (for frontend display)
 * @param {string} data - Data to encode in QR code
 * @returns {Promise<string>} QR code data URL
 */
async function generateQRCodeDataURL(data) {
  try {
    const dataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return dataURL;
  } catch (error) {
    console.error('Error generating QR code data URL:', error);
    throw error;
  }
}

module.exports = { generateQRCode, generateQRCodeDataURL };
