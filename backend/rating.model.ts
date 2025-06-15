import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './sequelize';
import User from './user.model';
import Product from './product.model';

interface RatingAttributes {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  comment?: string;
}

interface RatingCreationAttributes extends Optional<RatingAttributes, 'id' | 'comment'> {}

class Rating extends Model<RatingAttributes, RatingCreationAttributes> implements RatingAttributes {
  public id!: number;
  public userId!: number;
  public productId!: number;
  public rating!: number;
  public comment?: string;
}

Rating.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'products', key: 'id' },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Rating',
    tableName: 'ratings',
    timestamps: true,
  }
);

Rating.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Rating.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
User.hasMany(Rating, { foreignKey: 'userId', as: 'ratings' });
Product.hasMany(Rating, { foreignKey: 'productId', as: 'ratings' });

export default Rating;
