export const SelectionStatus = {
    COMPLETE: "COMPLETE",
    IN_PROGRESS: "IN_PROGRESS",
    NOT_STARTED: "NOT_STARTED"
} as const

export type SelectionStatus = keyof typeof SelectionStatus;
export type SelectionStatusValue = typeof SelectionStatus[SelectionStatus];