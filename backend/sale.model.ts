import { DataTypes, Model } from 'sequelize';
import sequelize from './sequelize';
import Product from './product.model';

export class Sale extends Model {
  public id!: number;
  public date!: Date;
  public total!: number;
  public items?: SaleItem[];
}

Sale.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Sale',
    tableName: 'sales',
    timestamps: false,
  }
);

export class SaleItem extends Model {
  public id!: number;
  public saleId!: number;
  public productId!: number;
  public quantity!: number;
  public price!: number;
  public total!: number;
  public product?: any;
  public sale?: Sale;
}

SaleItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    saleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sales',
        key: 'id'
      }
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    }
  },
  {
    sequelize,
    modelName: 'SaleItem',
    tableName: 'sale_items',
    timestamps: false,
  }
);

// Set up model relationships
Sale.hasMany(SaleItem, {
  foreignKey: 'saleId',
  as: 'items',
  onDelete: 'CASCADE'
});

SaleItem.belongsTo(Sale, {
  foreignKey: 'saleId',
  as: 'sale'
});

SaleItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});

Product.hasMany(SaleItem, {
  foreignKey: 'productId',
  as: 'saleItems'
});

export default Sale;
