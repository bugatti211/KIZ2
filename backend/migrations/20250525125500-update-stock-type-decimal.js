'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Изменяем тип колонки stock в таблице products
    await queryInterface.changeColumn('products', 'stock', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });

    // Изменяем тип колонки quantity в таблице supply_items
    await queryInterface.changeColumn('supply_items', 'quantity', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });
  },
};
