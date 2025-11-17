import Redis from 'ioredis';
import { IncomingForm } from 'formidable';
import fetch from 'node-fetch';
import { createReadStream } from 'fs';
import FormData from 'form-data';

const redis = new Redis(process.env.REDIS_URL);

export const config = {
    api: { bodyParser: false },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    const form = new IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err) return res.status(500).json({ message: 'Error parsing the file.' });

        const file = files.file[0];
        const username = fields.username ? fields.username[0] : 'Unknown User';

        if (!file) return res.status(400).json({ message: 'No file uploaded.' });

        try {
            const formData = new FormData();
            formData.append('chat_id', CHAT_ID);
            formData.append('document', createReadStream(file.filepath), file.originalFilename);
            formData.append('caption', `Новый файл от ${username}: ${file.originalFilename}`);

            const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, { method: 'POST', body: formData });
            const tgResult = await tgResponse.json();
            if (!tgResult.ok) throw new Error(tgResult.description);

            // Сохраняем данные в Redis
            const submissionKey = `submission:${username.replace(/\s/g, '_')}`;
            const submissionData = { status: 'submitted', date: new Date().toISOString() };
            
            // Redis хранит строки, поэтому объект нужно преобразовать в JSON
            await redis.set(submissionKey, JSON.stringify(submissionData));

            res.status(200).json({ message: 'File uploaded successfully!', fileName: file.originalFilename });
        } catch (error) {
            console.error('Upload Error:', error);
            res.status(500).json({ message: error.message });
        }
    });
}