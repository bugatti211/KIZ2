import express from 'express';
import { Sequelize } from 'sequelize';
import User from './user.model';
import Ad from './ad.model';
import Category from './category.model';
import Product from './product.model';
import { Supply, SupplyItem } from './supply.model';
import { asyncHandler } from './asyncHandler';
import { authMiddleware } from './authMiddleware';
import type { Request, Response } from 'express';
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Настройка подключения к PostgreSQL через Sequelize
const sequelize = new Sequelize('postgres://postgres:925248914@localhost:5432/mobile_app');

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is working!');
});

// Проверка подключения к БД
sequelize.authenticate()
  .then(() => console.log('Database connected'))
  .catch((err: any) => console.error('Database connection error:', err));

// Синхронизация модели User с БД
User.sync();

// Синхронизация модели Ad с БД
Ad.sync();

// Синхронизация модели Product с БД
Product.sync();

// Синхронизация модели Supply с БД
Supply.sync();

// Синхронизация модели SupplyItem с БД
SupplyItem.sync();

// CRUD роуты для User
app.post('/users', asyncHandler(async (req: Request, res: Response) => {
  const user = await User.create(req.body);
  res.status(201).json(user);
}));

// Защищённые CRUD роуты для User
app.get('/users', authMiddleware as any, (req, res, next) => {
  User.findAll()
    .then(users => res.json(users))
    .catch(next);
});

app.get('/users/:id', authMiddleware as any, (req, res, next) => {
  User.findByPk(req.params.id)
    .then(user => {
      if (user) res.json(user);
      else res.status(404).json({ error: 'User not found' });
    })
    .catch(next);
});

app.put('/users/:id', authMiddleware as any, (req, res, next) => {
  User.findByPk(req.params.id)
    .then(user => {
      if (!user) return res.status(404).json({ error: 'User not found' });
      return user.update(req.body).then(updated => res.json(updated));
    })
    .catch(next);
});

app.delete('/users/:id', authMiddleware as any, (req, res, next) => {
  User.findByPk(req.params.id)
    .then(user => {
      if (!user) return res.status(404).json({ error: 'User not found' });
      return user.destroy().then(() => res.json({ message: 'User deleted' }));
    })
    .catch(next);
});

// Регистрация
app.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'User already exists' });
  }
  const user = await User.create({ name, email, password });
  res.status(201).json({ id: user.id, name: user.name, email: user.email });
}));

// Вход
app.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
}));

// CRUD для объявлений
app.post('/ads', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {
  const { text, phone } = req.body;
  // @ts-ignore
  const userId = req.user.id;
  if (!text || !phone) {
    return res.status(400).json({ error: 'Text and phone are required' });
  }
  const ad = await Ad.create({ text, phone, userId });
  res.status(201).json(ad);
}));

// Получить все утверждённые объявления
app.get('/ads', asyncHandler(async (req: Request, res: Response) => {
  const ads = await Ad.findAll({ where: { status: 'approved' }, include: [{ model: User, attributes: ['id', 'name', 'email'] }] });
  res.json(ads);
}));

// Получить все объявления для модерации (только для администратора, но пока без ролей)
app.get('/ads/moderation', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {
  const ads = await Ad.findAll({ where: { status: 'pending' }, include: [{ model: User, attributes: ['id', 'name', 'email'] }] });
  res.json(ads);
}));

// Подтвердить объявление
app.post('/ads/:id/approve', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {
  const ad = await Ad.findByPk(req.params.id);
  if (!ad) return res.status(404).json({ error: 'Ad not found' });
  ad.status = 'approved';
  await ad.save();
  res.json(ad);
}));

// Отклонить объявление
app.post('/ads/:id/reject', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {
  const ad = await Ad.findByPk(req.params.id);
  if (!ad) return res.status(404).json({ error: 'Ad not found' });
  ad.status = 'rejected';
  await ad.save();
  res.json(ad);
}));

// Категории: CRUD
app.get('/categories', asyncHandler(async (req: Request, res: Response) => {
  const categories = await Category.findAll();
  res.json(categories);
}));

app.post('/categories', asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  const category = await Category.create({ name });
  res.status(201).json(category);
}));

app.delete('/categories/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await Category.destroy({ where: { id } });
  if (!deleted) return res.status(404).json({ error: 'Категория не найдена' });
  res.json({ success: true });
}));

// --- PRODUCTS CRUD ---
app.get('/products', asyncHandler(async (req: Request, res: Response) => {
  const products = await Product.findAll();
  res.json(products);
}));

app.get('/products/:id', asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
}));

app.post('/products', asyncHandler(async (req: Request, res: Response) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
}));

app.put('/products/:id', asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  await product.update(req.body);
  res.json(product);
}));

app.patch('/products/:id', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ error: 'Товар не найден' });
  
  if (typeof req.body.active !== 'boolean') {
    return res.status(400).json({ error: 'Поле active должно быть boolean' });
  }
  
  await product.update({ active: req.body.active });
  res.json(product);
}));

app.delete('/products/:id', asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  await product.destroy();
  res.json({ success: true });
}));

// Endpoints для поставок
app.post('/supplies', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Необходимо указать товары для поставки' });
  }

  const supply = await Supply.create({});

  try {
    // Создаем записи о поставке и обновляем количество товаров
    for (const item of items) {
      const { productId, quantity } = item;
      
      if (!productId || !quantity || quantity <= 0) {
        throw new Error('Неверные данные поставки');
      }

      const product = await Product.findByPk(productId);
      if (!product) {
        throw new Error(`Товар с ID ${productId} не найден`);
      }

      // Создаем запись о позиции в поставке
      await SupplyItem.create({
        supplyId: supply.id,
        productId,
        quantity
      });

      // Обновляем количество товара
      await product.update({
        stock: product.stock + quantity
      });
    }

    res.status(201).json(supply);
  } catch (e) {
    // В случае ошибки удаляем поставку
    await supply.destroy();
    throw e;
  }
}));

app.get('/supplies', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {
  const supplies = await Supply.findAll({
    include: [{
      model: SupplyItem,
      include: [{ model: Product }]
    }],
    order: [['date', 'DESC']]
  });
  res.json(supplies);
}));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
