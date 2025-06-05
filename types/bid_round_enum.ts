export const BidRound = {
    ROUND1: 'ROUND1',
    ROUND2: 'ROUND2',
    NOT_STARTED: 'NOT_STARTED',
} as const

export type BidRound = keyof typeof BidRound;
export type BidRoundValue = typeof BidRound[BidRound];