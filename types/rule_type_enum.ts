export const RuleType = {
    ECTS: "ECTS",
    TERM: "TERM"
} as const

export type RuleType = keyof typeof RuleType;
export type RuleTypeValue = typeof RuleType[RuleType];