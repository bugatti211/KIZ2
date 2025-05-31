import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './sequelize';
const bcrypt = require('bcryptjs');

interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  address?: string;
  telegram?: string;
  whatsapp?: string;
  role: 'admin' | 'Пользователь' | 'Продавец' | 'Бухгалтер' | 'Грузчик';
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public address?: string;
  public role!: 'admin' | 'Пользователь' | 'Продавец' | 'Бухгалтер' | 'Грузчик';
}

User.init(
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'Пользователь', 'Продавец', 'Бухгалтер', 'Грузчик'),
      allowNull: false,
      defaultValue: 'Пользователь'
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: false,
  }
);

User.beforeCreate(async (user: any) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

export default User;
