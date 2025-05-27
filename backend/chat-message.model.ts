import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './sequelize';

interface ChatMessageAttributes {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface ChatMessageCreationAttributes extends Optional<ChatMessageAttributes, 'id'> {}

class ChatMessage extends Model<ChatMessageAttributes, ChatMessageCreationAttributes> implements ChatMessageAttributes {
  public id!: number;
  public role!: 'user' | 'assistant';
  public text!: string;
  public timestamp!: Date;
}

ChatMessage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    role: {
      type: DataTypes.ENUM('user', 'assistant'),
      allowNull: false,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'ChatMessage',
    tableName: 'ChatMessages',
  }
);

export default ChatMessage;
