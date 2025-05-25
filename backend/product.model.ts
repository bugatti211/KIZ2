import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './sequelize';
import Category from './category.model';

interface ProductAttributes {
  id: number;
  name: string;
  categoryId: number;
  description: string;
  recommendations: string;
  price: number;
  stock: number;
  active: boolean;
  userId: number;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public categoryId!: number;
  public description!: string;
  public recommendations!: string;
  public price!: number;
  public stock!: number;
  public active!: boolean;
  public userId!: number;
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    recommendations: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },    stock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',  }
);

// Устанавливаем связь с Category
Product.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category'
});

export default Product;
