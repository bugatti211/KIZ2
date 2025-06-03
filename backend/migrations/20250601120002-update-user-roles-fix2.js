'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Step 1: Change to text temporarily
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      ALTER COLUMN role TYPE text;
    `);

    // Step 2: Update values
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET role = CASE 
        WHEN role = 'Пользователь' THEN 'user'
        WHEN role = 'Продавец' THEN 'seller'
        WHEN role = 'Бухгалтер' THEN 'accountant'
        WHEN role = 'Грузчик' THEN 'loader'
        WHEN role = 'admin' THEN 'admin'
        ELSE 'user'
      END;
    `);

    // Step 3: Drop old enum
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_users_role CASCADE;
    `);

    // Step 4: Create new enum
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_users_role AS ENUM('admin', 'user', 'seller', 'accountant', 'loader');
    `);

    // Step 5: Convert column to use new enum
    await queryInterface.sequelize.query(`
      ALTER TABLE users
      ALTER COLUMN role TYPE enum_users_role USING role::enum_users_role;
    `);
  },

  async down (queryInterface, Sequelize) {
    // Step 1: Change to text temporarily
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      ALTER COLUMN role TYPE text;
    `);

    // Step 2: Update values back to Russian
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET role = CASE 
        WHEN role = 'user' THEN 'Пользователь'
        WHEN role = 'seller' THEN 'Продавец'
        WHEN role = 'accountant' THEN 'Бухгалтер'
        WHEN role = 'loader' THEN 'Грузчик'
        WHEN role = 'admin' THEN 'admin'
        ELSE 'Пользователь'
      END;
    `);

    // Step 3: Drop new enum
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_users_role CASCADE;
    `);

    // Step 4: Create old enum
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_users_role AS ENUM('admin', 'Пользователь', 'Продавец', 'Бухгалтер', 'Грузчик');
    `);

    // Step 5: Convert column back to old enum
    await queryInterface.sequelize.query(`
      ALTER TABLE users
      ALTER COLUMN role TYPE enum_users_role USING role::enum_users_role;
    `);
  }
};
