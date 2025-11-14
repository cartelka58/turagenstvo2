import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Требуется авторизация'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        // Получаем актуальные данные пользователя из БД
        const userResult = await pool.query(
            `SELECT u.*, r.name as role_name, s.name as status_name 
             FROM Users u 
             JOIN Roles r ON u.role_id = r.id 
             JOIN Statuses s ON u.status_id = s.id 
             WHERE u.id = $1`,
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        req.user = userResult.rows[0];
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(403).json({
            success: false,
            message: 'Неверный токен'
        });
    }
};

export const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Требуется авторизация'
        });
    }

    const userRole = req.user.role_name || req.user.role;
    if (userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Требуются права администратора'
        });
    }

    next();
};