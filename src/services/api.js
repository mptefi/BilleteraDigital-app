import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://open.er-api.com/v6",
  timeout: 8000,
});

const trackedCurrencies = [
  { code: "USD", label: "Dolar", icon: "trending-up", accent: "#4A90E2" },
  { code: "EUR", label: "Euro", icon: "globe", accent: "#00A86B" },
  { code: "BRL", label: "Real brasileno", icon: "credit-card", accent: "#FFB800" },
];

function normalizeRate(rates, currency) {
  const rate = rates?.[currency.code];
  const perPen = typeof rate === "number" ? rate : 0;
  const penPerUnit = perPen > 0 ? 1 / perPen : 0;

  return {
    id: currency.code,
    code: currency.code,
    title: `${currency.label} referencial`,
    description: `1 ${currency.code} equivale aprox. a S/ ${penPerUnit.toFixed(2)}`,
    value: penPerUnit.toFixed(2),
    icon: currency.icon,
    accent: currency.accent,
  };
}

export async function fetchExchangeRates() {
  const response = await apiClient.get("/latest/PEN");

  if (response.data?.result !== "success") {
    throw new Error("No se pudo obtener el tipo de cambio.");
  }

  return trackedCurrencies.map((currency) =>
    normalizeRate(response.data.rates, currency)
  );
}

export default apiClient;
