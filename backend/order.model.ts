import { Model, DataTypes } from 'sequelize';
import sequelize from './sequelize';
import User from './user.model';
import Product from './product.model';
import Category from './category.model';

class Order extends Model {
  public id!: number;
  public userId!: number;
  public name!: string;
  public email!: string;
  public address!: string;
  public deliveryMethod!: 'Самовывоз' | 'Доставка';
  public paymentMethod!: 'картой' | 'наличные';
  public comment!: string;
  public status!: string;
  public total!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Order.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  deliveryMethod: {
    type: DataTypes.ENUM('Самовывоз', 'Доставка'),
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.ENUM('картой', 'наличные'),
    allowNull: false,
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'new',
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Order',
  tableName: 'orders'
});

class OrderItem extends Model {
  public id!: number;
  public orderId!: number;
  public productId!: number;
  public quantity!: number;
  public price!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
}

OrderItem.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Order,
      key: 'id',
    },
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: 'id',
    },
  },  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'OrderItem',
  tableName: 'order_items'
});

Order.hasMany(OrderItem, { as: 'items', foreignKey: 'orderId' });
OrderItem.belongsTo(Product, { as: 'product', foreignKey: 'productId' });
// Удаляем дублирующую ассоциацию с Category, так как она уже определена в product.model.ts

export { Order, OrderItem };
