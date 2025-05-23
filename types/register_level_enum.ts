export const RegisterLevel = {
    CREDIT: "CREDIT",
    SITIN: "SITIN"
} as const

export type RegisterLevel = keyof typeof RegisterLevel;
export type RegisterLevelValue = typeof RegisterLevel[RegisterLevel];