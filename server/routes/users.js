import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, email, phone, password, role_id, status_id } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Имя и email обязательны для заполнения'
            });
        }

        const existingUser = await pool.query(
            'SELECT id FROM Users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Пользователь с таким email уже существует'
            });
        }

        const hashedPassword = password 
            ? await bcrypt.hash(password, 10)
            : await bcrypt.hash('password', 10);

        const newUser = await pool.query(
            `INSERT INTO Users (name, email, phone, password, role_id, status_id, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, email, name, phone, role_id, status_id, created_at, last_login_at`,
            [name, email, phone, hashedPassword, role_id, status_id, req.user.userId]
        );

        await pool.query(
            `INSERT INTO AdminLogs (user_id, action, entity_type, entity_id, new_values)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                req.user.userId,
                'create',
                'user',
                newUser.rows[0].id,
                JSON.stringify(newUser.rows[0])
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Пользователь создан успешно',
            data: newUser.rows[0]
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка создания пользователя'
        });
    }
});

router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userResult = await pool.query(
            `SELECT u.*, r.name as role_name, s.name as status_name
             FROM Users u 
             JOIN Roles r ON u.role_id = r.id 
             JOIN Statuses s ON u.status_id = s.id 
             WHERE u.id = $1`,
            [req.params.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        const { password, ...userWithoutPassword } = userResult.rows[0];
        res.json({
            success: true,
            data: userWithoutPassword
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка загрузки пользователя'
        });
    }
});

router.post('/users/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const userResult = await pool.query('SELECT id FROM Users WHERE id = $1', [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        const tempPassword = 'password';
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        await pool.query(
            'UPDATE Users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedPassword, userId]
        );

        await pool.query(
            `INSERT INTO AdminLogs (user_id, action, entity_type, entity_id, new_values)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                req.user.userId,
                'reset_password',
                'user',
                userId,
                JSON.stringify({ password_reset: true })
            ]
        );

        res.json({
            success: true,
            message: 'Пароль успешно сброшен',
            data: {
                temporary_password: tempPassword
            }
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сброса пароля'
        });
    }
});

router.get('/users-stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const statsResult = await pool.query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN role_id = 1 THEN 1 END) as admin_users,
                COUNT(CASE WHEN status_id = 13 THEN 1 END) as active_users,
                COUNT(CASE WHEN status_id = 15 THEN 1 END) as blocked_users,
                COUNT(CASE WHEN last_login_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_active_users,
                DATE_TRUNC('month', created_at) as registration_month,
                COUNT(*) as monthly_registrations
            FROM Users 
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY registration_month DESC
            LIMIT 12
        `);

        const totalStats = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN role_id = 1 THEN 1 END) as admins,
                COUNT(CASE WHEN status_id = 13 THEN 1 END) as active,
                COUNT(CASE WHEN status_id = 15 THEN 1 END) as blocked
            FROM Users
        `);

        res.json({
            success: true,
            data: {
                totals: totalStats.rows[0],
                monthly: statsResult.rows
            }
        });
    } catch (error) {
        console.error('Users stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка загрузки статистики'
        });
    }
});

export default router;