import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// GET все категории с подсчетом туров
router.get('/', async (req, res) => {
  try {
    const categoriesResult = await pool.query(`
      SELECT 
        tc.*,
        COUNT(t.id) as tour_count
      FROM TourCategories tc
      LEFT JOIN Tours t ON tc.id = t.category_id AND t.is_active = TRUE
      WHERE tc.is_active = TRUE
      GROUP BY tc.id
      ORDER BY tc.sort_order ASC, tc.name ASC
    `);
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

// GET категории для фильтрации (только с турами)
router.get('/with-tours', async (req, res) => {
  try {
    const categoriesResult = await pool.query(`
      SELECT DISTINCT
        tc.id,
        tc.name,
        tc.icon,
        tc.description,
        COUNT(t.id) as tour_count
      FROM TourCategories tc
      JOIN Tours t ON tc.id = t.category_id AND t.is_active = TRUE
      WHERE tc.is_active = TRUE
      GROUP BY tc.id, tc.name, tc.icon, tc.description
      HAVING COUNT(t.id) > 0
      ORDER BY tc.sort_order ASC, tc.name ASC
    `);
    res.json({
      success: true,
      data: categoriesResult.rows
    });
  } catch (error) {
    console.error('Get categories with tours error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка загрузки категорий'
    });
  }
});

// GET категория по ID
router.get('/:id', async (req, res) => {
  try {
    const categoryResult = await pool.query(
      `SELECT tc.*, COUNT(t.id) as tour_count
       FROM TourCategories tc
       LEFT JOIN Tours t ON tc.id = t.category_id AND t.is_active = TRUE
       WHERE tc.id = $1
       GROUP BY tc.id`,
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
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, image_url, parent_id, sort_order, icon } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Название категории обязательно'
      });
    }

    const newCategory = await pool.query(
      `INSERT INTO TourCategories (name, description, image_url, parent_id, sort_order, icon, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        name,
        description || '',
        image_url || '/images/default-category.jpg',
        parent_id || null,
        parseInt(sort_order) || 0,
        icon || '📁',
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
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, image_url, parent_id, sort_order, icon, is_active } = req.body;
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
       SET name = $1, description = $2, image_url = $3, parent_id = $4, 
           sort_order = $5, icon = $6, is_active = $7, updated_by = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        name,
        description || '',
        image_url || '/images/default-category.jpg',
        parent_id || null,
        parseInt(sort_order) || 0,
        icon || '📁',
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
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
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

export default router;