export const activityCategories = {
  payment: { label: "Pagos", icon: "arrow-up-right", color: "#9C4600", background: "#FFF1E3" },
  transfer: { label: "Transferencias", icon: "arrow-down-left", color: "#12604A", background: "#E7F5EF" },
  promo: { label: "Promos", icon: "gift", color: "#64438B", background: "#F2EAFA" },
  security: { label: "Seguridad", icon: "shield", color: "#992E39", background: "#FCECEE" },
};

const examples = [
  { category: "promo", title: "Cashback del viernes", message: "Conoce el cashback de los viernes en locales seleccionados." },
  { category: "payment", title: "Pago confirmado", message: "Un pago por QR aparecerá aquí cuando confirmes la simulación." },
  { category: "transfer", title: "Transferencia recibida", message: "Al confirmar un QR de ingreso, verás el abono en esta bandeja." },
  { category: "security", title: "Movimiento inusual", message: "Este aviso de prueba muestra cómo podrías revisar una operación que no reconoces." },
];

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

export function notificationActivity(transactions) {
  const movements = transactions.filter((item) => item.simulation === true).map(movementActivity);
  const activeCategories = new Set(movements.map((item) => item.category));
  return [
    ...movements,
    ...examples.filter((item) => !activeCategories.has(item.category))
      .map((item) => ({ ...item, id: `example-${item.category}`, example: true })),
  ];
}
