import { Model, DataTypes, Association } from 'sequelize';
import sequelize from './sequelize';
import User from './user.model';
import Product from './product.model';
import Category from './category.model';

class OrderItem extends Model {
  public id!: number;
  public orderId!: number;
  public productId!: number;
  public quantity!: number;
  public price!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Associations
  public product?: Product;
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
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'OrderItem',
  timestamps: true
});

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

  // Define relationships
  public readonly items?: OrderItem[];

  // Define static associations
  public declare static associations: {
    items: Association<Order, OrderItem>;
  };
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

// Set up associations
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(OrderItem, { foreignKey: 'productId' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

export { Order, OrderItem };
