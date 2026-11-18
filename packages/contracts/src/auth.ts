import { z } from 'zod';

export const UserRoleSchema = z.enum([
  'SUPER_ADMIN',
  'BRANCH_MANAGER',
  'CHEF',
  'KITCHEN_ASSISTANT',
  'PACKER',
  'CASHIER',
  'WAITER',
  'CUSTOMER'
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  phone: z.string().optional(),
  roles: z.array(UserRoleSchema),
  branchId: z.string().uuid(),
  organizationId: z.string().uuid(),
  isActive: z.boolean()
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const TableSessionRequestSchema = z.object({
  tableToken: z.string().min(1)
});
export type TableSessionRequest = z.infer<typeof TableSessionRequestSchema>;

export const TableSessionResponseSchema = z.object({
  tableId: z.string().uuid(),
  tableNumber: z.string(),
  sessionToken: z.string(),
  branchId: z.string().uuid(),
  activeOrderId: z.string().uuid().nullable()
});
export type TableSessionResponse = z.infer<typeof TableSessionResponseSchema>;
