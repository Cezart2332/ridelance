export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  pricePerWeek: number;
  oldPrice?: number;
  discountActive: boolean;
  offerType: 'Închiriere săptămânală' | 'La rămânere';
  status: 'Disponibilă acum' | 'În curând' | 'Indisponibilă' | 'În service';
  engine: 'Electric' | 'Hybrid' | 'GPL' | 'Benzină' | 'Diesel';
  transmission: 'Automată' | 'Manuală';
  location: string;
  categories: string[];
  badges: string[];
  images: string[];
  description: string;
  active: boolean;
  stats: {
    views: number;
    clicks: number;
    forms: number;
  };
}

export interface Lead {
  id: string;
  carId: string;
  carName: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  experience: string;
  message?: string;
  status: 'Nou' | 'Contactat' | 'În discuție' | 'Acceptat' | 'Respins';
  createdAt: string;
}

import teslaImg from '../../../../assets/cars/tesla_model_3.png';
import loganImg from '../../../../assets/cars/dacia_logan.png';
import corollaImg from '../../../../assets/cars/toyota_corolla.png';

export const mockCars: Car[] = [
  {
    id: '1',
    brand: 'Tesla',
    model: 'Model 3 Long Range',
    year: 2024,
    pricePerWeek: 1400,
    oldPrice: 1600,
    discountActive: true,
    offerType: 'Închiriere săptămânală',
    status: 'Disponibilă acum',
    engine: 'Electric',
    transmission: 'Automată',
    location: 'București / Ilfov',
    categories: ['UberX', 'Uber Comfort', 'Uber Green', 'Bolt', 'Bolt Comfort', 'Bolt Electric'],
    badges: ['Disponibilă acum', 'Electrică', 'Automată', 'Uber + Bolt', 'Comfort eligible', 'Green eligible'],
    images: [teslaImg, corollaImg, loganImg],
    description: 'Tesla Model 3 Long Range 2024, autonomie extinsă, ideală pentru Uber Green și Comfort.',
    active: true,
    stats: { views: 1250, clicks: 85, forms: 12 }
  },
  {
    id: '2',
    brand: 'Toyota',
    model: 'Corolla Hybrid',
    year: 2024,
    pricePerWeek: 950,
    discountActive: false,
    offerType: 'La rămânere',
    status: 'În curând',
    engine: 'Hybrid',
    transmission: 'Automată',
    location: 'București / Otopeni',
    categories: ['UberX', 'Uber Comfort', 'Bolt', 'Bolt Comfort'],
    badges: ['În curând', 'Hybrid', 'Automată', 'La rămânere', 'Uber + Bolt'],
    images: [corollaImg, teslaImg, loganImg],
    description: 'Toyota Corolla Hybrid 2024, consum redus, fiabilitate japoneză.',
    active: true,
    stats: { views: 890, clicks: 42, forms: 5 }
  },
  {
    id: '3',
    brand: 'Dacia',
    model: 'Logan III Stepway Look',
    year: 2024,
    pricePerWeek: 650,
    oldPrice: 750,
    discountActive: true,
    offerType: 'Închiriere săptămânală',
    status: 'Disponibilă acum',
    engine: 'GPL',
    transmission: 'Manuală',
    location: 'București / Militari',
    categories: ['UberX', 'Bolt'],
    badges: ['Disponibilă acum', 'GPL', 'Economic', 'Uber + Bolt'],
    images: [loganImg, teslaImg, corollaImg],
    description: 'Dacia Logan III cu GPL din fabrică, cea mai economică variantă pentru ridesharing.',
    active: true,
    stats: { views: 2100, clicks: 156, forms: 28 }
  },
  {
    id: '4',
    brand: 'Tesla',
    model: 'Model Y Performance',
    year: 2024,
    pricePerWeek: 1800,
    discountActive: false,
    offerType: 'Închiriere săptămânală',
    status: 'Disponibilă acum',
    engine: 'Electric',
    transmission: 'Automată',
    location: 'București / Nord',
    categories: ['UberX', 'Uber Comfort', 'Uber Black', 'Bolt', 'Bolt Premium'],
    badges: ['Black Eligible', 'Performance', 'Electric'],
    images: [teslaImg, loganImg, corollaImg],
    description: 'Tesla Model Y Performance, SUV electric de top pentru clienți premium.',
    active: true,
    stats: { views: 450, clicks: 20, forms: 2 }
  },
  {
    id: '5',
    brand: 'Toyota',
    model: 'Camry Hybrid',
    year: 2023,
    pricePerWeek: 1200,
    discountActive: false,
    offerType: 'La rămânere',
    status: 'În curând',
    engine: 'Hybrid',
    transmission: 'Automată',
    location: 'Cluj-Napoca',
    categories: ['UberX', 'Uber Comfort', 'Bolt', 'Bolt Comfort'],
    badges: ['Premium', 'Hybrid', 'Comfort'],
    images: [corollaImg, loganImg, teslaImg],
    description: 'Toyota Camry Hybrid, eleganță și spațiu generos pentru pasageri.',
    active: true,
    stats: { views: 320, clicks: 15, forms: 1 }
  },
  {
    id: '6',
    brand: 'Dacia',
    model: 'Jogger Hybrid 140',
    year: 2024,
    pricePerWeek: 850,
    discountActive: false,
    offerType: 'Închiriere săptămânală',
    status: 'Disponibilă acum',
    engine: 'Hybrid',
    transmission: 'Automată',
    location: 'Brașov',
    categories: ['UberX', 'Bolt'],
    badges: ['7 Locuri', 'Hybrid', 'Nou'],
    images: [loganImg, corollaImg, teslaImg],
    description: 'Dacia Jogger Hybrid, 7 locuri, perfectă pentru grupuri și bagaje multe.',
    active: true,
    stats: { views: 560, clicks: 34, forms: 4 }
  },
  {
    id: '7',
    brand: 'Volkswagen',
    model: 'ID.4 Pro',
    year: 2023,
    pricePerWeek: 1500,
    oldPrice: 1700,
    discountActive: true,
    offerType: 'Închiriere săptămânală',
    status: 'Disponibilă acum',
    engine: 'Electric',
    transmission: 'Automată',
    location: 'Timișoara',
    categories: ['UberX', 'Uber Comfort', 'Uber Green', 'Bolt', 'Bolt Electric'],
    badges: ['SUV Electric', 'Green', 'Reducere'],
    images: [teslaImg, corollaImg, loganImg],
    description: 'Volkswagen ID.4, un SUV electric versatil și confortabil.',
    active: true,
    stats: { views: 280, clicks: 12, forms: 1 }
  },
  {
    id: '8',
    brand: 'Hyundai',
    model: 'Ioniq 5',
    year: 2024,
    pricePerWeek: 1600,
    discountActive: false,
    offerType: 'La rămânere',
    status: 'În service',
    engine: 'Electric',
    transmission: 'Automată',
    location: 'Iași',
    categories: ['UberX', 'Uber Comfort', 'Uber Green', 'Bolt', 'Bolt Electric'],
    badges: ['Design Futurists', 'Fast Charging', 'În service'],
    images: [teslaImg, loganImg, corollaImg],
    description: 'Hyundai Ioniq 5, încărcare ultra-rapidă și design revoluționar.',
    active: false,
    stats: { views: 150, clicks: 5, forms: 0 }
  },
  {
    id: '9',
    brand: 'Renault',
    model: 'Megane E-Tech',
    year: 2023,
    pricePerWeek: 1300,
    discountActive: false,
    offerType: 'Închiriere săptămânală',
    status: 'Disponibilă acum',
    engine: 'Electric',
    transmission: 'Automată',
    location: 'Constanța',
    categories: ['UberX', 'Uber Green', 'Bolt', 'Bolt Electric'],
    badges: ['Agilă', 'Franțuzească', 'Green'],
    images: [teslaImg, corollaImg, loganImg],
    description: 'Renault Megane E-Tech, agilitate urbană și tehnologie de ultimă oră.',
    active: true,
    stats: { views: 410, clicks: 22, forms: 3 }
  },
  {
    id: '10',
    brand: 'Skoda',
    model: 'Octavia IV PHEV',
    year: 2024,
    pricePerWeek: 1100,
    oldPrice: 1250,
    discountActive: true,
    offerType: 'La rămânere',
    status: 'Indisponibilă',
    engine: 'Hybrid',
    transmission: 'Automată',
    location: 'București / Pipera',
    categories: ['UberX', 'Uber Comfort', 'Bolt', 'Bolt Comfort'],
    badges: ['Plug-in Hybrid', 'Spațioasă', 'Indisponibilă'],
    images: [corollaImg, teslaImg, loganImg],
    description: 'Skoda Octavia Plug-in Hybrid, mix-ul perfect între electric și benzină.',
    active: true,
    stats: { views: 670, clicks: 28, forms: 4 }
  }
];

export const mockLeads: Lead[] = [
  {
    id: 'l1',
    carId: '1',
    carName: 'Tesla Model 3 Long Range',
    userName: 'Andrei Ionescu',
    userEmail: 'andrei.ionescu@gmail.com',
    userPhone: '0722123456',
    experience: 'Peste 3 ani',
    message: 'Doresc să închiriez mașina pe termen lung.',
    status: 'Nou',
    createdAt: '2026-05-07T10:30:00Z'
  },
  {
    id: 'l2',
    carId: '3',
    carName: 'Dacia Logan III Stepway Look',
    userName: 'Mihai Popescu',
    userEmail: 'mihai.popescu@yahoo.com',
    userPhone: '0744987654',
    experience: '1-3 ani',
    status: 'Contactat',
    createdAt: '2026-05-06T15:45:00Z'
  },
  {
    id: 'l3',
    carId: '2',
    carName: 'Toyota Corolla Hybrid',
    userName: 'Elena Dumitru',
    userEmail: 'elena.d@outlook.com',
    userPhone: '0755112233',
    experience: 'Sub 1 an',
    status: 'În discuție',
    createdAt: '2026-05-05T09:20:00Z'
  },
  {
    id: 'l4',
    carId: '3',
    carName: 'Dacia Logan III Stepway Look',
    userName: 'George Marin',
    userEmail: 'george.m@gmail.com',
    userPhone: '0733009988',
    experience: 'Peste 3 ani',
    status: 'Acceptat',
    createdAt: '2026-05-04T12:00:00Z'
  }
];
