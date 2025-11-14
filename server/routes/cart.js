import express from 'express';
const router = express.Router();

// Временное хранилище корзин
let carts = [];

// GET корзина пользователя
router.get('/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    let userCart = carts.find(c => c.userId === userId);
    
    if (!userCart) {
        userCart = { userId, items: [] };
        carts.push(userCart);
    }
    
    res.json({
        success: true,
        data: userCart
    });
});

// POST добавить тур в корзину
router.post('/:userId/items', (req, res) => {
    const userId = parseInt(req.params.userId);
    const { tourId, quantity = 1 } = req.body;
    
    if (!tourId) {
        return res.status(400).json({
            success: false,
            message: 'ID тура обязательно'
        });
    }
    
    let userCart = carts.find(c => c.userId === userId);
    if (!userCart) {
        userCart = { userId, items: [] };
        carts.push(userCart);
    }
    
    // Проверяем, есть ли уже тур в корзине
    const existingItem = userCart.items.find(item => item.tourId === tourId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        userCart.items.push({
            tourId,
            quantity,
            addedAt: new Date().toISOString()
        });
    }
    
    res.json({
        success: true,
        data: userCart
    });
});

// DELETE удалить тур из корзины
router.delete('/:userId/items/:tourId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const tourId = req.params.tourId;
    
    const userCart = carts.find(c => c.userId === userId);
    if (!userCart) {
        return res.status(404).json({
            success: false,
            message: 'Корзина не найдена'
        });
    }
    
    userCart.items = userCart.items.filter(item => item.tourId !== tourId);
    
    res.json({
        success: true,
        message: 'Тур удален из корзины',
        data: userCart
    });
});

// PUT обновить количество
router.put('/:userId/items/:tourId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const tourId = req.params.tourId;
    const { quantity } = req.body;
    
    if (quantity < 1) {
        return res.status(400).json({
            success: false,
            message: 'Количество должно быть больше 0'
        });
    }
    
    const userCart = carts.find(c => c.userId === userId);
    if (!userCart) {
        return res.status(404).json({
            success: false,
            message: 'Корзина не найдена'
        });
    }
    
    const item = userCart.items.find(item => item.tourId === tourId);
    if (!item) {
        return res.status(404).json({
            success: false,
            message: 'Тур не найден в корзине'
        });
    }
    
    item.quantity = quantity;
    
    res.json({
        success: true,
        data: userCart
    });
});

export default router;