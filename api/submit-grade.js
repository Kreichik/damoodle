import Redis from 'ioredis';

// Создаем подключение к Redis. Ioredis автоматически использует REDIS_URL.
const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { grader, gradee, grade } = req.body;

        if (!grader || !gradee || grade === undefined) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }
        
        const key = `grades:${gradee.replace(/\s/g, '_')}`;
        const field = grader.replace(/\s/g, '_');

        // Команда hset в ioredis сохраняет поле и значение в "словарь" (hash)
        await redis.hset(key, field, grade);

        return res.status(200).json({ message: 'Grade submitted successfully.' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred on the server.' });
    }
}