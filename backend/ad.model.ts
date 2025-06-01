import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './sequelize';
import User from './user.model';

interface AdAttributes {
  id: number;
  text: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  userId: number;
  deleted: boolean;
}

interface AdCreationAttributes extends Optional<AdAttributes, 'id' | 'status' | 'deleted'> {}

class Ad extends Model<AdAttributes, AdCreationAttributes> implements AdAttributes {
  public id!: number;
  public text!: string;
  public phone!: string;
  public status!: 'pending' | 'approved' | 'rejected';
  public userId!: number;
  public deleted!: boolean;
}

Ad.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: User, key: 'id' },
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    }
  },  {
    sequelize,
    modelName: 'Ad',
    tableName: 'ads',
    timestamps: true
  }
);

Ad.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Ad, { foreignKey: 'userId' });

export default Ad;
