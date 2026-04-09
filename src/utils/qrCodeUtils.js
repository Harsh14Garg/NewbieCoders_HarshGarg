const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const generateQRCode = async (ticketData) => {
  try {
    const qrString = JSON.stringify({
      ticketId: ticketData.ticketId,
      eventId: ticketData.eventId,
      userId: ticketData.userId,
      uniqueCode: uuidv4(),
      timestamp: new Date().toISOString(),
    });

    const qrImage = await QRCode.toDataURL(qrString);
    return {
      qrString,
      qrImage,
    };
  } catch (error) {
    throw new Error(`QR Code generation failed: ${error.message}`);
  }
};

const generateQRString = (ticketData) => {
  return JSON.stringify({
    ticketId: ticketData.ticketId || uuidv4(),
    eventId: ticketData.eventId,
    userId: ticketData.userId,
    uniqueCode: uuidv4(),
    timestamp: new Date().toISOString(),
  });
};

const parseQRCode = (qrString) => {
  try {
    return JSON.parse(qrString);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateQRCode,
  generateQRString,
  parseQRCode,
};
