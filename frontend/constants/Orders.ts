export enum OrderStatus {
  COLLECTING = 'collecting',
  READY = 'ready',
  IN_TRANSIT = 'in_transit',
  CONFIRMED = 'confirmed'
}

export const orderStatusTranslations: Record<OrderStatus, string> = {
  [OrderStatus.COLLECTING]: 'Комплектуется',
  [OrderStatus.READY]: 'Готов к выдаче',
  [OrderStatus.IN_TRANSIT]: 'В доставке',
  [OrderStatus.CONFIRMED]: 'Выполнен'
};

export const getOrderStatusTranslation = (status: OrderStatus): string => {
  return orderStatusTranslations[status as OrderStatus] || 'Неизвестный статус';
};
