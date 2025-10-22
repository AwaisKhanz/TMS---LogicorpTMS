// Re-export all types from specific type files
export * from "./api.types";
export * from "./auth.types";
export * from "./user.types";
export * from "./permission.types";

// Specific API Response Types
import type { ApiResponse } from "./api.types";
import type { LoginResponse, RegisterResponse } from "./auth.types";
import type { User } from "./user.types";

export type LoginApiResponse = ApiResponse<LoginResponse>;
export type RegisterApiResponse = ApiResponse<RegisterResponse>;
export type UserApiResponse = ApiResponse<User>;
export type UsersApiResponse = ApiResponse<User[]>;
