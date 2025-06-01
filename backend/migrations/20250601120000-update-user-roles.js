'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {  async up (queryInterface, Sequelize) {
    // Step 1: Change the column type to text temporarily
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" 
      ALTER COLUMN role TYPE text;
    `);

    // Step 2: Update the values while it's text
    await queryInterface.sequelize.query(`
      UPDATE "Users" 
      SET role = CASE 
        WHEN role = 'Пользователь' THEN 'user'
        WHEN role = 'Продавец' THEN 'seller'
        WHEN role = 'Бухгалтер' THEN 'accountant'
        WHEN role = 'Грузчик' THEN 'loader'
        WHEN role = 'admin' THEN 'admin'
        ELSE 'user'
      END;
    `);

    // Step 3: Drop the old enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_Users_role";
    `);

    // Step 4: Create new enum type
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Users_role" AS ENUM('admin', 'user', 'seller', 'accountant', 'loader');
    `);

    // Step 5: Convert the column to use the new enum
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users"
      ALTER COLUMN role TYPE "enum_Users_role" USING role::"enum_Users_role";
    `);
  },
  async down (queryInterface, Sequelize) {
    // Step 1: Change to text temporarily
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" 
      ALTER COLUMN role TYPE text;
    `);

    // Step 2: Update values back to Russian
    await queryInterface.sequelize.query(`
      UPDATE "Users" 
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
      DROP TYPE IF EXISTS "enum_Users_role";
    `);

    // Step 4: Create old enum
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Users_role" AS ENUM('admin', 'Пользователь', 'Продавец', 'Бухгалтер', 'Грузчик');
    `);

    // Step 5: Convert column back to old enum
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users"
      ALTER COLUMN role TYPE "enum_Users_role" USING role::"enum_Users_role";
    `);

    // Modify the enum type back
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" 
      ALTER COLUMN role TYPE VARCHAR(255),
      ALTER COLUMN role DROP DEFAULT;
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_Users_role";
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Users_role" AS ENUM('admin', 'Пользователь', 'Продавец', 'Бухгалтер', 'Грузчик');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Users"
      ALTER COLUMN role TYPE "enum_Users_role" USING role::text::"enum_Users_role";
    `);
  }
};
