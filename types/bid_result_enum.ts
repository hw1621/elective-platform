export const BidResult = {
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    WAITLIST: 'WAITLIST',
    DROP: 'DROP',
} as const

export type BidResult = keyof typeof BidResult;
export type BidResultValue = typeof BidResult[BidResult];