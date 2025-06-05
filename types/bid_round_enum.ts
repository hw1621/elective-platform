export const BidRound = {
    ROUND1: 'ROUND1',
    ROUND2: 'ROUND2',
    DROP: 'DROP',
} as const

export type BidRound = keyof typeof BidRound;
export type BidRoundValue = typeof BidRound[BidRound];