import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// GET все купоны
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, 
             u.name as user_name, 
             u.email as user_email,
             creator.name as created_by_name
      FROM Coupons c
      LEFT JOIN Users u ON c.user_id = u.id
      LEFT JOIN Users creator ON c.created_by = creator.id
    `;

    let countQuery = `SELECT COUNT(*) FROM Coupons c`;
    let params = [];
    let paramCount = 0;
    let whereConditions = [];

    if (search) {
      paramCount++;
      whereConditions.push(`(c.code ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    if (status === 'active') {
      whereConditions.push(`c.is_active = TRUE AND (c.valid_until IS NULL OR c.valid_until >= CURRENT_TIMESTAMP)`);
    } else if (status === 'expired') {
      whereConditions.push(`c.valid_until < CURRENT_TIMESTAMP`);
    } else if (status === 'inactive') {
      whereConditions.push(`c.is_active = FALSE`);
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
      countQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);

    const couponsResult = await pool.query(query, params);
    const countResult = await pool.query(countQuery, params.slice(0, paramCount));

    res.json({
      success: true,
      data: {
        coupons: couponsResult.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка загрузки купонов'
    });
  }
});

// GET купон по ID
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const couponResult = await pool.query(
      `SELECT c.*, 
              u.name as user_name, 
              u.email as user_email,
              creator.name as created_by_name
       FROM Coupons c
       LEFT JOIN Users u ON c.user_id = u.id
       LEFT JOIN Users creator ON c.created_by = creator.id
       WHERE c.id = $1`,
      [req.params.id]
    );

    if (couponResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Купон не найден'
      });
    }

    res.json({
      success: true,
      data: couponResult.rows[0]
    });
  } catch (error) {
    console.error('Get coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка загрузки купона'
    });
  }
});

// POST создать купон
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount_amount,
      valid_from,
      valid_until,
      usage_limit,
      is_active,
      for_specific_user,
      user_id
    } = req.body;

    if (!code || !discount_value) {
      return res.status(400).json({
        success: false,
        message: 'Код купона и значение скидки обязательны'
      });
    }

    // Проверяем уникальность кода
    const existingCoupon = await pool.query(
      'SELECT id FROM Coupons WHERE code = $1',
      [code.toUpperCase()]
    );

    if (existingCoupon.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Купон с таким кодом уже существует'
      });
    }

    // Проверяем пользователя, если купон персональный
    if (for_specific_user && user_id) {
      const userResult = await pool.query('SELECT id FROM Users WHERE id = $1', [user_id]);
      if (userResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Указанный пользователь не найден'
        });
      }
    }

    const newCoupon = await pool.query(
      `INSERT INTO Coupons (
        code, description, discount_type, discount_value, min_order_amount,
        max_discount_amount, valid_from, valid_until, usage_limit, is_active,
        for_specific_user, user_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        code.toUpperCase(),
        description || null,
        discount_type || 'percentage',
        parseFloat(discount_value),
        min_order_amount ? parseFloat(min_order_amount) : 0,
        max_discount_amount ? parseFloat(max_discount_amount) : null,
        valid_from || new Date(),
        valid_until || null,
        parseInt(usage_limit) || 1,
        Boolean(is_active),
        Boolean(for_specific_user),
        for_specific_user ? user_id : null,
        req.user.id
      ]
    );

    await pool.query(
      `INSERT INTO AdminLogs (user_id, action, entity_type, entity_id, new_values)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        'create',
        'coupon',
        newCoupon.rows[0].id,
        JSON.stringify({
          code: code.toUpperCase(),
          discount_type: discount_type || 'percentage',
          discount_value: parseFloat(discount_value)
        })
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Купон успешно создан',
      data: newCoupon.rows[0]
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка создания купона: ' + error.message
    });
  }
});

// PUT обновить купон
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount_amount,
      valid_from,
      valid_until,
      usage_limit,
      is_active,
      for_specific_user,
      user_id
    } = req.body;

    const oldCoupon = await pool.query(
      'SELECT * FROM Coupons WHERE id = $1',
      [req.params.id]
    );

    if (oldCoupon.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Купон не найден'
      });
    }

    // Проверяем уникальность кода (исключая текущий купон)
    if (code) {
      const existingCoupon = await pool.query(
        'SELECT id FROM Coupons WHERE code = $1 AND id != $2',
        [code.toUpperCase(), req.params.id]
      );

      if (existingCoupon.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Купон с таким кодом уже существует'
        });
      }
    }

    // Проверяем пользователя, если купон персональный
    if (for_specific_user && user_id) {
      const userResult = await pool.query('SELECT id FROM Users WHERE id = $1', [user_id]);
      if (userResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Указанный пользователь не найден'
        });
      }
    }

    const updatedCoupon = await pool.query(
      `UPDATE Coupons SET 
        code = $1, description = $2, discount_type = $3, discount_value = $4,
        min_order_amount = $5, max_discount_amount = $6, valid_from = $7,
        valid_until = $8, usage_limit = $9, is_active = $10,
        for_specific_user = $11, user_id = $12, updated_at = CURRENT_TIMESTAMP
       WHERE id = $13
       RETURNING *`,
      [
        code ? code.toUpperCase() : oldCoupon.rows[0].code,
        description !== undefined ? description : oldCoupon.rows[0].description,
        discount_type || oldCoupon.rows[0].discount_type,
        parseFloat(discount_value) || oldCoupon.rows[0].discount_value,
        min_order_amount !== undefined ? parseFloat(min_order_amount) : oldCoupon.rows[0].min_order_amount,
        max_discount_amount !== undefined ? parseFloat(max_discount_amount) : oldCoupon.rows[0].max_discount_amount,
        valid_from || oldCoupon.rows[0].valid_from,
        valid_until !== undefined ? valid_until : oldCoupon.rows[0].valid_until,
        parseInt(usage_limit) || oldCoupon.rows[0].usage_limit,
        Boolean(is_active),
        Boolean(for_specific_user),
        for_specific_user ? user_id : null,
        req.params.id
      ]
    );

    if (updatedCoupon.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Купон не найден после обновления'
      });
    }

    await pool.query(
      `INSERT INTO AdminLogs (user_id, action, entity_type, entity_id, old_values, new_values)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user.id,
        'update',
        'coupon',
        req.params.id,
        JSON.stringify(oldCoupon.rows[0]),
        JSON.stringify(updatedCoupon.rows[0])
      ]
    );

    res.json({
      success: true,
      message: 'Купон успешно обновлен',
      data: updatedCoupon.rows[0]
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления купона: ' + error.message
    });
  }
});

// DELETE удалить купон
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const oldCoupon = await pool.query(
      'SELECT * FROM Coupons WHERE id = $1',
      [req.params.id]
    );

    if (oldCoupon.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Купон не найден'
      });
    }

    // Проверяем, использовался ли купон
    const usageResult = await pool.query(
      'SELECT id FROM CouponUsage WHERE coupon_id = $1 LIMIT 1',
      [req.params.id]
    );

    if (usageResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя удалить купон, который уже использовался'
      });
    }

    const deletedCoupon = await pool.query(
      'DELETE FROM Coupons WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    await pool.query(
      `INSERT INTO AdminLogs (user_id, action, entity_type, entity_id, old_values)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        'delete',
        'coupon',
        req.params.id,
        JSON.stringify(oldCoupon.rows[0])
      ]
    );

    res.json({
      success: true,
      message: 'Купон успешно удален',
      data: deletedCoupon.rows[0]
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления купона: ' + error.message
    });
  }
});

// POST проверить купон
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { code, order_amount = 0, user_id } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Код купона обязателен'
      });
    }

    const couponResult = await pool.query(
      `SELECT c.*, u.name as user_name, u.email as user_email
       FROM Coupons c
       LEFT JOIN Users u ON c.user_id = u.id
       WHERE c.code = $1 AND c.is_active = TRUE`,
      [code.toUpperCase()]
    );

    if (couponResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Купон не найден или неактивен'
      });
    }

    const coupon = couponResult.rows[0];
    const currentDate = new Date();

    // Проверка срока действия
    if (coupon.valid_from && new Date(coupon.valid_from) > currentDate) {
      return res.status(400).json({
        success: false,
        message: 'Купон еще не активен'
      });
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < currentDate) {
      return res.status(400).json({
        success: false,
        message: 'Срок действия купона истек'
      });
    }

    // Проверка лимита использований
    if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({
        success: false,
        message: 'Лимит использований купона исчерпан'
      });
    }

    // Проверка минимальной суммы заказа
    if (coupon.min_order_amount > 0 && order_amount < coupon.min_order_amount) {
      return res.status(400).json({
        success: false,
        message: `Минимальная сумма заказа для этого купона: ${coupon.min_order_amount} ₽`
      });
    }

    // Проверка персонального купона
    if (coupon.for_specific_user && coupon.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Этот купон предназначен для другого пользователя'
      });
    }

    // Расчет скидки
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (order_amount * coupon.discount_value) / 100;
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }
    } else {
      discountAmount = coupon.discount_value;
    }

    res.json({
      success: true,
      message: 'Купон действителен',
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          discount_amount: discountAmount
        },
        discount_amount: discountAmount,
        final_amount: order_amount - discountAmount
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка проверки купона'
    });
  }
});

export default router;