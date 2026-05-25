/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const { discount, sale_price, quantity } = purchase;

   return sale_price * quantity * (1 - (discount/100))
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;

    if (index === 0) {
        return 0.15;
    } else if (index === 1 || index === 2) {
        return 0.1;
    } else if (index === (total - 1)) {
        return 0;
    } else {
        return 0.05;
    } 
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    const { calculateRevenue, calculateBonus } = options;
    
    if (!data) {
        throw new Error(`Исходный датасет ${data} не найден!`);
    }
    
    if (!Array.isArray(data.sellers)
        || data.sellers.length === 0
    ) {
        throw new Error(`Проверьте данные о продавцах!`);
    }

    if (!Array.isArray(data.products)
        || data.products.length === 0
    ) {
        throw new Error(`Проверьте данные о товарах!`);
    }

    if (!Array.isArray(data.purchase_records)
        || data.purchase_records.length === 0
    ) {
        throw new Error(`Проверьте данные о чеках!`);
    }
    // @TODO: Проверка наличия опций
    if (
        !options
        || typeof calculateRevenue !== "function"
        || typeof calculateBonus !== "function"
    ) {
        throw new Error("Переменные не являются функциями!");
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        seller_id: seller.id,
        name: seller.first_name + ' ' + seller.last_name,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        bonus: 0,
        products_sold: {}
    })); 

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(sellerStats.map(seller => [seller.seller_id, seller]));
    const productIndex = Object.fromEntries(data.products.map(product => [product.sku, product]));

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => { // Чек 
            const seller = sellerIndex[record.seller_id]; // Продавец
            // Увеличить количество продаж
            seller.sales_count += 1
            // Увеличить общую сумму выручки всех продаж
            seller.revenue += record.total_amount

            // Расчёт прибыли для каждого товара
            record.items.forEach(item => {
                const product = productIndex[item.sku]; // Товар
                // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
                const cost = product.purchase_price * item.quantity
                // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
                const revenue = calculateRevenue(item, product)
                // Посчитать прибыль: выручка минус себестоимость
                const profit = revenue - cost
            // Увеличить общую накопленную прибыль (profit) у продавца  
                seller.profit += profit

                // Учёт количества проданных товаров
                if (!seller.products_sold[item.sku]) {
                    seller.products_sold[item.sku] = 0;
                }
                // По артикулу товара увеличить его проданное количество у продавца
                seller.products_sold[item.sku] += item.quantity;
            });
    }); 

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller) // Считаем бонус
        seller.top_products = seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({
                sku,
                quantity,
            }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);// Формируем топ-10 товаров
    }); 

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.seller_id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: +seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    })); 
}
