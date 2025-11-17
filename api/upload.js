import { IncomingForm } from 'formidable';
import fetch from 'node-fetch';
import { createReadStream } from 'fs';
import FormData from 'form-data';

// Vercel требует, чтобы конфигурация body-parser была выключена
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Получаем токен и ID чата из переменных окружения (безопасно!)
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    const form = new IncomingForm();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(500).json({ message: 'Error parsing the file.' });
        }

        const file = files.file[0];
        const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;

        try {
            // Создаем новые form-data для отправки в Telegram
            const formData = new FormData();
            formData.append('chat_id', CHAT_ID);
            formData.append('document', createReadStream(file.filepath), file.originalFilename);
            formData.append('caption', `Новый файл: ${file.originalFilename}`);

            const telegramResponse = await fetch(telegramApiUrl, {
                method: 'POST',
                body: formData,
            });

            const telegramResult = await telegramResponse.json();

            if (!telegramResult.ok) {
                throw new Error(telegramResult.description || 'Telegram API error');
            }

            // Отправляем успешный ответ на фронтенд
            res.status(200).json({ 
                message: 'File uploaded successfully!', 
                fileName: file.originalFilename 
            });

        } catch (error) {
            console.error('Error sending to Telegram:', error);
            res.status(500).json({ message: `Failed to send to Telegram: ${error.message}` });
        }
    });
}