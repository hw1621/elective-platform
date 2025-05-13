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
            message: "Request program settings: missing program_id"
        }, { status: 400 });
    }

    try {
        const settings = await prisma.setting.findMany({
            where: {
                deleted_at: null,
                program_id: Number(program_id),
            }
        });

        return NextResponse.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error("[GET /api/settings] Error fetching settings", error);
        return NextResponse.json({
            success: false,
            data: null,
            message: "Fetch program settings fail"
        }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { setting_id, value }: { setting_id: number; value: string } = body;

        if (typeof setting_id !== "number" || typeof value !== "string") {
            return NextResponse.json({
                success: false,
                data: null,
                message: "Update program settings: missing setting_id or value"
            }, { status: 400 });
        }

        const updated = await prisma.setting.update({
            where: { id: Number(setting_id)},
            data: { value: value }
        });

        return NextResponse.json({
            success: true,
            data: updated}
        );
    } catch (error) {
        console.error("[PATCH /api/settings] Failed to update program setting:", error);
        return NextResponse.json(
          { success: false, message: "Failed to update setting" },
          { status: 500 }
        );
    }
}