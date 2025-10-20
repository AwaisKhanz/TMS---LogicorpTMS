// Re-export all types from specific type files
export * from "./api.types";
export * from "./auth.types";
export * from "./user.types";

// Specific API Response Types
import type { ApiResponse } from "./api.types";
import type { AuthResponse } from "./auth.types";
import type { User } from "./user.types";

export type AuthApiResponse = ApiResponse<AuthResponse>;
export type UserApiResponse = ApiResponse<User>;
export type UsersApiResponse = ApiResponse<User[]>;
