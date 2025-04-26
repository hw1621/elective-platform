import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const modules = await request.json();
        const seenCodes = new Set<string>();

        if (!Array.isArray(modules) || modules.length === 0) {
            return NextResponse.json({ success: false, message: "No modules to import" }, { status: 400 });
        }

        const academicYearId = modules[0]?.academic_year_id;
        if (!academicYearId) {
            return NextResponse.json({ success: false, message: "First record missing academic_year_id" }, { status: 400 });
        }

        const existingModules = await prisma.module.findMany({
            where: {
                deleted_at: null,
                academic_year_id: academicYearId,
            },
            select: {
                code: true,
                id: true,
            }
        });

        const existingMap = new Map(existingModules.map(m => [m.code, m.id]));

        const updates = [];
        const inserts = [];

        for (const module of modules) {
            if (seenCodes.has(module.code)) {
                continue;
            }
            seenCodes.add(module.code);
            
            const { code, academic_year_id, ...rest } = module;
            const existingId = existingMap.get(code);

            if (existingId) {
                updates.push(prisma.module.update({
                    where: { id: existingId },
                    data: rest,
                }));
            } else {
                inserts.push(prisma.module.create({
                    data: {
                        code,
                        academic_year_id,
                        ...rest,
                    }
                }));
            }
        }

        await prisma.$transaction([...updates, ...inserts]);

        return NextResponse.json({ success: true, message: "Modules imported successfully" });

    } catch (error) {
        return NextResponse.json(
            { success: false, message: `Error during module import, errMsg: ${(error as Error).message}` },
            { status: 500 }
        );
        
    }
}
