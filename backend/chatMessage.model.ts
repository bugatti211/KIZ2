import { DataTypes, Model } from 'sequelize';
import sequelize from './sequelize';
import User from './user.model';

export default class ChatMessage extends Model {
  public id!: number;
  public senderId!: number;
  public receiverId!: number;
  public text!: string;
  public createdAt!: Date;
}

ChatMessage.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    senderId: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
    receiverId: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
    text: { type: DataTypes.TEXT, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    modelName: 'ChatMessage',
    tableName: 'chat_messages',
    updatedAt: false
  }
);

User.hasMany(ChatMessage, { foreignKey: 'senderId', as: 'sentMessages' });
User.hasMany(ChatMessage, { foreignKey: 'receiverId', as: 'receivedMessages' });
ChatMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
ChatMessage.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
