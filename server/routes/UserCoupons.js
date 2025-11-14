// GET купоны пользователя
app.get('/api/user/coupons', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT c.* 
      FROM Coupons c
      WHERE c.is_active = TRUE 
        AND (c.for_specific_user = FALSE OR (c.for_specific_user = TRUE AND c.user_id = $1))
        AND (c.valid_until IS NULL OR c.valid_until >= CURRENT_TIMESTAMP)
        AND (c.usage_limit = 0 OR c.used_count < c.usage_limit)
      ORDER BY c.created_at DESC
    `;

    const couponsResult = await pool.query(query, [req.user.id]);

    res.json({
      success: true,
      data: {
        coupons: couponsResult.rows
      }
    });
  } catch (error) {
    console.error('Get user coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка загрузки купонов'
    });
  }
});

// GET персональные купоны пользователя (только его)
app.get('/api/user/personal-coupons', authenticateToken, async (req, res) => {
  try {
    const couponsResult = await pool.query(
      `SELECT c.* 
       FROM Coupons c
       WHERE c.is_active = TRUE 
         AND c.for_specific_user = TRUE 
         AND c.user_id = $1
         AND (c.valid_until IS NULL OR c.valid_until >= CURRENT_TIMESTAMP)
         AND (c.usage_limit = 0 OR c.used_count < c.usage_limit)
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        coupons: couponsResult.rows
      }
    });
  } catch (error) {
    console.error('Get personal coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка загрузки персональных купонов'
    });
  }
});