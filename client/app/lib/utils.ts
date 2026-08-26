/**
 * Shared utility functions used across the client application.
 * Consolidates duplicated helpers to reduce bundle size and improve consistency.
 */

/** API root derived from NEXT_PUBLIC_API_URL (without /api suffix) */
const apiRoot =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "";

/**
 * Resolve an image URL — handles relative paths, absolute URLs, and fallbacks.
 * @param image - The image path or URL
 * @param fallback - Optional fallback URL if image is empty
 */
export function getImageUrl(
  image?: string,
  fallback = "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=1200&auto=format&fit=crop"
): string {
  if (!image) return fallback;
  if (image.startsWith("http")) return image;
  const path = image.startsWith("/") ? image : `/${image}`;
  return `${apiRoot}${path}`;
}

/**
 * Format a number as ARS currency.
 * @param value - The numeric value (string or number)
 * @param fallback - Fallback text if value is invalid
 */
export function formatCurrency(
  value?: string | number,
  fallback = "Consultar"
): string {
  const numericValue = Number(
    String(value ?? "").replace(/[^\d.-]/g, "")
  );

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallback;
  }

  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(numericValue);
}

/**
 * Parse a value to a number, stripping non-numeric characters.
 * @param value - The value to parse
 * @returns The parsed number, or 0 if invalid
 */
export function parseNumeric(value?: string | number): number {
  return Number(String(value ?? "").replace(/[^\d.-]/g, ""));
}

/**
 * Build a WhatsApp message URL for a product inquiry.
 */
export function buildWhatsAppUrl(params: {
  title: string;
  price: number;
  downPayment: number;
  months: number;
  whatsappNumber: string;
}): string {
  const { title, price, downPayment, months, whatsappNumber } = params;
  const remaining = Math.max(0, price - downPayment);
  const monthly = months > 0 ? Math.round(remaining / months) : 0;

  const message = [
    "Hola! Me interesa este producto:",
    "",
    `- Producto: ${title}`,
    `- Precio: ${formatCurrency(price, "$0")}`,
    `- Cuota inicial: ${formatCurrency(downPayment, "$0")}`,
    `- ${months} cuota${months > 1 ? "s" : ""} de: ${formatCurrency(monthly, "$0")}`,
    "",
    "Quedo atento a tu respuesta. Gracias!",
  ].join("\n");

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
