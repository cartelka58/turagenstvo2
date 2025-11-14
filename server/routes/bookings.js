import express from 'express';
const router = express.Router();

// Временное хранилище (замените на подключение к БД)
let bookings = [
    {
        id: 1,
        tourId: 1,
        userId: 1,
        date: '2024-01-15',
        participants: 2,
        totalPrice: 200,
        status: 'confirmed'
    }
];

// GET все бронирования
router.get('/', (req, res) => {
    res.json({
        success: true,
        data: bookings
    });
});

// GET бронирование по ID
router.get('/:id', (req, res) => {
    const booking = bookings.find(b => b.id === parseInt(req.params.id));
    
    if (!booking) {
        return res.status(404).json({
            success: false,
            message: 'Бронирование не найдено'
        });
    }
    
    res.json({
        success: true,
        data: booking
    });
});

// POST создать новое бронирование
router.post('/', (req, res) => {
    const { tourId, userId, date, participants, totalPrice } = req.body;
    
    if (!tourId || !userId || !date || !participants || !totalPrice) {
        return res.status(400).json({
            success: false,
            message: 'Все поля обязательны для заполнения'
        });
    }
    
    const newBooking = {
        id: bookings.length + 1,
        tourId,
        userId,
        date,
        participants,
        totalPrice,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    bookings.push(newBooking);
    
    res.status(201).json({
        success: true,
        data: newBooking
    });
});

// PUT обновить бронирование
router.put('/:id', (req, res) => {
    const bookingIndex = bookings.findIndex(b => b.id === parseInt(req.params.id));
    
    if (bookingIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Бронирование не найдено'
        });
    }
    
    const updatedBooking = {
        ...bookings[bookingIndex],
        ...req.body,
        id: bookings[bookingIndex].id,
        updatedAt: new Date().toISOString()
    };
    
    bookings[bookingIndex] = updatedBooking;
    
    res.json({
        success: true,
        data: updatedBooking
    });
});

// DELETE удалить бронирование
router.delete('/:id', (req, res) => {
    const bookingIndex = bookings.findIndex(b => b.id === parseInt(req.params.id));
    
    if (bookingIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Бронирование не найдено'
        });
    }
    
    const deletedBooking = bookings.splice(bookingIndex, 1)[0];
    
    res.json({
        success: true,
        message: 'Бронирование удалено',
        data: deletedBooking
    });
});

// GET бронирования пользователя
router.get('/user/:userId', (req, res) => {
    const userBookings = bookings.filter(b => b.userId === parseInt(req.params.userId));
    
    res.json({
        success: true,
        data: userBookings
    });
});

// PATCH обновить статус бронирования
router.patch('/:id/status', (req, res) => {
    const { status } = req.body;
    const bookingIndex = bookings.findIndex(b => b.id === parseInt(req.params.id));
    
    if (bookingIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Бронирование не найдено'
        });
    }
    
    if (!status) {
        return res.status(400).json({
            success: false,
            message: 'Статус обязателен'
        });
    }
    
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Неверный статус. Допустимые значения: pending, confirmed, cancelled, completed'
        });
    }
    
    bookings[bookingIndex].status = status;
    bookings[bookingIndex].updatedAt = new Date().toISOString();
    
    res.json({
        success: true,
        data: bookings[bookingIndex]
    });
});

export default router;