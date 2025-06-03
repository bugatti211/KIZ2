'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('supplies', 'code', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '000000', // Временное значение по умолчанию для существующих записей
    });

    await queryInterface.addColumn('supplies', 'supplier', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Не указан', // Временное значение по умолчанию для существующих записей
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('supplies', 'code');
    await queryInterface.removeColumn('supplies', 'supplier');
  }
};
