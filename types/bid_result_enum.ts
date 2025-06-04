export const BidResult = {
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    WAITLIST: 'WAITLIST',
    FAILED: 'FAILED',
} as const

export type BidResult = keyof typeof BidResult;
export type BidResultValue = typeof BidResult[BidResult];