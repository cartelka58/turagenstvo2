import React, { createContext, useContext, useState, useEffect } from 'react';

const ServicesContext = createContext();

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
};

export const ServicesProvider = ({ children }) => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Функция для получения всех туров (моковые данные)
  const getAllMockTours = () => {
    return [
      {
        id: 1,
        name: "Отдых в Турции, Анталия",
        description: "Прекрасный отдых на побережье Средиземного моря с системой 'все включено'. Белоснежные пляжи, лазурное море и высококлассный сервис.",
        short_description: "Все включено, 5* отель на берегу моря",
        price: 65000,
        duration_days: 10,
        destination: "Анталия, Турция",
        image_url: "/images/turkey.jpg",
        category_id: "1",
        is_popular: true,
        is_discounted: false,
        rating: 4.8,
        included_services: ["перелет", "отель 5*", "питание все включено", "бассейн", "спа"],
        not_included_services: ["виза", "страховка", "экскурсии"]
      },
      {
        id: 2,
        name: "Горнолыжный курорт в Альпах",
        description: "Незабываемое приключение в лучших горнолыжных курортах французских Альп. Профессиональные трассы, современные подъемники и уютные шале.",
        short_description: "Катание на лучших склонах французских Альп",
        price: 120000,
        duration_days: 7,
        destination: "Французские Альпы",
        image_url: "/images/alps.jpg",
        category_id: "2",
        is_popular: true,
        is_discounted: false,
        rating: 4.9,
        included_services: ["перелет", "отель", "ски-пасс", "прокат оборудования", "инструктор"],
        not_included_services: ["страховка", "личные расходы"]
      },
      {
        id: 3,
        name: "Экскурсионный тур по Италии",
        description: "Погружение в культуру и историю Италии. Рим, Флоренция, Венеция - самые красивые города страны с богатым наследием.",
        short_description: "Рим, Флоренция, Венеция – погружение в культуру Италии",
        price: 89000,
        duration_days: 8,
        destination: "Италия",
        image_url: "/images/italy.jpg",
        category_id: "3",
        is_popular: true,
        is_discounted: true,
        discount_percentage: 10,
        original_price: 99000,
        rating: 4.7,
        included_services: ["перелет", "отели 4*", "завтраки", "экскурсии", "трансферы"],
        not_included_services: ["виза", "обеды и ужины"]
      },
      {
        id: 4,
        name: "Отдых на Бали",
        description: "Райский отдых на тропическом острове с уникальной культурой. Рисовые террасы, древние храмы и бесконечные пляжи.",
        short_description: "Экзотический отдых на острове богов",
        price: 95000,
        duration_days: 12,
        destination: "Бали, Индонезия",
        image_url: "/images/bali.jpg",
        category_id: "1",
        is_popular: true,
        is_discounted: true,
        discount_percentage: 15,
        original_price: 112000,
        rating: 4.8,
        included_services: ["перелет", "вилла", "завтраки", "трансферы", "SPA"],
        not_included_services: ["виза", "страховка", "экскурсии"]
      },
      {
        id: 5,
        name: "Сафари в Кении",
        description: "Уникальное сафари в национальных парках Кении. Наблюдение за большой африканской пятеркой в естественной среде обитания.",
        short_description: "Приключенческое сафари по национальным паркам",
        price: 145000,
        duration_days: 10,
        destination: "Кения",
        image_url: "/images/safari.jpg",
        category_id: "4",
        is_popular: false,
        is_discounted: false,
        rating: 4.9,
        included_services: ["перелет", "лодж", "полный пансион", "сафари", "русскоговорящий гид"],
        not_included_services: ["виза", "чаевые", "личные расходы"]
      },
      {
        id: 6,
        name: "Культурный тур в Японию",
        description: "Погружение в уникальную культуру и традиции Японии. Токио, Киото, сакура и древние храмы.",
        short_description: "Знакомство с культурой и традициями Японии",
        price: 110000,
        duration_days: 9,
        destination: "Токио, Япония",
        image_url: "/images/japan.jpg",
        category_id: "3",
        is_popular: false,
        is_discounted: true,
        discount_percentage: 12,
        original_price: 125000,
        rating: 4.6,
        included_services: ["перелет", "отели", "завтраки", "экскурсии", "JR Pass"],
        not_included_services: ["виза", "обеды и ужины"]
      },
      {
        id: 7,
        name: "Отдых на Мальдивах",
        description: "Роскошный отдых в бунгало над водой на райских островах. Кристально чистая вода и белоснежные пляжи.",
        short_description: "Роскошный отдых в бунгало над водой",
        price: 180000,
        duration_days: 8,
        destination: "Мальдивы",
        image_url: "/images/maldives.jpg",
        category_id: "1",
        is_popular: true,
        is_discounted: false,
        rating: 4.9,
        included_services: ["перелет", "бунгало", "все включено", "сноркелинг", "SPA"],
        not_included_services: ["трансфер на гидросамолете", "дайвинг"]
      },
      {
        id: 8,
        name: "Горные лыжи в Норвегии",
        description: "Катание на лыжах в живописных норвежских фьордах. Современные курорты и уникальная северная природа.",
        short_description: "Горнолыжный тур по норвежским фьордам",
        price: 85000,
        duration_days: 7,
        destination: "Осло, Норвегия",
        image_url: "/images/norway.jpg",
        category_id: "2",
        is_popular: false,
        is_discounted: true,
        discount_percentage: 8,
        original_price: 92500,
        rating: 4.7,
        included_services: ["перелет", "отель", "ски-пасс", "прокат оборудования", "трансферы"],
        not_included_services: ["страховка", "личные расходы"]
      },
      {
        id: 9,
        name: "Путешествие в Египет",
        description: "Экскурсии к великим пирамидам и отдых на Красном море. Древняя история и прекрасный дайвинг.",
        short_description: "Пирамиды Гизы и отдых на Красном море",
        price: 55000,
        duration_days: 10,
        destination: "Каир, Египет",
        image_url: "/images/egypt.jpg",
        category_id: "3",
        is_popular: true,
        is_discounted: false,
        rating: 4.5,
        included_services: ["перелет", "отель 4*", "питание", "экскурсии", "дайвинг"],
        not_included_services: ["виза", "личные расходы"]
      },
      {
        id: 10,
        name: "Отдых в Греции",
        description: "Невероятные острова Санторини и Миконос с белоснежными домами и бирюзовыми куполами церквей.",
        short_description: "Отдых на легендарных греческих островах",
        price: 78000,
        duration_days: 8,
        destination: "Санторини, Греция",
        image_url: "/images/greece.jpg",
        category_id: "1",
        is_popular: true,
        is_discounted: true,
        discount_percentage: 5,
        original_price: 82000,
        rating: 4.8,
        included_services: ["перелет", "отель", "завтраки", "трансферы", "экскурсия"],
        not_included_services: ["обеды и ужины", "личные расходы"]
      },
      {
        id: 11,
        name: "Гастрономический тур в Испанию",
        description: "Знакомство с изысканной кухней и культурой Испании. Тапас, паэлья и винные дегустации.",
        short_description: "Кулинарное путешествие по Испании",
        price: 92000,
        duration_days: 9,
        destination: "Барселона, Испания",
        image_url: "/images/spain.jpg",
        category_id: "3",
        is_popular: false,
        is_discounted: false,
        rating: 4.6,
        included_services: ["перелет", "отель", "гастрономические туры", "дегустации", "трансферы"],
        not_included_services: ["виза", "личные расходы"]
      },
      {
        id: 12,
        name: "Приключение в Австралии",
        description: "Исследование Большого Барьерного рифа и знаменитого Сиднея. Уникальная природа и современные мегаполисы.",
        short_description: "Экзотическое приключение по Австралии",
        price: 220000,
        duration_days: 14,
        destination: "Сидней, Австралия",
        image_url: "/images/australia.jpg",
        category_id: "4",
        is_popular: true,
        is_discounted: true,
        discount_percentage: 10,
        original_price: 244000,
        rating: 4.9,
        included_services: ["перелет", "отели", "завтраки", "экскурсии", "дайвинг"],
        not_included_services: ["виза", "страховка", "личные расходы"]
      },
      {
        id: 13,
        name: "Тур в Дубай",
        description: "Роскошный отдых в ультрасовременном мегаполисе. Бурдж-Халифа, пальмовые острова и шоппинг.",
        short_description: "Городской тур в футуристический Дубай",
        price: 98000,
        duration_days: 7,
        destination: "Дубай, ОАЭ",
        image_url: "/images/dubai.jpg",
        category_id: "3",
        is_popular: true,
        is_discounted: false,
        rating: 4.7,
        included_services: ["перелет", "отель 5*", "завтраки", "экскурсии", "трансферы"],
        not_included_services: ["виза", "обеды и ужины"]
      },
      {
        id: 14,
        name: "Экотуризм в Перу",
        description: "Посещение загадочного Мачу-Пикчу и путешествие по Амазонке. Древние цивилизации и дикая природа.",
        short_description: "Мачу-Пикчу и джунгли Амазонки",
        price: 125000,
        duration_days: 12,
        destination: "Лима, Перу",
        image_url: "/images/peru.jpg",
        category_id: "4",
        is_popular: false,
        is_discounted: true,
        discount_percentage: 7,
        original_price: 134000,
        rating: 4.8,
        included_services: ["перелет", "отели", "питание", "гиды", "входные билеты"],
        not_included_services: ["виза", "личные расходы"]
      },
      {
        id: 15,
        name: "Тур по Великобритании",
        description: "Экскурсии по историческому Лондону и загадочным шотландским замкам. Королевские традиции и средневековая архитектура.",
        short_description: "Исторический тур по Англии и Шотландии",
        price: 95000,
        duration_days: 10,
        destination: "Лондон, Великобритания",
        image_url: "/images/uk.jpg",
        category_id: "3",
        is_popular: false,
        is_discounted: false,
        rating: 4.6,
        included_services: ["перелет", "отели", "завтраки", "экскурсии", "трансферы"],
        not_included_services: ["виза", "обеды и ужины"]
      },
      {
        id: 16,
        name: "Пляжный отдых на Кубе",
        description: "Ритмы сальсы, колониальная архитектура и карибские пляжи. Уникальная атмосфера острова Свободы.",
        short_description: "Карибский отдых с кубинским колоритом",
        price: 82000,
        duration_days: 11,
        destination: "Гавана, Куба",
        image_url: "/images/cuba.jpg",
        category_id: "1",
        is_popular: true,
        is_discounted: true,
        discount_percentage: 12,
        original_price: 93000,
        rating: 4.7,
        included_services: ["перелет", "отель", "питание", "экскурсии", "трансферы"],
        not_included_services: ["виза", "личные расходы"]
      },
      {
        id: 17,
        name: "Тур в Таиланд",
        description: "Храмы Бангкока, пляжи Пхукета и самобытная культура. Экзотика Юго-Восточной Азии.",
        short_description: "Храмы Бангкока и пляжи Пхукета",
        price: 75000,
        duration_days: 12,
        destination: "Бангкок, Таиланд",
        image_url: "/images/thailand.jpg",
        category_id: "1",
        is_popular: true,
        is_discounted: false,
        rating: 4.7,
        included_services: ["перелет", "отели", "завтраки", "экскурсии", "трансферы"],
        not_included_services: ["виза", "обеды и ужины"]
      },
      {
        id: 18,
        name: "Путешествие во Вьетнам",
        description: "Бухта Халонг, древний Хойан и самобытная культура. Уникальное сочетание природы и истории.",
        short_description: "Бухта Халонг и древний город Хойан",
        price: 68000,
        duration_days: 11,
        destination: "Ханой, Вьетнам",
        image_url: "/images/vietnam.jpg",
        category_id: "3",
        is_popular: false,
        is_discounted: true,
        discount_percentage: 8,
        original_price: 74000,
        rating: 4.5,
        included_services: ["перелет", "отели", "завтраки", "экскурсии", "трансферы"],
        not_included_services: ["виза", "обеды и ужины"]
      }
    ];
  };

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/tours`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🎯 API Response:', data);

      if (data.success && data.data && data.data.length > 0) {
        console.log(`✅ Loaded ${data.data.length} tours from API`);
        // Преобразуем category_id в строки для единообразия
        const formattedServices = data.data.map(service => ({
          ...service,
          category_id: service.category_id?.toString()
        }));
        setServices(formattedServices);
      } else {
        console.log('⚠️ Using mock data');
        const mockTours = getAllMockTours();
        setServices(mockTours);
      }
    } catch (error) {
      console.error('❌ API Error, using mock data:', error);
      const mockTours = getAllMockTours();
      setServices(mockTours);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Преобразуем ID категорий в строки для единообразия
          const formattedCategories = (data.data || data.categories || []).map(cat => ({
            ...cat,
            id: cat.id.toString()
          }));
          setCategories(formattedCategories);
        } else {
          setCategories([
            { id: '1', name: 'Пляжный отдых', icon: '🏖️', description: 'Отдых на море' },
            { id: '2', name: 'Горный туризм', icon: '⛰️', description: 'Походы в горы' },
            { id: '3', name: 'Городские туры', icon: '🏙️', description: 'Экскурсии по городам' },
            { id: '4', name: 'Приключения', icon: '🧗', description: 'Экстремальные туры' }
          ]);
        }
      } else {
        setCategories([
          { id: '1', name: 'Пляжный отдых', icon: '🏖️', description: 'Отдых на море' },
          { id: '2', name: 'Горный туризм', icon: '⛰️', description: 'Походы в горы' },
          { id: '3', name: 'Городские туры', icon: '🏙️', description: 'Экскурсии по городам' },
          { id: '4', name: 'Приключения', icon: '🧗', description: 'Экстремальные туры' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([
        { id: '1', name: 'Пляжный отдых', icon: '🏖️', description: 'Отдых на море' },
        { id: '2', name: 'Горный туризм', icon: '⛰️', description: 'Походы в горы' },
        { id: '3', name: 'Городские туры', icon: '🏙️', description: 'Экскурсии по городам' },
        { id: '4', name: 'Приключения', icon: '🧗', description: 'Экстремальные туры' }
      ]);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  const toggleCategory = (categoryId) => {
    const categoryIdStr = categoryId.toString();
    setSelectedCategories(prev => 
      prev.includes(categoryIdStr) 
        ? prev.filter(id => id !== categoryIdStr)
        : [...prev, categoryIdStr]
    );
  };

  const clearAllCategories = () => {
    setSelectedCategories([]);
  };

  const value = {
    services,
    allServices: services,
    categories,
    selectedCategories,
    isLoading,
    error,
    toggleCategory,
    clearAllCategories,
    refetch: fetchServices
  };

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
};