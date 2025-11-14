import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

const seedTestData = async () => {
  try {
    console.log('🌱 Засеиваем тестовые данные...');

    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    await pool.query(
      `UPDATE Users SET password = $1 WHERE email = 'admin@travel.ru'`,
      [adminPassword]
    );

    await pool.query(
      `UPDATE Users SET password = $1 WHERE email = 'user@example.com'`,
      [userPassword]
    );

    await pool.query(
      `INSERT INTO Users (email, password, name, phone, role_id, status_id) VALUES 
      ($1, $2, $3, $4, $5, $6),
      ($7, $8, $9, $10, $11, $12) 
      ON CONFLICT (email) DO NOTHING`,
      [
        'customer1@test.com', userPassword, 'Иван Петров', '+79991234567', 2, 13,
        'customer2@test.com', userPassword, 'Мария Сидорова', '+79997654321', 2, 13
      ]
    );

    const mockTours = [
      {
        name: 'Отдых в Турции',
        description: 'Прекрасный отдых на побережье Средиземного моря',
        short_description: 'Все включено на берегу моря',
        price: 45000,
        duration_days: 7,
        destination: 'Анталия',
        image_url: '/images/turkey.jpg',
        category_id: 1,
        is_popular: true,
        is_discounted: false
      },
      {
        name: 'Горный поход в Альпах',
        description: 'Незабываемое приключение в швейцарских Альпах',
        short_description: 'Активный отдых в горах',
        price: 78000,
        duration_days: 10,
        destination: 'Швейцария',
        image_url: '/images/gors.jpg',
        category_id: 2,
        is_popular: true,
        is_discounted: true,
        discount_percentage: 15
      },
      {
        name: 'Экскурсия по Праге',
        description: 'Романтическое путешествие в сердце Европы',
        short_description: 'Прогулки по старинным улочкам',
        price: 55000,
        duration_days: 5,
        destination: 'Прага',
        image_url: '/images/europe.jpg',
        category_id: 3,
        is_popular: false,
        is_discounted: false
      },
      {
        name: 'Пляжный отдых на Бали',
        description: 'Райский отдых на тропическом острове',
        short_description: 'Экзотический пляжный отдых',
        price: 89000,
        duration_days: 12,
        destination: 'Бали',
        image_url: '/images/bali.jpg',
        category_id: 1,
        is_popular: true,
        is_discounted: true,
        discount_percentage: 10
      },
      {
        name: 'Сафари в Африке',
        description: 'Уникальное сафари в национальных парках Кении',
        short_description: 'Приключенческое сафари',
        price: 120000,
        duration_days: 14,
        destination: 'Кения',
        image_url: '/images/safari.jpg',
        category_id: 4,
        is_popular: true,
        is_discounted: false
      },
      {
        name: 'Культурный тур в Японию',
        description: 'Погружение в культуру и традиции Японии',
        short_description: 'Культурный тур',
        price: 95000,
        duration_days: 9,
        destination: 'Токио',
        image_url: '/images/japan.png',
        category_id: 3,
        is_popular: false,
        is_discounted: true,
        discount_percentage: 12
      },
      {
        name: 'Отдых на Мальдивах',
        description: 'Роскошный отдых в бунгало над водой',
        short_description: 'Роскошный пляжный отдых',
        price: 150000,
        duration_days: 8,
        destination: 'Мальдивы',
        image_url: '/images/maldivs.jpg',
        category_id: 1,
        is_popular: true,
        is_discounted: false
      },
      {
        name: 'Горные лыжи в Норвегии',
        description: 'Катание на лыжах в живописных норвежских фьордах',
        short_description: 'Горнолыжный тур',
        price: 68000,
        duration_days: 7,
        destination: 'Осло',
        image_url: '/images/norway.jpg',
        category_id: 2,
        is_popular: false,
        is_discounted: true,
        discount_percentage: 8
      },
      {
        name: 'Путешествие в Египет',
        description: 'Экскурсии к пирамидам и отдых на Красном море',
        short_description: 'Исторический тур + пляжный отдых',
        price: 55000,
        duration_days: 10,
        destination: 'Каир',
        image_url: '/images/egypt.webp',
        category_id: 3,
        is_popular: true,
        is_discounted: false
      },
      {
        name: 'Отдых в Греции',
        description: 'Острова Санторини и Миконос с белоснежными домами',
        short_description: 'Отдых на греческих островах',
        price: 72000,
        duration_days: 8,
        destination: 'Санторини',
        image_url: '/images/greece.png',
        category_id: 1,
        is_popular: true,
        is_discounted: true,
        discount_percentage: 5
      },
      {
        name: 'Гастрономический тур в Испанию',
        description: 'Знакомство с кухней и культурой Испании',
        short_description: 'Гастрономический тур',
        price: 83000,
        duration_days: 9,
        destination: 'Барселона',
        image_url: '/images/spain.jpg',
        category_id: 3,
        is_popular: false,
        is_discounted: false
      },
      {
        name: 'Приключение в Австралии',
        description: 'Исследование Большого Барьерного рифа и Сиднея',
        short_description: 'Экзотическое приключение',
        price: 185000,
        duration_days: 15,
        destination: 'Сидней',
        image_url: '/images/australia.webp',
        category_id: 4,
        is_popular: true,
        is_discounted: true,
        discount_percentage: 10
      },
      {
        name: 'Тур в Дубай',
        description: 'Роскошный отдых в современном мегаполисе',
        short_description: 'Городской тур в Дубай',
        price: 95000,
        duration_days: 7,
        destination: 'Дубай',
        image_url: '/images/dubai.jpg',
        category_id: 3,
        is_popular: true,
        is_discounted: false
      },
      {
        name: 'Экотуризм в Перу',
        description: 'Посещение Мачу-Пикчу и Амазонки',
        short_description: 'Экологический тур',
        price: 110000,
        duration_days: 12,
        destination: 'Лима',
        image_url: '/images/peru.jpg',
        category_id: 4,
        is_popular: false,
        is_discounted: true,
        discount_percentage: 7
      },
      {
        name: 'Тур по Великобритании',
        description: 'Экскурсии по Лондону и шотландским замкам',
        short_description: 'Исторический тур',
        price: 88000,
        duration_days: 10,
        destination: 'Лондон',
        image_url: '/images/uk.jpg',
        category_id: 3,
        is_popular: false,
        is_discounted: false
      },
      {
        name: 'Пляжный отдых на Кубе',
        description: 'Ритмы сальсы и карибские пляжи',
        short_description: 'Карибский отдых',
        price: 76000,
        duration_days: 11,
        destination: 'Гавана',
        image_url: '/images/cuba.webp',
        category_id: 1,
        is_popular: true,
        is_discounted: true,
        discount_percentage: 12
      },
      {
        name: 'Тур в Таиланд',
        description: 'Храмы Бангкока и пляжи Пхукета',
        short_description: 'Экзотический тур',
        price: 69000,
        duration_days: 12,
        destination: 'Бангкок',
        image_url: '/images/tai.jpg',
        category_id: 1,
        is_popular: true,
        is_discounted: false
      },
      {
        name: 'Путешествие во Вьетнам',
        description: 'Бухта Халонг и древний Хойан',
        short_description: 'Культурный тур по Вьетнаму',
        price: 58000,
        duration_days: 11,
        destination: 'Ханой',
        image_url: '/images/vietnam.jpg',
        category_id: 3,
        is_popular: false,
        is_discounted: true,
        discount_percentage: 8
      }
    ];

    for (const tour of mockTours) {
      await pool.query(
        `INSERT INTO Tours (
          name, description, short_description, price, duration_days, category_id, 
          image_url, is_popular, is_featured, destination, departure_city, 
          included_services, max_travelers, created_by, status_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT DO NOTHING`,
        [
          tour.name, tour.description, tour.short_description, 
          tour.price, tour.duration_days, tour.category_id,
          tour.image_url, tour.is_popular, false, tour.destination, 'Москва',
          '["перелет", "отель", "питание", "страховка"]', 30, 1, 1
        ]
      );
    }

    console.log('✅ Тестовые данные успешно добавлены!');
    console.log('👤 Администратор: admin@travel.ru / admin123');
    console.log('👤 Пользователь: user@example.com / user123');
    
  } catch (error) {
    console.error('❌ Ошибка при добавлении тестовых данных:', error);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestData().then(() => {
    console.log('🎉 Сидирование завершено!');
    process.exit(0);
  });
}

export default seedTestData;