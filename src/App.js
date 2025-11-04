import React, { useState } from 'react';
import './App.css';

// Компонент карточки товара
const ProductCard = ({ name, price, image, onAddToCart }) => {
  const [count, setCount] = useState(0);

  const handleAddToCart = () => {
    const newCount = count + 1;
    setCount(newCount);
    onAddToCart(name, newCount);
  };

  const handleReset = () => {
    setCount(0);
    onAddToCart(name, 0);
  };

  return (
    <div className="product-card">
      <div className="product-image">
        <img src={image} alt={name} />
      </div>
      <div className="product-info">
        <h3 className="product-name">{name}</h3>
        <p className="product-price">{price} ₽</p>
        <div className="cart-controls">
          <button 
            className="add-button"
            onClick={handleAddToCart}
          >
            Добавить в корзину
          </button>
          {count > 0 && (
            <div className="counter-section">
              <span className="counter">Выбрано: {count}</span>
              <button 
                className="reset-button"
                onClick={handleReset}
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Основной компонент
const App = () => {
  const [cart, setCart] = useState({});

  const handleAddToCart = (productName, count) => {
    setCart(prevCart => ({
      ...prevCart,
      [productName]: count
    }));
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((total, count) => total + count, 0);
  };

  // Данные туров с исправленными путями к изображениям
  const tours = [
    {
      id: 1,
      name: "Тур в Турцию",
      price: 45000,
      image: "/images/turkey.jpg"  
    },
    {
      id: 2,
      name: "Отдых в Египте",
      price: 52000,
      image: "/images/Egypt.webp" 
    },
    {
      id: 3,
      name: "Экскурсия по Европе",
      price: 78000,
      image: "/images/Europe.jpg" 
    },
    {
      id: 4,
      name: "Горнолыжный курорт",
      price: 62000,
      image: "/images/gors.jpg"   
    },
    {
      id: 5,
      name: "Пляжный отдых в Тайланде",
      price: 89000,
      image: "/images/tai.jpg"     
    },
    {
      id: 6,
      name: "Экзотический Мальдивы",
      price: 125000,
      image: "/images/maldivs.jpg" 
    }
  ];

  return (
    <div className="app">
      <header className="app-header">
        <h1> "Мир Путешествий"</h1>
        <div className="cart-total">
           Всего выбрано туров: {getTotalItems()}
        </div>
      </header>
      
      <div className="products-grid">
        {tours.map(tour => (
          <ProductCard
            key={tour.id}
            name={tour.name}
            price={tour.price}
            image={tour.image}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </div>
  );
};

export default App;