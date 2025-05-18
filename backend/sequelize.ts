import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('postgres://postgres:925248914@localhost:5432/mobile_app');

export default sequelize;
