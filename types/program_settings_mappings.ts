export const SettingKeys = {
    ENABLE_SIT_IN: "enable_sit_in",
    FIRST_ROUND_START_DATE: "first_round_start_date",
    FIRST_ROUND_END_DATE: "first_round_end_date",
    SECOND_ROUND_START_DATE: "second_round_start_date",
    SECOND_ROUND_END_DATE: "second_round_end_date",
    TOTAL_ECTS: 'total_ects',
} as const

export type SettingKeys = keyof typeof SettingKeys;
export type SettingValues = typeof SettingKeys[SettingKeys];