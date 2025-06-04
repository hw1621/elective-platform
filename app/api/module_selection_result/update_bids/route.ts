import { authOptions } from "@/auth-options";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const student = await prisma.student.findFirst({
            where: {
              email: session.user.email,
              deleted_at: null,
            },
            select: {
              id: true,
              program_id: true,
            }
        });

        if (!student) {
            return NextResponse.json({ success: false, message: "Student not found" }, { status: 404 });
        }


        const body = await req.json();
        const bids: Record<number, number> = body.bids;

        if (!bids) {
            return NextResponse.json({
                success: false,
                message: "Invalid bids data"
            })
        }
        
        const updates = Object.entries(bids).map(([id, bid_points]) => {
            return prisma.module_selection_result.updateMany({
                where: {
                    module_id: Number(id),
                    student_id: student.id,
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
