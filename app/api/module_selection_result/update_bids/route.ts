import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const bids: Record<number, number> = body.bids;

        if (!bids) {
            return NextResponse.json({
                success: false,
                message: "Invalid bids data"
            })
        }
        
        const updates = Object.entries(bids).map(([id, bid_points]) => {
            return prisma.module_selection_result.update({
                where: {
                    id: Number(id),
                },
                data: {
                    bid_points: Number(bid_points)
                }
            });
        });

        await prisma.$transaction(updates);
        return NextResponse.json({
            success: true,
        })
    } catch (error) {
        console.error("Error updating bids:", error);
        return NextResponse.json(
            { 
                success: false, 
                message: `Error updating bids, errorMsg=${(error as Error).message}`
            }, { status: 500 }
        );
    }
}
