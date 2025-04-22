import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
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
    return NextResponse.json(years);
}