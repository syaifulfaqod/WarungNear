import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(['CUSTOMER', 'OWNER', 'ADMIN']).optional()
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

export const productCreateSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  category_id: z.number().int().positive().optional().nullable(),
  price: z.number().min(0, "Price must be a positive number"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  image: z.string().optional().nullable().or(z.literal(''))
});

export const productUpdateSchema = productCreateSchema.partial();

export const transactionItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  price: z.number().min(0)
});

export const transactionCreateSchema = z.object({
  items: z.array(transactionItemSchema).min(1, "Transaction must have at least one item"),
  total: z.number().min(0)
});

export const storeCreateSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  address: z.string().min(1, "Address is required"),
  latitude: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? undefined : Number(val),
    z.number({ required_error: "Latitude is required", invalid_type_error: "Latitude wajib berupa angka" })
  ),
  longitude: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? undefined : Number(val),
    z.number({ required_error: "Longitude is required", invalid_type_error: "Longitude wajib berupa angka" })
  ),
  open_time: z.string()
    .min(1, "Jam buka wajib diisi")
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam buka harus HH:mm (contoh: 08:00)"),
  close_time: z.string()
    .min(1, "Jam tutup wajib diisi")
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam tutup harus HH:mm (contoh: 22:00)"),
  phoneNumber: z.string()
    .regex(/^(?:\+62|62|0)8[1-9][0-9]{6,11}$/, "Format nomor WhatsApp tidak valid. Gunakan format Indonesia (contoh: 08123456789 atau +628123456789)")
    .optional()
    .nullable()
    .or(z.literal('')),
  isActive: z.boolean().optional()
});

export const orderItemSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().positive()
});

export const orderCreateSchema = z.object({
  store_id: z.number().int().positive(),
  items: z.array(orderItemSchema).min(1, "Order must have at least one item")
});


