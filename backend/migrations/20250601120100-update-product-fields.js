'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('products', 'description', {
      type: Sequelize.TEXT,
      allowNull: false,
    });

    await queryInterface.changeColumn('products', 'recommendations', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('products', 'description', {
      type: Sequelize.STRING(200),
      allowNull: false,
    });

    await queryInterface.changeColumn('products', 'recommendations', {
      type: Sequelize.STRING(200),
      allowNull: false,
    });
  }
};
