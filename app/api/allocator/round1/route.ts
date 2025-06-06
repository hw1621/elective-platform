import { BidResult } from "@/types/bid_result_enum";
import { BidRound, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function allocateFirstRoundBids( ) {
    const academicYear = await prisma.academic_year.findFirst({
        where: {
            deleted_at: null,
            is_current: true,
        },
        select: {
            id: true,
        }
    })

    if (!academicYear) {
        return;
    }

    const academicYearId = academicYear.id;

    const round1ModuleIds = await prisma.module_selection_result.findMany({
        where: {
          academic_year_id: academicYearId,
          bid_round: BidRound.ROUND1,
          bid_result: BidResult.PENDING,
          deleted_at: null,
        },
        select: {
          module_id: true,
        },
        distinct: ['module_id'],
    });
    const moduleIds = round1ModuleIds.map((m) => m.module_id);

    const modules = await prisma.module.findMany({
        where: {
            academic_year_id: academicYearId,
            deleted_at: null,
            id: { in: moduleIds }
        },
        select: {
            id: true,
            capacity: true,
            module_selection_results: {
                where: {
                    bid_round: BidRound.ROUND1,
                    academic_year_id: academicYearId,
                    deleted_at: null,
                },
                select: {
                    id: true,
                    student_id: true,
                    bid_points: true,
                    is_compulsory: true,
                    bid_result: true,
                }
            }
        }
    });

    for (const mod of modules) {
        let capacity = mod.capacity;

        const compulsory = mod.module_selection_results.filter(res => res.is_compulsory);
        const bidding = mod.module_selection_results.filter(res => !res.is_compulsory && res.bid_points > 0);

        const updateOps = [];

        // 1. Assign compulsory students (no bid point adjustment needed)
        for (const res of compulsory) {
            updateOps.push(
                prisma.module_selection_result.update({
                where: { id: res.id },
                data: {
                    bid_result: BidResult.SUCCESS,
                },
                })
            );
        }

        capacity -= compulsory.length;
        // 2. Sort elective bids
        const sortedBids = bidding
            .map(res => ({ ...res, tie_breaker: Math.random() }))
            .sort((a, b) => b.bid_points - a.bid_points || b.tie_breaker - a.tie_breaker);


        const successful = sortedBids.slice(0, capacity);
        const waitlisted = sortedBids.slice(capacity);

        // 3. Determine clearing price
        const isUnderSubscribed = successful.length < capacity;
        const clearingPrice = isUnderSubscribed ? 1 : successful.at(-1)?.bid_points ?? 1;

        //4. Handle successful bids
        for (const res of successful) {
            updateOps.push(
                prisma.module_selection_result.update({
                    where: { id: res.id },
                    data: {
                      bid_result: BidResult.SUCCESS,
                      bid_points: clearingPrice,
                    },
                })
            )
        }
        //5. Handle waitlisted bids
        for (const res of waitlisted) {
            updateOps.push(
              prisma.module_selection_result.update({
                where: { id: res.id },
                data: {
                  bid_result: BidResult.WAITLIST,
                },
              })
            );

            //Create wait-list
            updateOps.push(
                prisma.wait_list.create({
                  data: {
                    student_id: res.student_id,
                    module_id: mod.id,
                    academic_year_id: academicYearId,
                    bid_points: res.bid_points,
                  },
                })
            );
        }
        await prisma.$transaction(updateOps)
    }

}