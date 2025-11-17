import Redis from 'ioredis';
import { IncomingForm } from 'formidable';
import fetch from 'node-fetch';
import { createReadStream } from 'fs';
import FormData from 'form-data';

const redis = new Redis(process.env.REDIS_URL);

// Отключаем стандартный парсер Vercel, чтобы мы могли обрабатывать разные Content-Type
export const config = {
    api: { bodyParser: false },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const contentType = req.headers['content-type'];

    try {
        let submissionData;

        // --- Обработка ФАЙЛА ---
        if (contentType && contentType.includes('multipart/form-data')) {
            const { file, username } = await parseForm(req);
            if (!file || !username) {
                return res.status(400).json({ message: 'File and username are required.' });
            }
            
            // Отправка в Telegram
            await sendFileToTelegram(file, username);
            
            submissionData = {
                status: 'submitted',
                type: 'file',
                content: file.originalFilename, // Сохраняем имя файла
                date: new Date().toISOString()
            };
            await saveDataToRedis(username, submissionData);

        // --- Обработка ССЫЛКИ ---
        } else if (contentType && contentType.includes('application/json')) {
            const body = await readJsonBody(req);
            const { type, content, username } = body;
            
            if (type !== 'link' || !content || !username) {
                return res.status(400).json({ message: 'Invalid link submission data.' });
            }
            
            // Отправка в Telegram
            await sendLinkToTelegram(content, username);

            submissionData = {
                status: 'submitted',
                type: 'link',
                content: content, // Сохраняем саму ссылку
                date: new Date().toISOString()
            };
            await saveDataToRedis(username, submissionData);
        } else {
            return res.status(400).json({ message: 'Unsupported Content-Type.' });
        }

        res.status(200).json({ message: 'Submission successful!' });

    } catch (error) {
        console.error('Submission Error:', error);
        res.status(500).json({ message: error.message || 'An internal server error occurred.' });
    }
}

// === Вспомогательные функции для бэкенда ===

// Парсит multipart/form-data
function parseForm(req) {
    return new Promise((resolve, reject) => {
        const form = new IncomingForm();
        form.parse(req, (err, fields, files) => {
            if (err) return reject(err);
            resolve({
                file: files.file ? files.file[0] : null,
                username: fields.username ? fields.username[0] : null
            });
        });
    });
}

// Читает JSON тело запроса
function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                reject(e);
            }
        });
    });
}

// Сохраняет данные в Redis
async function saveDataToRedis(username, data) {
    const key = `submission:${username.replace(/\s/g, '_')}`;
    await redis.set(key, JSON.stringify(data));
}

// Отправляет файл в Telegram
async function sendFileToTelegram(file, username) {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('document', createReadStream(file.filepath), file.originalFilename);
    formData.append('caption', `Новый файл от ${username}: ${file.originalFilename}`);
    
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, { method: 'POST', body: formData });
    const result = await res.json();
    if (!result.ok) throw new Error(`Telegram API (file): ${result.description}`);
}

// Отправляет ссылку в Telegram
async function sendLinkToTelegram(link, username) {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    const text = `Новая ссылка от ${username}:\n${link}`;
    
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: text })
    });
    const result = await res.json();
    if (!result.ok) throw new Error(`Telegram API (link): ${result.description}`);
}