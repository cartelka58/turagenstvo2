import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import ProductCard from '../common/ProductCard';

const Products = () => {
  const { addToCart } = useCart();
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const tours = [
    {
      id: 1,
      name: "Тур в Турцию",
      price: 45000,
      image: "/images/turkey.jpg",
      description: "Анталия, 5-звездочные отели, все включено"
    },
    {
      id: 2,
      name: "Отдых в Египте",
      price: 52000,
      image: "/images/egypt.webp",
      description: "Шарм-эль-Шейх, коралловые рифы, дайвинг"
    },
    {
      id: 3,
      name: "Экскурсия по Европе",
      price: 78000,
      image: "/images/europe.jpg",
      description: "Париж, Рим, Амстердам - лучшие города Европы"
    },
    {
      id: 4,
      name: "Горнолыжный курорт",
      price: 62000,
      image: "/images/gors.jpg",
      description: "Альпы, современные подъемники, инструкторы"
    },
    {
      id: 5,
      name: "Пляжный отдых в Тайланде",
      price: 89000,
      image: "/images/tai.jpg",
      description: "Пхукет, белоснежные пляжи, экзотическая кухня"
    },
    {
      id: 6,
      name: "Японские острова",
      price: 125000,
      image: "/images/japan.png",
      description: "Токио, Киото, сакура и древние храмы"
    },
    {
      id: 7,
      name: "Мальдивские острова",
      price: 145000,
      image: "/images/maldivs.jpg",
      description: "Райские острова, виллы на воде, сноркелинг"
    },
    {
      id: 8,
      name: "Испанское побережье",
      price: 68000,
      image: "/images/spain.jpg",
      description: "Коста-Брава, средиземноморская кухня, фламенко"
    },
    {
      id: 9,
      name: "ОАЭ - Дубай",
      price: 95000,
      image: "/images/dubai.jpg",
      description: "Бурдж-Халифа, пустынное сафари, шопинг"
    },
    {
      id: 10,
      name: "Греческие острова",
      price: 72000,
      image: "/images/greece.png",
      description: "Санторини, белые домики, закаты"
    },
    {
      id: 11,
      name: "Великобритания",
      price: 88000,
      image: "/images/uk.jpg",
      description: "Лондон, Стоунхендж, шотландские замки"
    },
    {
      id: 12,
      name: "Скандинавские фьорды",
      price: 112000,
      image: "/images/norway.jpg",
      description: "Норвежские фьорды, северное сияние"
    },
    {
      id: 13,
      name: "Вьетнам",
      price: 58000,
      image: "/images/vietnam.jpg",
      description: "Халонг, рисовые террасы, азиатская культура"
    },
    {
      id: 14,
      name: "Куба",
      price: 76000,
      image: "/images/cuba.webp",
      description: "Гавана, ретро-автомобили, сигары"
    },
    {
      id: 15,
      name: "Индонезия - Бали",
      price: 82000,
      image: "/images/bali.jpg",
      description: "Райские пляжи, рисовые террасы, спа"
    },
    {
      id: 16,
      name: "Южная Африка",
      price: 134000,
      image: "/images/safari.jpg",
      description: "Сафари, Кейптаун, мыс Доброй Надежды"
    },
    {
      id: 17,
      name: "Перу - Мачу-Пикчу",
      price: 98000,
      image: "/images/peru.jpg",
      description: "Древние инки, Андские горы, Лима"
    },
    {
      id: 18,
      name: "Австралия",
      price: 156000,
      image: "/images/australia.webp",
      description: "Сидней, Большой Барьерный риф, аутбэк"
    }
  ];

  const handleAddToCart = (product) => {
    addToCart(product);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  return (
    <div className="products-page">
      <div className="page-header">
        <h1>Наши туры</h1>
        <p>Выберите идеальное путешествие для себя из {tours.length} вариантов</p>
      </div>

      {showSuccess && (
        <div className="success-notification">
          <div className="notification-content">
            <span className="notification-icon">✅</span>
            <span>Тур добавлен в корзину!</span>
            <button 
              onClick={() => navigate('/cart')} 
              className="notification-button"
            >
              Перейти в корзину
            </button>
          </div>
        </div>
      )}

      <div className="products-grid">
        {tours.map(tour => (
          <ProductCard 
            key={tour.id} 
            product={tour} 
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </div>
  );
};

export default Products;