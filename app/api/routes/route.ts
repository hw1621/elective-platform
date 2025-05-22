import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const program_id = searchParams.get("program_id");

    if (!program_id) {
        return NextResponse.json({
            success: false,
            data: null,
            message: "missing program_id in GET routes"
        }, { status: 400 });
    }

    try {
        const routes = await prisma.route.findMany({
            where: {
                deleted_at: null,
                program_id: Number(program_id),
            },
            select: {
                id: true,
                name: true,
            }
        });

        return NextResponse.json({
            success: true,
            data: routes
        });
    } catch (error) {
        console.error("[GET /api/routes] Error fetching routes", error);
        return NextResponse.json({
            success: false,
            data: null,
            message: "Fetch program routes fail"
        }, { status: 500 });
    }
}