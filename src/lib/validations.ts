import { z } from 'zod';

// Indian Phone Number - must be 10 digits starting with 6-9
export const indianPhoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Phone number must be 10 digits starting with 6, 7, 8, or 9');

// GST Number - 15 character alphanumeric
// Format: 22AAAAA0000A1Z5 (2 digit state code + 10 char PAN + 1 entity + 1 check digit + Z)
export const gstNumberSchema = z
  .string()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    'Invalid GST format. Example: 22AAAAA0000A1Z5'
  );

// PAN Number - 10 character alphanumeric
// Format: ABCDE1234F (5 letters + 4 digits + 1 letter)
export const panNumberSchema = z
  .string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format. Example: ABCDE1234F');

// Indian Pincode - 6 digits
export const pincodeSchema = z
  .string()
  .regex(/^[1-9][0-9]{5}$/, 'Pincode must be 6 digits and cannot start with 0');

// IFSC Code - 11 characters (4 letters + 0 + 6 alphanumeric)
export const ifscCodeSchema = z
  .string()
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format. Example: SBIN0001234');

// Email validation
export const emailSchema = z.string().email('Please enter a valid email address');

// Password validation - minimum 8 characters with at least 1 number and 1 letter
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Full name validation
export const fullNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces');

// Business name validation
export const businessNameSchema = z
  .string()
  .min(2, 'Business name must be at least 2 characters')
  .max(200, 'Business name must be less than 200 characters');

// OTP validation
export const otpSchema = z
  .string()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d+$/, 'OTP must contain only numbers');

// Bank account number
export const accountNumberSchema = z
  .string()
  .min(9, 'Account number must be at least 9 digits')
  .max(18, 'Account number must be less than 18 digits')
  .regex(/^\d+$/, 'Account number must contain only numbers');

// Buyer Registration Step 1 - Email Auth
export const buyerStep1EmailSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Buyer Registration Step 1 - Phone Auth
export const buyerStep1PhoneSchema = z.object({
  fullName: fullNameSchema,
  phone: indianPhoneSchema,
  otp: otpSchema,
});

// Buyer Registration Step 2 (optional fields)
export const buyerStep2Schema = z.object({
  businessName: z.string().max(200, 'Business name must be less than 200 characters').optional().or(z.literal('')),
  businessType: z.string().optional().or(z.literal('')),
  gstNumber: z.union([
    z.literal(''),
    gstNumberSchema,
  ]),
  address: z.string().max(500, 'Address must be less than 500 characters').optional().or(z.literal('')),
  city: z.string().max(100, 'City must be less than 100 characters').optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  pincode: z.union([
    z.literal(''),
    pincodeSchema,
  ]),
});

// Seller Registration Step 1 - Email Auth (same as buyer)
export const sellerStep1EmailSchema = buyerStep1EmailSchema;
export const sellerStep1PhoneSchema = buyerStep1PhoneSchema;

// Seller Registration Step 2 (required business fields)
export const sellerStep2Schema = z.object({
  businessName: businessNameSchema,
  businessType: z.string().min(1, 'Please select a business type'),
  gstNumber: gstNumberSchema,
  panNumber: z.union([
    z.literal(''),
    panNumberSchema,
  ]),
  businessDescription: z.string().max(1000, 'Description must be less than 1000 characters').optional().or(z.literal('')),
  yearsInBusiness: z.string().optional().or(z.literal('')),
  employeeCount: z.string().optional().or(z.literal('')),
  annualTurnover: z.string().optional().or(z.literal('')),
  address: z.string().max(500, 'Address must be less than 500 characters').optional().or(z.literal('')),
  city: z.string().max(100, 'City must be less than 100 characters').optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  pincode: z.union([
    z.literal(''),
    pincodeSchema,
  ]),
});

// Seller Registration Step 4 - Bank Details (optional)
export const sellerStep4Schema = z.object({
  bankAccountName: z.string().max(200, 'Account name must be less than 200 characters').optional().or(z.literal('')),
  bankName: z.string().max(200, 'Bank name must be less than 200 characters').optional().or(z.literal('')),
  accountNumber: z.union([
    z.literal(''),
    accountNumberSchema,
  ]),
  ifscCode: z.union([
    z.literal(''),
    ifscCodeSchema,
  ]),
});

// Helper function to validate and get errors
export function validateField<T>(schema: z.ZodType<T>, value: unknown): string | null {
  const result = schema.safeParse(value);
  if (result.success) return null;
  return result.error.errors[0]?.message || 'Invalid value';
}

// Helper to validate partial object
export function validatePartial<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  data: Record<string, unknown>
): Record<string, string> {
  const result = schema.safeParse(data);
  if (result.success) return {};
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });
  return errors;
}
