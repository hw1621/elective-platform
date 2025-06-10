import { BidResult } from "@/types/bid_result_enum";
import { BidRound } from "@/types/bid_round_enum";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    const academicYear = await prisma.academic_year.findFirst({
        where: {
          deleted_at: null,
          is_current: true,
        },
        select: { id: true },
      });
    
    if (!academicYear) return;
    const academicYearId = academicYear.id;

    //Find module ids that participate in round2 selections
    const round2BiddedModules = await prisma.module_selection_result.findMany({
        where: {
          academic_year_id: academicYearId,
          bid_round: BidRound.ROUND2,
          bid_points: { gt: 0 },
          deleted_at: null,
        },
        select: {
          module_id: true,
        },
        distinct: ['module_id'],
      });
    
    const moduleIds = round2BiddedModules.map(m => m.module_id);

    const modules = await prisma.module.findMany({
    where: {
        academic_year_id: academicYearId,
        deleted_at: null,
        id: { in: moduleIds },
    },
    select: {
        id: true,
        capacity: true,
        module_selection_results: {
        where: {
            bid_round: BidRound.ROUND2,
            academic_year_id: academicYearId,
            deleted_at: null,
        },
        select: {
            id: true,
            student_id: true,
            bid_points: true,
            is_compulsory: true,
            bid_result: true,
        },
        },
    },
    });

    for (const mod of modules) {    
        let capacity = mod.capacity;
    
        const round1Success = await prisma.module_selection_result.count({
          where: {
            module_id: mod.id,
            academic_year_id: academicYearId,
            bid_result: BidResult.SUCCESS,
            bid_round: BidRound.ROUND1,
            deleted_at: null,
          },
        });
    
        capacity -= round1Success;
        if (capacity < 0) {
            console.log(`Notice! The module with id ${mod.id} is fully occupied, it is not supposed to apear in round2 bidding`)
            continue
        }
    
        const bidding = mod.module_selection_results.filter(
          (r) => !r.is_compulsory && r.bid_points > 0
        );
    
        const updateOps = [];
        const sortedBids = bidding
            .map((res) => ({ ...res, tie_breaker: Math.random() }))
            .sort((a, b) => b.bid_points - a.bid_points || b.tie_breaker - a.tie_breaker);
        
        const successful = sortedBids.slice(0, capacity);
        const waitlisted = sortedBids.slice(capacity);
    
        const isUnderSubscribed = successful.length < capacity;
        const clearingPrice = isUnderSubscribed ? 1 : successful.at(-1)?.bid_points ?? 1;
    
        for (const res of successful) {
          updateOps.push(
            prisma.module_selection_result.update({
                where: { id: res.id },
                data: {
                    bid_result: BidResult.SUCCESS,
                    bid_points: clearingPrice,
                },
            })
          );
        }
    
        for (const res of waitlisted) {
          updateOps.push(
            prisma.module_selection_result.update({
                where: { id: res.id },
                data: {
                    bid_result: BidResult.WAITLIST,
                    bid_round: BidRound.ROUND2,
                },
            })
          );
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
    
        await prisma.$transaction(updateOps);
      }
    



}