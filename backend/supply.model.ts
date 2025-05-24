import { DataTypes, Model } from 'sequelize';
import sequelize from './sequelize';
import Product from './product.model';
import { Model as SequelizeModel } from 'sequelize';

export class Supply extends Model {
  public id!: number;
  public date!: Date;
  public items?: SupplyItem[]; // Add relation type
}

Supply.init(
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
  },
  {
    sequelize,
    modelName: 'Supply',
    tableName: 'supplies', // Ensure table name is set
    timestamps: false, // No need for timestamps since we have date
  }
);

export class SupplyItem extends Model {
  public id!: number;
  public supplyId!: number;
  public productId!: number;
  public quantity!: number;
  public product?: any; // Add relation type
  public supply?: Supply; // Add relation type
}

SupplyItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    supplyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'supplies',
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
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'SupplyItem',
    tableName: 'supply_items', // Ensure table name is set
    timestamps: false,
  }
);

// Set up model relationships
Supply.hasMany(SupplyItem, { 
  foreignKey: 'supplyId',
  as: 'items',
  onDelete: 'CASCADE'
});

SupplyItem.belongsTo(Supply, { 
  foreignKey: 'supplyId',
  as: 'supply'
});

SupplyItem.belongsTo(Product, { 
  foreignKey: 'productId',
  as: 'product'
});

Product.hasMany(SupplyItem, { 
  foreignKey: 'productId',
  as: 'supplyItems'
});
