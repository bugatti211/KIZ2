export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  SELLER = 'seller',
  ACCOUNTANT = 'accountant',
  LOADER = 'loader',
}

export const roleTranslations: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Администратор',
  [UserRole.USER]: 'Пользователь',
  [UserRole.SELLER]: 'Продавец',
  [UserRole.ACCOUNTANT]: 'Бухгалтер',
  [UserRole.LOADER]: 'Грузчик',
};
