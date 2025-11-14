import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Middleware аутентификации
const authenticateToken = async (req, res, next) => {
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

const requireAdmin = (req, res, next) => {
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

// ==================== АУТЕНТИФИКАЦИЯ ====================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Все поля обязательны для заполнения'
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `INSERT INTO Users (name, email, phone, password, role_id, status_id)
       VALUES ($1, $2, $3, $4, 2, 13)
       RETURNING id, email, name, phone, role_id, status_id, created_at`,
      [name, email, phone, hashedPassword]
    );

    const token = jwt.sign(
      { userId: newUser.rows[0].id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Пользователь создан успешно',
      data: {
        user: newUser.rows[0],
        token: token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка регистрации'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email и пароль обязательны'
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
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }

    await pool.query(
      'UPDATE Users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Вход выполнен успешно',
      data: {
        user: userWithoutPassword,
        token: token
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

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { password, ...userWithoutPassword } = req.user;
    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка загрузки профиля'
    });
  }
});

// ==================== CRUD ДЛЯ КУПОНОВ ====================

// GET все купоны (админ)
app.get('/api/admin/coupons', authenticateToken, requireAdmin, async (req, res) => {
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
app.get('/api/admin/coupons/:id', authenticateToken, requireAdmin, async (req, res) => {
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
app.post('/api/admin/coupons', authenticateToken, requireAdmin, async (req, res) => {
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
app.put('/api/admin/coupons/:id', authenticateToken, requireAdmin, async (req, res) => {
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
app.delete('/api/admin/coupons/:id', authenticateToken, requireAdmin, async (req, res) => {
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

// POST проверить купон (публичный эндпоинт)
app.post('/api/coupons/validate', authenticateToken, async (req, res) => {
  try {
    const { code, order_amount = 0 } = req.body;

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
    if (coupon.for_specific_user && coupon.user_id !== req.user.id) {
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

// ==================== CRUD ДЛЯ ТУРОВ ====================

// GET все туры
app.get('/api/tours', async (req, res) => {
  try {
    const toursResult = await pool.query(`
      SELECT t.*, tc.name as category_name, tc.icon as category_icon
      FROM Tours t 
      LEFT JOIN TourCategories tc ON t.category_id = tc.id 
      WHERE t.is_active = TRUE
      ORDER BY t.created_at DESC
    `);

    const tours = toursResult.rows.map(tour => ({
      ...tour,
      included_services: typeof tour.included_services === 'string' 
        ? JSON.parse(tour.included_services || '[]')
        : tour.included_services || [],
      not_included_services: typeof tour.not_included_services === 'string'
        ? JSON.parse(tour.not_included_services || '[]')
        : tour.not_included_services || []
    }));

    res.json({
      success: true,
      data: tours
    });
  } catch (error) {
    console.error('Get tours error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка загрузки туров'
    });
  }
});

// GET тур по ID
app.get('/api/tours/:id', async (req, res) => {
  try {
    const tourResult = await pool.query(
      `SELECT t.*, tc.name as category_name, tc.icon as category_icon
       FROM Tours t 
       LEFT JOIN TourCategories tc ON t.category_id = tc.id 
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (tourResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Тур не найден'
      });
    }

    const tour = tourResult.rows[0];
    tour.included_services = typeof tour.included_services === 'string' 
      ? JSON.parse(tour.included_services || '[]')
      : tour.included_services || [];
    tour.not_included_services = typeof tour.not_included_services === 'string'
      ? JSON.parse(tour.not_included_services || '[]')
      : tour.not_included_services || [];

    res.json({
      success: true,
      data: tour
    });
  } catch (error) {
    console.error('Get tour error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка загрузки тура'
    });
  }
});

// POST создать тур
app.post('/api/tours', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name, description, short_description, price, duration_days, category_id,
      image_url, is_discounted, discount_percentage, original_price,
      is_popular, is_featured, destination, departure_city,
      included_services, not_included_services, max_travelers
    } = req.body;

    if (!name || !price || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Название, цена и категория обязательны'
      });
    }

    const newTour = await pool.query(
      `INSERT INTO Tours (
        name, description, short_description, price, duration_days, category_id,
        image_url, is_discounted, discount_percentage, original_price,
        is_popular, is_featured, destination, departure_city,
        included_services, not_included_services, max_travelers, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        name,
        description || '',
        short_description || '',
        parseFloat(price),
        parseInt(duration_days) || 7,
        parseInt(category_id),
        image_url || '/images/default-tour.jpg',
        Boolean(is_discounted),
        parseFloat(discount_percentage) || 0,
        original_price ? parseFloat(original_price) : null,
        Boolean(is_popular),
        Boolean(is_featured),
        destination || '',
        departure_city || 'Москва',
        JSON.stringify(included_services || ['перелет', 'отель', 'питание']),
        JSON.stringify(not_included_services || ['виза', 'страховка']),
        parseInt(max_travelers) || 20,
        req.user.id
      ]
    );

    await pool.query(
      `INSERT INTO AdminLogs (user_id, action, entity_type, entity_id, new_values)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        'create',
        'tour',
        newTour.rows[0].id,
        JSON.stringify({ name, price: parseFloat(price), category_id })
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Тур успешно создан',
      data: newTour.rows[0]
    });
  } catch (error) {
    console.error('Create tour error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка создания тура: ' + error.message
    });
  }
});

// PUT обновить тур
app.put('/api/tours/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name, description, short_description, price, duration_days, category_id,
      image_url, is_discounted, discount_percentage, original_price,
      is_popular, is_featured, destination, departure_city,
      included_services, not_included_services, max_travelers, is_active
    } = req.body;

    const oldTour = await pool.query(
      'SELECT * FROM Tours WHERE id = $1',
      [req.params.id]
    );

    if (oldTour.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Тур не найден'
      });
    }

    const updatedTour = await pool.query(
      `UPDATE Tours SET 
        name = $1, description = $2, short_description = $3, price = $4, 
        duration_days = $5, category_id = $6, image_url = $7,
        is_discounted = $8, discount_percentage = $9, original_price = $10,
        is_popular = $11, is_featured = $12, destination = $13, departure_city = $14,
        included_services = $15, not_included_services = $16,
        max_travelers = $17, is_active = $18, updated_by = $19,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $20
       RETURNING *`,
      [
        name,
        description || '',
        short_description || '',
        parseFloat(price),
        parseInt(duration_days) || 7,
        parseInt(category_id),
        image_url || '/images/default-tour.jpg',
        Boolean(is_discounted),
        parseFloat(discount_percentage) || 0,
        original_price ? parseFloat(original_price) : null,
        Boolean(is_popular),
        Boolean(is_featured),
        destination || '',
        departure_city || 'Москва',
        JSON.stringify(included_services || ['перелет', 'отель', 'питание']),
        JSON.stringify(not_included_services || ['виза', 'страховка']),
        parseInt(max_travelers) || 20,
        Boolean(is_active),
        req.user.id,
        req.params.id
      ]
    );

    if (updatedTour.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Тур не найден после обновления'
      });
    }

    await pool.query(
      `INSERT INTO AdminLogs (user_id, action, entity_type, entity_id, old_values, new_values)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user.id,
        'update',
        'tour',
        req.params.id,
        JSON.stringify(oldTour.rows[0]),
        JSON.stringify(updatedTour.rows[0])
      ]
    );

    res.json({
      success: true,
      message: 'Тур успешно обновлен',
      data: updatedTour.rows[0]
    });
  } catch (error) {
    console.error('Update tour error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления тура: ' + error.message
    });
  }
});

// DELETE удалить тур
app.delete('/api/tours/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const oldTour = await pool.query(
      'SELECT * FROM Tours WHERE id = $1',
      [req.params.id]
    );

    if (oldTour.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Тур не найден'
      });
    }

    const deletedTour = await pool.query(
      'DELETE FROM Tours WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    await pool.query(
      `INSERT INTO AdminLogs (user_id, action, entity_type, entity_id, old_values)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        'delete',
        'tour',
        req.params.id,
        JSON.stringify(oldTour.rows[0])
      ]
    );

    res.json({
      success: true,
      message: 'Тур успешно удален',
      data: deletedTour.rows[0]
    });
  } catch (error) {
    console.error('Delete tour error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления тура: ' + error.message
    });
  }
});

// ==================== CRUD ДЛЯ КАТЕГОРИЙ ====================

// GET все категории
app.get('/api/categories', async (req, res) => {
  try {
    const categoriesResult = await pool.query(
      'SELECT * FROM TourCategories WHERE is_active = TRUE ORDER BY name'
    );
    res.json({
      success: true,
      data: categoriesResult.rows
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка загрузки категорий'
    });
  }
});

// GET категория по ID
app.get('/api/categories/:id', async (req, res) => {
  try {
    const categoryResult = await pool.query(
      'SELECT * FROM TourCategories WHERE id = $1',
      [req.params.id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена'
      });
    }

    res.json({
      success: true,
      data: categoryResult.rows[0]
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка загрузки категории'
    });
  }
});

// POST создать категорию
app.post('/api/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Название категории обязательно'
      });
    }

    const newCategory = await pool.query(
      `INSERT INTO TourCategories (name, description, icon, created_by) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [
        name,
        description || '',
        icon || '🏖️',
        req.user.id
      ]
    );

    await pool.query(
      `INSERT INTO AdminLogs (user_id, action, entity_type, entity_id, new_values)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        'create',
        'category',
        newCategory.rows[0].id,
        JSON.stringify(newCategory.rows[0])
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Категория успешно создана',
      data: newCategory.rows[0]
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка создания категории: ' + error.message
    });
  }
});

// PUT обновить категорию
app.put('/api/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, icon, is_active } = req.body;

    const oldCategory = await pool.query(
      'SELECT * FROM TourCategories WHERE id = $1',
      [req.params.id]
    );

    if (oldCategory.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена'
      });
    }

    const updatedCategory = await pool.query(
      `UPDATE TourCategories 
       SET name = $1, description = $2, icon = $3, is_active = $4, updated_by = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        name,
        description || '',
        icon || '🏖️',
        Boolean(is_active),
        req.user.id,
        req.params.id
      ]
    );

    if (updatedCategory.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена после обновления'
      });
    }

    await pool.query(
      `INSERT INTO AdminLogs (user_id, action, entity_type, entity_id, old_values, new_values)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user.id,
        'update',
        'category',
        req.params.id,
        JSON.stringify(oldCategory.rows[0]),
        JSON.stringify(updatedCategory.rows[0])
      ]
    );

    res.json({
      success: true,
      message: 'Категория успешно обновлена',
      data: updatedCategory.rows[0]
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления категории: ' + error.message
    });
  }
});

// DELETE удалить категорию
app.delete('/api/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const oldCategory = await pool.query(
      'SELECT * FROM TourCategories WHERE id = $1',
      [req.params.id]
    );

    if (oldCategory.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена'
      });
    }

    // Проверяем, есть ли туры в этой категории
    const toursInCategory = await pool.query(
      'SELECT id FROM Tours WHERE category_id = $1 LIMIT 1',
      [req.params.id]
    );

    if (toursInCategory.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя удалить категорию, в которой есть туры'
      });
    }

    const deletedCategory = await pool.query(
      'DELETE FROM TourCategories WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    await pool.query(
      `INSERT INTO AdminLogs (user_id, action, entity_type, entity_id, old_values)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        'delete',
        'category',
        req.params.id,
        JSON.stringify(oldCategory.rows[0])
      ]
    );

    res.json({
      success: true,
      message: 'Категория успешно удалена',
      data: deletedCategory.rows[0]
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления категории: ' + error.message
    });
  }
});

// ==================== CRUD ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ====================

// GET все пользователи (админ)
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.created_at, u.last_login_at,
             r.name as role_name, s.name as status_name, u.role_id, u.status_id
      FROM Users u 
      JOIN Roles r ON u.role_id = r.id 
      JOIN Statuses s ON u.status_id = s.id 
    `;

    let countQuery = `SELECT COUNT(*) FROM Users u`;
    let params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` WHERE (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      countQuery += ` WHERE (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);

    const usersResult = await pool.query(query, params);
    const countResult = await pool.query(countQuery, params.slice(0, paramCount));

    res.json({
      success: true,
      data: {
        users: usersResult.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка загрузки пользователей'
    });
  }
});

// POST создать пользователя
app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
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
      [name, email, phone, hashedPassword, role_id, status_id, req.user.id]
    );

    await pool.query(
      `INSERT INTO AdminLogs (user_id, action, entity_type, entity_id, new_values)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
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

// PUT обновить пользователя
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, password, role_id, status_id } = req.body;

    const oldUser = await pool.query(
      'SELECT * FROM Users WHERE id = $1',
      [req.params.id]
    );

    if (oldUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    let updateQuery = `
      UPDATE Users SET 
        name = $1, email = $2, phone = $3, role_id = $4, status_id = $5,
        updated_at = CURRENT_TIMESTAMP
    `;
    let params = [name, email, phone || null, role_id, status_id];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += `, password = $${params.length + 1}`;
      params.push(hashedPassword);
    }

    updateQuery += ` WHERE id = $${params.length + 1} RETURNING id, email, name, phone, role_id, status_id, created_at, last_login_at`;
    params.push(req.params.id);

    const updatedUser = await pool.query(updateQuery, params);

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден после обновления'
      });
    }

    await pool.query(
      `INSERT INTO AdminLogs (user_id, action, entity_type, entity_id, old_values, new_values)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user.id,
        'update',
        'user',
        req.params.id,
        JSON.stringify(oldUser.rows[0]),
        JSON.stringify(updatedUser.rows[0])
      ]
    );

    res.json({
      success: true,
      message: 'Пользователь успешно обновлен',
      data: updatedUser.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления пользователя'
    });
  }
});

// DELETE удалить пользователя
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const oldUser = await pool.query('SELECT * FROM Users WHERE id = $1', [req.params.id]);

    if (oldUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const deletedUser = await pool.query(
      'DELETE FROM Users WHERE id = $1 RETURNING id, email, name',
      [req.params.id]
    );

    await pool.query(
      `INSERT INTO AdminLogs (user_id, action, entity_type, entity_id, old_values)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        'delete',
        'user',
        req.params.id,
        JSON.stringify(oldUser.rows[0])
      ]
    );

    res.json({
      success: true,
      message: 'Пользователь успешно удален',
      data: deletedUser.rows[0]
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления пользователя'
    });
  }
});

// POST сбросить пароль
app.post('/api/admin/users/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
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
        req.user.id,
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

// ==================== CRUD ДЛЯ БРОНИРОВАНИЙ ====================

// GET все бронирования (админ)
app.get('/api/admin/bookings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT b.*, 
             u.name as user_name, u.email as user_email, u.phone as user_phone,
             t.name as tour_name, t.image_url as tour_image, t.duration_days, t.price as tour_price,
             s.name as status_name
      FROM Bookings b
      JOIN Users u ON b.user_id = u.id
      JOIN Tours t ON b.tour_id = t.id
      JOIN Statuses s ON b.status_id = s.id
    `;

    let countQuery = `SELECT COUNT(*) FROM Bookings b 
                     JOIN Users u ON b.user_id = u.id 
                     JOIN Tours t ON b.tour_id = t.id`;

    let params = [];
    let paramCount = 0;
    let whereConditions = [];

    if (status && status !== 'all') {
      paramCount++;
      whereConditions.push(`b.status_id = $${paramCount}`);
      params.push(status);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR t.name ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
      countQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    query += ` ORDER BY b.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);

    const bookingsResult = await pool.query(query, params);
    const countResult = await pool.query(countQuery, params.slice(0, paramCount));

    res.json({
      success: true,
      data: {
        bookings: bookingsResult.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Get admin bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка загрузки бронирований'
    });
  }
});

// POST создать бронирование
app.post('/api/admin/bookings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { user_id, tour_id, travelers_count, total_price, booking_date, departure_date, return_date, status_id } = req.body;

    if (!user_id || !tour_id || !travelers_count || !departure_date || !return_date) {
      return res.status(400).json({
        success: false,
        message: 'Клиент, тур, количество участников и даты поездки обязательны'
      });
    }

    const tourResult = await pool.query('SELECT price FROM Tours WHERE id = $1', [tour_id]);

    if (tourResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Тур не найден'
      });
    }

    const tourPrice = tourResult.rows[0].price;
    const calculatedPrice = total_price || (tourPrice * parseInt(travelers_count));
    const finalPrice = calculatedPrice;

    const newBooking = await pool.query(
      `INSERT INTO Bookings (user_id, tour_id, travelers_count, total_price, final_price, booking_date, departure_date, return_date, status_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        user_id,
        tour_id,
        parseInt(travelers_count),
        calculatedPrice,
        finalPrice,
        booking_date || new Date(),
        departure_date,
        return_date,
        status_id || 4,
        req.user.id
      ]
    );

    await pool.query(
      `INSERT INTO AdminLogs (user_id, action, entity_type, entity_id, new_values)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        'create',
        'booking',
        newBooking.rows[0].id,
        JSON.stringify(newBooking.rows[0])
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Бронирование успешно создано',
      data: newBooking.rows[0]
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка создания бронирования: ' + error.message
    });
  }
});

// PUT обновить бронирование
app.put('/api/admin/bookings/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { user_id, tour_id, travelers_count, total_price, booking_date, departure_date, return_date, status_id } = req.body;

    const oldBooking = await pool.query('SELECT * FROM Bookings WHERE id = $1', [req.params.id]);

    if (oldBooking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Бронирование не найдено'
      });
    }

    const finalPrice = total_price;

    const updatedBooking = await pool.query(
      `UPDATE Bookings SET 
        user_id = $1, tour_id = $2, travelers_count = $3, total_price = $4, final_price = $5,
        booking_date = $6, departure_date = $7, return_date = $8, status_id = $9, 
        updated_by = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        user_id,
        tour_id,
        parseInt(travelers_count),
        parseFloat(total_price),
        finalPrice,
        booking_date,
        departure_date,
        return_date,
        status_id,
        req.user.id,
        req.params.id
      ]
    );

    if (updatedBooking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Бронирование не найдено после обновления'
      });
    }

    await pool.query(
      `INSERT INTO AdminLogs (user_id, action, entity_type, entity_id, old_values, new_values)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user.id,
        'update',
        'booking',
        req.params.id,
        JSON.stringify(oldBooking.rows[0]),
        JSON.stringify(updatedBooking.rows[0])
      ]
    );

    res.json({
      success: true,
      message: 'Бронирование успешно обновлено',
      data: updatedBooking.rows[0]
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления бронирования: ' + error.message
    });
  }
});

// DELETE удалить бронирование
app.delete('/api/admin/bookings/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const oldBooking = await pool.query('SELECT * FROM Bookings WHERE id = $1', [req.params.id]);

    if (oldBooking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Бронирование не найдено'
      });
    }

    const deletedBooking = await pool.query(
      'DELETE FROM Bookings WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    await pool.query(
      `INSERT INTO AdminLogs (user_id, action, entity_type, entity_id, old_values)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        'delete',
        'booking',
        req.params.id,
        JSON.stringify(oldBooking.rows[0])
      ]
    );

    res.json({
      success: true,
      message: 'Бронирование успешно удалено',
      data: deletedBooking.rows[0]
    });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления бронирования: ' + error.message
    });
  }
});

// PATCH обновить статус бронирования
app.patch('/api/admin/bookings/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status_id } = req.body;

    if (!status_id) {
      return res.status(400).json({
        success: false,
        message: 'Статус обязателен'
      });
    }

    const oldBooking = await pool.query('SELECT * FROM Bookings WHERE id = $1', [req.params.id]);

    if (oldBooking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Бронирование не найдено'
      });
    }

    const updatedBooking = await pool.query(
      `UPDATE Bookings SET 
        status_id = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status_id, req.user.id, req.params.id]
    );

    await pool.query(
      `INSERT INTO AdminLogs (user_id, action, entity_type, entity_id, old_values, new_values)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user.id,
        'update_status',
        'booking',
        req.params.id,
        JSON.stringify({ status_id: oldBooking.rows[0].status_id }),
        JSON.stringify({ status_id })
      ]
    );

    res.json({
      success: true,
      message: 'Статус бронирования успешно обновлен',
      data: updatedBooking.rows[0]
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления статуса бронирования: ' + error.message
    });
  }
});

// ==================== АДМИН СТАТИСТИКА ====================

app.get('/api/admin/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const usersStats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role_id = 1 THEN 1 END) as admin_users,
        COUNT(CASE WHEN status_id = 13 THEN 1 END) as active_users,
        COUNT(CASE WHEN status_id = 15 THEN 1 END) as blocked_users
      FROM Users
    `);

    const toursStats = await pool.query(`
      SELECT 
        COUNT(*) as total_tours,
        COUNT(CASE WHEN is_popular = true THEN 1 END) as popular_tours,
        COUNT(CASE WHEN is_discounted = true THEN 1 END) as discounted_tours,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_tours
      FROM Tours
    `);

    const categoriesStats = await pool.query(`
      SELECT COUNT(*) as total_categories FROM TourCategories WHERE is_active = true
    `);

    const bookingsStats = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status_id = 4 THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN status_id = 5 THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status_id = 6 THEN 1 END) as cancelled_bookings,
        COUNT(CASE WHEN status_id = 7 THEN 1 END) as completed_bookings
      FROM Bookings
    `);

    // Статистика купонов
    const couponsStats = await pool.query(`
      SELECT 
        COUNT(*) as total_coupons,
        COUNT(CASE WHEN is_active = true AND (valid_until IS NULL OR valid_until >= CURRENT_TIMESTAMP) THEN 1 END) as active_coupons,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_coupons,
        COUNT(CASE WHEN for_specific_user = true THEN 1 END) as personal_coupons,
        SUM(used_count) as total_uses
      FROM Coupons
    `);

    res.json({
      success: true,
      data: {
        users: usersStats.rows[0],
        tours: toursStats.rows[0],
        categories: categoriesStats.rows[0],
        bookings: bookingsStats.rows[0],
        coupons: couponsStats.rows[0]
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка загрузки статистики'
    });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running', 
    timestamp: new Date().toISOString() 
  });
});

// ==================== ОБРАБОТКА ОШИБОК ====================

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Admin API available at: http://localhost:${PORT}/api/admin`);
  console.log(`🔐 Auth API available at: http://localhost:${PORT}/api/auth`);
  console.log(`👥 Users API available at: http://localhost:${PORT}/api/admin/users`);
  console.log(`🌍 Tours API available at: http://localhost:${PORT}/api/tours`);
  console.log(`📂 Categories API available at: http://localhost:${PORT}/api/categories`);
  console.log(`📋 Bookings API available at: http://localhost:${PORT}/api/admin/bookings`);
  console.log(`🎫 Coupons API available at: http://localhost:${PORT}/api/admin/coupons`);
});