import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const handleStartShopping = () => {
    navigate('/products');
  };

  const features = [
    { icon: '🏆', title: 'Лучшие цены', desc: 'Гарантия низких цен на все туры' },
    { icon: '🛡️', title: 'Надежно', desc: 'Все туры застрахованы' },
    { icon: '🌟', title: 'Премиум-отели', desc: 'Только проверенные отели 4-5 звезд' },
    { icon: '📞', title: 'Поддержка 24/7', desc: 'Помощь в любое время' }
  ];

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Откройте мир
            <span className="highlight"> путешествий</span>
          </h1>
          <p className="hero-subtitle">
            Лучшие туры по всему миру с комфортом и заботой о каждом клиенте
          </p>
          <button onClick={handleStartShopping} className="cta-button hero-cta">
            Найти своё путешествие
          </button>
        </div>
        <div className="hero-visual">
          <div className="floating-card card-1">Пляжный отдых</div>
          <div className="floating-card card-2">Горные лыжи</div>
          <div className="floating-card card-3">Экскурсии</div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Почему выбирают нас</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;