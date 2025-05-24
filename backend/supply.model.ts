import { DataTypes, Model } from 'sequelize';
import sequelize from './sequelize';

export class Supply extends Model {
  public id!: number;
  public date!: Date;
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
  }
);

export class SupplyItem extends Model {
  public id!: number;
  public supplyId!: number;
  public productId!: number;
  public quantity!: number;
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
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'SupplyItem',
  }
);

// Установка связей
Supply.hasMany(SupplyItem, { foreignKey: 'supplyId' });
SupplyItem.belongsTo(Supply, { foreignKey: 'supplyId' });
