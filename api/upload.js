const { IncomingForm } = require('formidable');
const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');

module.exports.config = {
    api: {
        bodyParser: false,
    },
};

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
        console.error("Server configuration error: Missing Telegram environment variables.");
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    const form = new IncomingForm();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error("Error parsing form:", err);
            return res.status(500).json({ message: 'Error parsing the file.' });
        }
        
        const file = files.file[0];
        // Получаем имя пользователя из полей формы
        const username = fields.username ? fields.username[0] : 'Unknown User';

        if (!file) {
             return res.status(400).json({ message: 'No file uploaded.' });
        }

        const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;

        try {
            const formData = new FormData();
            formData.append('chat_id', CHAT_ID);
            formData.append('document', fs.createReadStream(file.filepath), file.originalFilename);
            // Формируем подпись с именем пользователя
            formData.append('caption', `Новый файл от ${username}: ${file.originalFilename}`);

            const telegramResponse = await fetch(telegramApiUrl, {
                method: 'POST',
                body: formData,
            });

            const telegramResult = await telegramResponse.json();

            if (!telegramResult.ok) {
                console.error("Telegram API Error:", telegramResult.description);
                throw new Error(telegramResult.description || 'Telegram API error');
            }

            res.status(200).json({ 
                message: 'File uploaded successfully!', 
                fileName: file.originalFilename 
            });

        } catch (error) {
            console.error('Error sending to Telegram:', error);
            res.status(500).json({ message: `Failed to send to Telegram: ${error.message}` });
        }
    });
};