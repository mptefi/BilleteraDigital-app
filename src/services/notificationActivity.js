export const activityCategories = {
  payment: { label: "Pagos", icon: "arrow-up-right", color: "#9C4600", background: "#FFF1E3" },
  transfer: { label: "Transferencias", icon: "arrow-down-left", color: "#12604A", background: "#E7F5EF" },
  promo: { label: "Promos", icon: "gift", color: "#64438B", background: "#F2EAFA" },
  security: { label: "Seguridad", icon: "shield", color: "#992E39", background: "#FCECEE" },
};

const examples = [
  { category: "payment", title: "Pago en Cafetería Demo", message: "Pago con QR · S/ 12.50" },
  { category: "transfer", title: "Transferencia de María Demo", message: "Transferencia por QR · S/ 12.50" },
  { category: "security", title: "Alertas de seguridad", message: "Aquí te avisaremos sobre actividad que debas revisar." },
];

export function demoPromoActivity(receivedAt) {
  return {
    id: "demo-promo-bembos",
    category: "promo",
    title: "¡Un combo Bembos con 20 % de descuento!",
    message: "Imagina un descuento pagando con Al Toque. Oferta no canjeable.",
    date: new Intl.DateTimeFormat("es-PE", {
      dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima",
    }).format(receivedAt),
    example: true,
  };
}

export function movementActivity(movement) {
  const incoming = movement.type === "income";
  return {
    id: movement.id,
    category: incoming ? "transfer" : "payment",
    title: incoming ? "Transferencia recibida" : "Pago confirmado",
    message: `${movement.title} · ${movement.amount}`,
    date: movement.date,
    example: false,
  };
}

export function notificationActivity(transactions, promoReceivedAt) {
  const movements = transactions.filter((item) => item.simulation === true).map(movementActivity);
  const activeCategories = new Set(movements.map((item) => item.category));
  return [
    ...movements,
    ...(promoReceivedAt ? [demoPromoActivity(promoReceivedAt)] : []),
    ...examples.filter((item) => !activeCategories.has(item.category))
      .map((item) => ({ ...item, id: `example-${item.category}`, example: true })),
  ];
}
