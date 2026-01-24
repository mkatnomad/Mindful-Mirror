// api/create-invoice.ts
export default async function handler(req, res) {
  const { userId } = JSON.parse(req.body);
  const token = process.env.TELEGRAM_BOT_TOKEN;

  // Формируем запрос к Telegram API для создания счета
  const response = await fetch(`https://api.telegram.org/bot${token}/createInvoiceLink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: "Premium подписка",
      description: "Доступ ко всем функциям ИИ на 30 дней",
      payload: `sub_pc_${userId}`, // Информация, которую мы получим после оплаты
      provider_token: "", // Для Звезд оставляем пустым
      currency: "XTR", // Код валюты для Telegram Stars
      prices: [{ label: "Premium", amount: 100 }] // Цена в Звездах (например, 100)
    })
  });

  const data = await response.json();
  res.status(200).json(data); // Возвращаем ссылку на оплату в приложение
}