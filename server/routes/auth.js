import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const router = express.Router();

const demoUsers = {
    'user@travel.ru': {
        id: 1,
        email: 'user@travel.ru',
        name: 'Демо Пользователь',
        role: 'user',
        status_name: 'active'
    },
    'admin@travel.ru': {
        id: 2, 
        email: 'admin@travel.ru',
        name: 'Администратор',
        role: 'admin',
        status_name: 'active'
    }
};

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email и пароль обязательны'
            });
        }

        if (password === 'password' && demoUsers[email]) {
            const user = demoUsers[email];
            const token = jwt.sign(
                { 
                    userId: user.id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET || 'demo-secret-key',
                { expiresIn: '24h' }
            );

            return res.json({
                success: true,
                message: 'Вход выполнен успешно',
                data: {
                    user,
                    token
                }
            });
        }

        const userResult = await pool.query(
            `SELECT u.*, r.name as role_name, s.name as status_name 
             FROM Users u 
             JOIN Roles r ON u.role_id = r.id 
             JOIN Statuses s ON u.status_id = s.id 
             WHERE u.email = $1`,
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Неверный email или пароль'
            });
        }

        const user = userResult.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Неверный email или пароль'
            });
        }

        console.log(`Пользователь ${email} имеет статус: ${user.status_name}`);

        await pool.query(
            'UPDATE Users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                role: user.role_name,
            },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '24h' }
        );

        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Вход выполнен успешно',
            data: {
                user: userWithoutPassword,
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка входа'
        });
    }
});

export default router;