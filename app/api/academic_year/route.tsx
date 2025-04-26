import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const years = await prisma.academic_year.findMany({
            where: {
                deleted_at: null
            },
            orderBy: {
                id: 'asc',
            },
            select: {
                id: true,
                name: true
            }
        });
        return NextResponse.json({
            success:true,
            data: years,
            message: "Academic years fetched successfully"
        });
    } catch (error) {
        console.error("Error fetching academic years:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to fetch academic years",
            data: null
        }, { status: 500 });
    }
}