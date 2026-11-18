const currencies = new Set(["PEN", "USD"]);

function parseDemoQr(raw) {
  if (typeof raw !== "string" || raw.length > 512) return null;
  let qr;
  try {
    qr = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!qr || qr.type !== "altoque.demo" || qr.v !== 1) return null;
  const { recipient, amountCents, currency, direction } = qr;
  if (typeof recipient !== "string" || !/^[\p{L}\p{N} .'-]{2,60}$/u.test(recipient) ||
      recipient !== recipient.trim() || !Number.isInteger(amountCents) ||
      amountCents < 1 || amountCents > 100000 || !currencies.has(currency)) return null;
  if (direction !== undefined && direction !== "debit" && direction !== "credit") return null;
  return { recipient, amountCents, currency, ...(direction !== undefined && { direction }) };
}

module.exports = { parseDemoQr };
