const { z } = require("zod");

// ── URL Segura ──────────────────────────────────────────
function isSafeUrl(value) {
  if (!value) return true;
  if (value.length > 1000) return false;
  if (/[\u0000-\u001F\u007F]/.test(value)) return false;
  const trimmed = value.trim();
  if (trimmed.startsWith("//")) return false;
  if (trimmed.startsWith("/")) return true;
  try {
    const u = new URL(trimmed);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

const safeUrlField = (label = "URL") =>
  z
    .string()
    .max(1000, `${label} inválida`)
    .refine(isSafeUrl, `${label} inválida`)
    .optional()
    .nullable();

// ── Products ─────────────────────────────────────────────
const productCreateSchema = z.object({
  title: z.string().min(1, "Título requerido").max(200),
  description: z.string().max(2000).optional().default(""),
  price: z.number().min(0, "Precio inválido"),
  stock: z.number().int().min(0).default(0),
  image: safeUrlField("Imagen"),
  category: z.string().max(100).optional().default("general"),
  financing: z.string().max(500).optional().default(""),
  down_payment: z.number().min(0).optional().default(0),
  featured: z.boolean().optional().default(false),
  status: z.enum(["active", "inactive", "out_of_stock"]).optional().default("active"),
});

const productUpdateSchema = productCreateSchema.partial();

// ── Credits ──────────────────────────────────────────────
const creditCreateSchema = z.object({
  name: z.string().min(2, "Nombre requerido").max(100),
  email: z.string().email("Correo inválido"),
  phone: z
    .string()
    .min(7, "Teléfono inválido")
    .max(20)
    .regex(/^[+0-9\s()-]+$/, "Teléfono inválido"),
  amount: z.number().min(1000, "Monto mínimo $1.000"),
  term_months: z.number().int().min(1, "Mínimo 1 mes").max(60),
  interest_rate: z.number().min(0).max(100).default(10),
  monthly_payment: z.number().min(0),
  total_payment: z.number().min(0),
});

const creditStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "paid"]),
  notes: z.string().max(500).optional().nullable(),
});

// ── Orders ──────────────────────────────────────────────
const orderItemSchema = z.object({
  product_id: z.number().int().min(1, "Producto inválido"),
  quantity: z.number().int().min(1).max(99),
  options: z.string().max(500).optional().nullable(),
});

const orderCreateSchema = z.object({
  customer_name: z.string().min(2, "Nombre requerido").max(100),
  customer_phone: z
    .string()
    .min(7, "Teléfono inválido")
    .max(20)
    .regex(/^[+0-9\s()-]+$/, "Teléfono inválido"),
  customer_email: z.string().email("Correo inválido").max(120).optional().nullable(),
  delivery_type: z.enum(["DOMICILIO", "RETIRO"]).default("RETIRO"),
  address: z.string().max(200).optional().nullable(),
  reference: z.string().max(200).optional().nullable(),
  notes: z.string().max(400).optional().nullable(),
  payment_type: z.enum(["EFECTIVO", "TRANSFERENCIA", "NEQUI"]).default("EFECTIVO"),
  items: z.array(orderItemSchema).min(1, "El carrito está vacío").max(50),
});

const orderStatusSchema = z.object({
  status: z.enum([
    "RECIBIDO", "EN_PREPARACION", "LISTO", "EN_CAMINO", "ENTREGADO", "CANCELADO",
  ]),
});

// ── Reservations ────────────────────────────────────────
const reservationCreateSchema = z.object({
  date: z.string().min(1, "Selecciona una fecha"),
  time: z.string().min(1, "Selecciona una hora"),
  people: z.number().int().min(1, "Al menos 1 persona").max(50),
  name: z.string().min(2, "Nombre requerido").max(100),
  phone: z
    .string()
    .min(7, "Teléfono inválido")
    .max(20)
    .regex(/^[+0-9\s()-]+$/, "Teléfono inválido"),
  comment: z.string().max(400).optional().nullable(),
});

const reservationStatusSchema = z.object({
  status: z.enum(["PENDIENTE", "CONFIRMADA", "COMPLETADA", "CANCELADA"]),
});

// ── Sections / Homepage Blocks ──────────────────────────
const sectionCreateSchema = z.object({
  type: z.string().min(1, "Tipo requerido"),
  title: z.string().max(160).optional().nullable(),
  subtitle: z.string().max(300).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  content: z.any().optional().nullable(),
  visible: z.boolean().default(true),
  order: z.number().int().default(0),
});

const sectionUpdateSchema = sectionCreateSchema.partial();

// ── Subscriptions ────────────────────────────────────────
const subscribeSchema = z.object({
  email: z.string().email("Correo inválido"),
});

// ── Audit ────────────────────────────────────────────────
const auditLogQuerySchema = z.object({
  entity: z.string().optional(),
  userId: z.number().int().optional(),
  limit: z.number().int().min(1).max(500).default(50),
  offset: z.number().int().min(0).default(0),
});

module.exports = {
  productCreateSchema, productUpdateSchema,
  creditCreateSchema, creditStatusSchema,
  orderCreateSchema, orderStatusSchema, orderItemSchema,
  reservationCreateSchema, reservationStatusSchema,
  sectionCreateSchema, sectionUpdateSchema,
  subscribeSchema, auditLogQuerySchema,
  isSafeUrl, safeUrlField,
};
