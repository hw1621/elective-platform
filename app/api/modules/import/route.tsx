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

        const yearSet = new Set(modules.map(m => m.academic_year_id));
        if (yearSet.size !== 1) {
          return NextResponse.json({ success: false, message: "All modules must have the same academic_year_id" }, { status: 400 });
        }
        const academicYearId = [...yearSet][0];        

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

        for (const mod of modules) {
            if (seenCodes.has(mod.code)) {
                continue;
            }
            seenCodes.add(mod.code);
            
            const { code, academic_year_id, ...rest } = mod;
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

        return NextResponse.json({ 
            success: true, 
            message: `Modules imported successfully: ${inserts.length} inserted, ${updates.length} updated`,
        });

    } catch (error) {
        return NextResponse.json(
            { success: false, message: `Error during module import, errMsg: ${(error as Error).message}` },
            { status: 500 }
        );
        
    }
}
