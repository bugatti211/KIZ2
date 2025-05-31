import { DataTypes, Model } from 'sequelize';
import sequelize from './sequelize';

interface ContactAttributes {
  id: number;
  telegram: string;
  whatsapp: string;
}

class Contact extends Model<ContactAttributes> implements ContactAttributes {
  public id!: number;
  public telegram!: string;
  public whatsapp!: string;
}

Contact.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    telegram: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    whatsapp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },  {
    sequelize,
    modelName: 'contacts',
  }
);

export default Contact;
