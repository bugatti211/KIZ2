import express from 'express';
import session from 'express-session';
import SequelizeStore from 'connect-session-sequelize';
import User from './user.model';
import Ad from './ad.model';
import Category from './category.model';
import Product from './product.model';
import Contact from './contact.model';
import { Order, OrderItem } from './order.model';
import { Supply, SupplyItem } from './supply.model';
import Sale, { SaleItem } from './sale.model';
import { asyncHandler } from './asyncHandler';
import { authMiddleware } from './authMiddleware';
import type { Request, Response } from 'express';
import sequelizeInstance from './sequelize';
import { Op } from 'sequelize';
import { UserRole } from './constants/roles';
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Initialize sequelize store
const SessionStore = SequelizeStore(session.Store);
const sessionStore = new SessionStore({
  db: sequelizeInstance,
});

// Setup session middleware with sequelize store
app.use(session({
  secret: 'your-session-secret',
  store: sessionStore,
  resave: true,
  saveUninitialized: true,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Create the sessions table if it doesn't exist
sessionStore.sync();

// Extend express-session types
declare module 'express-session' {
  interface SessionData {
    cart: {
      [key: string]: Array<{
        productId: number;
        quantity: number;
      }>;
    };
  }
}

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is working!');
});

// Проверка подключения к БД
sequelizeInstance.authenticate()
  .then(() => console.log('Database connected'))
  .catch((err: any) => console.error('Database connection error:', err));

// Ensure "Поставки новые" category exists
const ensureNewSuppliesCategory = async () => {
  try {
    await Category.findOrCreate({
      where: { name: 'Поставки новые' },
      defaults: { name: 'Поставки новые' }
    });
  } catch (error) {
    console.error('Error creating default category:', error);
  }
};

// Call this after DB connection is established
sequelizeInstance.authenticate()
  .then(() => {
    console.log('Database connected');
    ensureNewSuppliesCategory();
  })
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
app.post('/register', asyncHandler(async (req: Request, res: Response) => {  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'User already exists' });
  }  // Set default role as "user" for regular registration
  const userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  } = {
    name,
    email,
    password,
    role: UserRole.USER
  };
  const user = await User.create(userData);
  res.status(201).json({ id: user.id, name: user.name, email: user.email });
}));

// Регистрация сотрудника
app.post('/users/register-employee', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }  // Validate role
  const validRoles = [UserRole.SELLER, UserRole.ACCOUNTANT, UserRole.LOADER];
  if (!validRoles.includes(role as UserRole)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const user = await User.create({ name, email, password, role });
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
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
  }  // Generate JWT token with all required user info
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };
  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: tokenPayload });
}));

// CRUD для объявлений
app.post('/ads', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {
  const { text, phone } = req.body;
  // @ts-ignore
  const userId = req.user.id;
  if (!text || !phone) {
    return res.status(400).json({ error: 'Text and phone are required' });
  }  const ad = await Ad.create({ text, phone, userId, status: 'pending' });
  res.status(201).json(ad);
}));

// Получить все утверждённые объявления
app.get('/ads', asyncHandler(async (req: Request, res: Response) => {
  // Only return ads that are both approved and not deleted
  const ads = await Ad.findAll({ 
    where: { 
      status: 'approved',
      deleted: false 
    }, 
    order: [['createdAt', 'DESC']],
    include: [{ model: User, attributes: ['id', 'name', 'email'] }] 
  });
  res.json(ads);
}));

// Получить все объявления для модерации (только для администратора)
app.get('/ads/moderation', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {
  // @ts-ignore
  if (req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Access denied' });
  }
  // Для админа показываем все не удаленные объявления, отсортированные:
  // - Сначала все в ожидании модерации
  // - Затем подтвержденные
  // - И в конце отклоненные
  const ads = await Ad.findAll({ 
    where: { deleted: false },
    order: [
      [sequelizeInstance.literal(`CASE 
        WHEN status = 'pending' THEN 1 
        WHEN status = 'approved' THEN 2 
        WHEN status = 'rejected' THEN 3 
        END`), 'ASC'],
      ['createdAt', 'DESC']
    ],
    include: [{ model: User, attributes: ['id', 'name', 'email'] }] 
  });
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

// Удалить объявление
app.delete('/ads/:id', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {
  // @ts-ignore
  if (req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const ad = await Ad.findByPk(req.params.id);
  if (!ad) return res.status(404).json({ error: 'Ad not found' });
  
  // Soft delete by setting the deleted flag instead of destroying the record
  await ad.update({ deleted: true });
  res.json({ success: true });
}));

// Категории: CRUD
app.get('/categories', asyncHandler(async (req: Request, res: Response) => {
  const categories = await Category.findAll();
  res.json(categories);
}));

app.post('/categories', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {  // @ts-ignore
  if (req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Только администратор может создавать категории' });
  }
  
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  const category = await Category.create({ name });
  res.status(201).json(category);
}));

app.delete('/categories/:id', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {  // @ts-ignore
  if (req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Только администратор может удалять категории' });
  }

  const { id } = req.params;
  const deleted = await Category.destroy({ where: { id } });
  if (!deleted) return res.status(404).json({ error: 'Категория не найдена' });
  res.json({ success: true });
}));

// --- PRODUCTS CRUD ---
app.get('/products', asyncHandler(async (req: Request, res: Response) => {
  const products = await Product.findAll({
    include: [{
      model: Category,
      as: 'category'
    }]
  });
  res.json(products);
}));

app.get('/products/:id', asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByPk(req.params.id, {
    include: [{
      model: Category,
      as: 'category'
    }]
  });
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
}));

app.post('/products', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {
  try {
    // Получаем пользователя из запроса (добавляется middleware)
    const { user } = req as any;
    if (!user) {
      return res.status(401).json({ error: 'Необходима авторизация' });
    }

    // Добавляем userId к данным товара
    const productData = {
      ...req.body,
      userId: user.id
    };

    // Проверяем обязательные поля
    if (!productData.name || !productData.categoryId || productData.price === undefined) {
      return res.status(400).json({ error: 'Необходимо заполнить все обязательные поля' });
    }

    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (e: any) {
    console.error('Error creating product:', e);
    res.status(400).json({ error: e.message || 'Ошибка при создании товара' });
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
app.post('/supplies', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {  const { items, code, supplier } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Необходимо указать товары для поставки' });
  }

  if (!code) {
    return res.status(400).json({ error: 'Необходимо указать номер поставки' });
  }

  if (!supplier) {
    return res.status(400).json({ error: 'Необходимо указать поставщика' });
  }

  const supply = await Supply.create({ 
    code,
    supplier,
    date: new Date()
  });

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
  try {
    const supplies = await Supply.findAll({
      include: [{
        model: SupplyItem,
        as: 'items',
        include: [{ 
          model: Product,
          as: 'product',
          attributes: ['id', 'name']
        }]
      }],
      order: [['date', 'DESC']]
    });
    
    if (!supplies || supplies.length === 0) {
      return res.status(200).json([]); // Return empty array instead of 404
    }

    res.json(supplies);
  } catch (error: any) {
    console.error('Error fetching supplies:', error);
    res.status(500).json({ 
      error: 'Failed to fetch supplies',
      details: error.message 
    });
  }
}));

// Get contacts endpoint
app.get('/api/contacts', asyncHandler(async (req: Request, res: Response) => {
  const contacts = await Contact.findOne();
  if (!contacts) {
    return res.status(404).json({ message: 'Contacts not found' });
  }
  res.json(contacts);
}));

// Cart Endpoints
app.get('/cart', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user.id;

  try {
    // Initialize cart if it doesn't exist
    if (!req.session.cart) {
      req.session.cart = {};
    }
    if (!req.session.cart[userId]) {
      req.session.cart[userId] = [];
    }

    // Get cart from user's session
    const cartItems = req.session.cart[userId];
    
    // Fetch full product details for each item
    const itemsWithDetails = await Promise.all(
      cartItems.map(async (item) => {
        const product = await Product.findByPk(item.productId, {
          include: [{
            model: Category,
            as: 'category'
          }]
        });
        if (!product) return null;

        return {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          stock: product.stock,
          isByWeight: product.category?.name === 'На развес'
        };
      })
    );

    // Filter out null items (products that no longer exist)
    const validItems = itemsWithDetails.filter((item): item is NonNullable<typeof item> => item !== null);
    
    // If some items were filtered out (deleted products), update the session
    if (validItems.length !== cartItems.length) {
      req.session.cart[userId] = cartItems.filter(item => 
        validItems.some(valid => valid.id === item.productId)
      );
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    
    res.json(validItems);
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
}));

app.post('/cart/add', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity } = req.body;
  // @ts-ignore
  const userId = req.user.id;

  if (!productId || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid product or quantity' });
  }

  try {
    // Check if product exists and has enough stock first
    const product = await Product.findByPk(productId, {
      include: [{
        model: Category,
        as: 'category'
      }]
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Not enough stock' });
    }

    // Initialize session cart if it doesn't exist
    if (!req.session.cart) {
      req.session.cart = {};
    }
    if (!req.session.cart[userId]) {
      req.session.cart[userId] = [];
    }

    // Add to cart
    const existingItemIndex = req.session.cart[userId].findIndex(
      (item) => item.productId === productId
    );

    if (existingItemIndex >= 0) {
      req.session.cart[userId][existingItemIndex].quantity += quantity;
    } else {
      req.session.cart[userId].push({ productId, quantity });
    }

    // Save session explicitly
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Return updated cart data with product details
    const cartItems = await Promise.all(
      req.session.cart[userId].map(async (item) => {
        const cartProduct = await Product.findByPk(item.productId, {
          include: [{
            model: Category,
            as: 'category'
          }]
        });
        if (!cartProduct) return null;

        return {
          id: cartProduct.id,
          name: cartProduct.name,
          price: cartProduct.price,
          quantity: item.quantity,
          stock: cartProduct.stock,
          isByWeight: cartProduct.category?.name === 'На развес'
        };
      })
    );

    const validItems = cartItems.filter((item): item is NonNullable<typeof item> => item !== null);
    res.status(200).json(validItems);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
}));

app.put('/cart/update', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity } = req.body;
  // @ts-ignore
  const userId = req.user.id;

  if (!productId || quantity < 0) {
    return res.status(400).json({ error: 'Invalid product or quantity' });
  }

  try {
    // Check if product exists and has enough stock
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Not enough stock' });
    }

    if (!req.session.cart?.[userId]) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const itemIndex = req.session.cart[userId].findIndex(
      (item) => item.productId === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      req.session.cart[userId].splice(itemIndex, 1);
    } else {
      // Update quantity
      req.session.cart[userId][itemIndex].quantity = quantity;
    }

    res.json(req.session.cart[userId]);
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
}));

app.delete('/cart/remove/:productId', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  // @ts-ignore
  const userId = req.user.id;

  try {
    if (!req.session.cart?.[userId]) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    req.session.cart[userId] = req.session.cart[userId].filter(
      (item) => item.productId !== parseInt(productId)
    );

    res.json(req.session.cart[userId]);
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
}));

app.delete('/cart/clear', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user.id;

  try {
    if (req.session.cart) {
      req.session.cart[userId] = [];
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
}));

// Order endpoints
app.post('/orders', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {
  const orderData = req.body;
  
  try {
    // Start transaction
    const result = await sequelizeInstance.transaction(async (t) => {
      // Create order
      const order = await Order.create({
        userId: orderData.userId,
        name: orderData.name,
        email: orderData.email,
        address: orderData.address,
        deliveryMethod: orderData.deliveryMethod,
        paymentMethod: orderData.paymentMethod,
        comment: orderData.comment,
        total: orderData.total
      }, { transaction: t });

      // Create order items
      const orderItems = await Promise.all(
        orderData.items.map(async (item: { productId: number; quantity: number; price: number }) => {
          const product = await Product.findByPk(item.productId);
          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          // Update product stock
          const newStock = product.stock - item.quantity;
          if (newStock < 0) {
            throw new Error(`Not enough stock for product ${product.name}`);
          }
          
          await product.update({ stock: newStock }, { transaction: t });

          return OrderItem.create({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }, { transaction: t });
        })
      );

      // Clear user's cart after successful order
      if (req.session.cart) {
        // @ts-ignore
        req.session.cart[orderData.userId] = [];
      }

      return { order, orderItems };
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(400).json({ error: error.message });
  }
}));

app.post('/orders/:id/confirm', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    await order.update({ status: 'confirmed' });
    res.json(order);
  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).json({ error: 'Failed to confirm order' });
  }
}));

app.get('/orders', authMiddleware as any, asyncHandler(async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    // @ts-ignore
    const userRole = req.user.role;
    
    // Set up where clause based on user role
    const whereClause = userRole === UserRole.ADMIN ? {} : { userId };

    const orders = await Order.findAll({
      where: whereClause,
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['name'],
          include: [{
            model: Category,
            as: 'category',
            attributes: ['name']
          }]
        }]
      }],
      order: [['createdAt', 'DESC']]
    });    const ordersWithByWeight = orders.map((order: Order) => {
      const plainOrder = order.get({ plain: true });
      return {
        ...plainOrder,
        items: plainOrder.items.map((item: any) => ({
          ...item,
          product: {
            ...item.product,
            isByWeight: item.product?.category?.name === 'На развес' || false
          }
        }))
      };
    });

    res.json(ordersWithByWeight);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}));

// Sale Endpoints
app.get('/sales', asyncHandler(async (req: Request, res: Response) => {
  const sales = await Sale.findAll({
    include: [{
      model: SaleItem,
      as: 'items',
      include: [{
        model: Product,
        as: 'product',
        include: [{
          model: Category,
          as: 'category'
        }]
      }]
    }],
    order: [['date', 'DESC']]
  });
  res.json(sales);
}));

app.get('/sales/today', asyncHandler(async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const sales = await Sale.findAll({
    where: {
      date: {
        [Op.gte]: today
      }
    },
    include: [{
      model: SaleItem,
      as: 'items',
      include: [{
        model: Product,
        as: 'product',
        include: [{
          model: Category,
          as: 'category'
        }]
      }]
    }]
  });
  
  const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const totalSales = sales.length;
  
  res.json({ totalAmount, totalSales, sales });
}));

app.get('/sales/monthly', asyncHandler(async (req: Request, res: Response) => {
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);
  
  const sales = await Sale.findAll({
    where: {
      date: {
        [Op.gte]: firstDayOfMonth
      }
    },
    include: [{
      model: SaleItem,
      as: 'items',
      include: [{
        model: Product,
        as: 'product',
        include: [{
          model: Category,
          as: 'category'
        }]
      }]
    }]
  });
  
  const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const totalSales = sales.length;
  
  res.json({ totalAmount, totalSales, sales });
}));

app.post('/sales', asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid sale items' });
  }
  const transaction = await sequelizeInstance.transaction();
    try {
    // Calculate total sale amount using actual product prices
    const total = await items.reduce(async (promise, item) => {
      const sum = await promise;
      const product = await Product.findByPk(item.productId);
      if (!product) {
        throw new Error(`Product with id ${item.productId} not found`);
      }
      return sum + (Number(product.price) * Number(item.quantity));
    }, Promise.resolve(0));
    
    // Create sale record
    const sale = await Sale.create({
      date: new Date(),
      total
    }, { transaction });
      // Create sale items and update product stock
    for (const item of items) {
      // Get product
      const product = await Product.findByPk(item.productId);
      if (!product) {
        throw new Error(`Product with id ${item.productId} not found`);
      }
      
      // Check stock
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }
      
      // Create sale item using product's actual price
      await SaleItem.create({
        saleId: sale.id,
        productId: item.productId,
        quantity: item.quantity,
        price: product.price, // Use product's actual price instead of request price
        total: item.quantity * product.price // Calculate total with actual price
      }, { transaction });
      
      // Update product stock
      await product.update({
        stock: product.stock - item.quantity
      }, { transaction });
    }
    
    await transaction.commit();
    
    // Fetch complete sale data with related items
    const completeSale = await Sale.findByPk(sale.id, {
      include: [{
        model: SaleItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          include: [{
            model: Category,
            as: 'category'
          }]
        }]
      }]
    });
    
    res.status(201).json(completeSale);
  } catch (e: any) {
    await transaction.rollback();
    res.status(400).json({ error: e.message });
  }
}));

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
