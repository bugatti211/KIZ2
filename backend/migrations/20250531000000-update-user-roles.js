'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Сначала удаляем старый ENUM тип
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
    
    // Создаем новый ENUM тип с нужными значениями
    await queryInterface.sequelize.query('CREATE TYPE "enum_users_role" AS ENUM (\'admin\', \'Пользователь\', \'Продавец\', \'Бухгалтер\', \'Грузчик\');');
    
    // Обновляем колонку role, чтобы использовать новый ENUM тип
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.ENUM('admin', 'Пользователь', 'Продавец', 'Бухгалтер', 'Грузчик'),
      allowNull: false,
      defaultValue: 'Пользователь'
    });
  },

  async down(queryInterface, Sequelize) {
    // В случае отката вернем предыдущее состояние
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
    await queryInterface.sequelize.query('CREATE TYPE "enum_users_role" AS ENUM (\'admin\', \'user\');');
    
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user'
    });
  }
};
