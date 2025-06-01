import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("program_id");

    if (!programId) {
        return NextResponse.json({
          success: false,
          message: "Missing program_id",
        }, { status: 400 });
    }

    try {
        const compulsoryModules = await prisma.module_group_mapping.findMany({
            where: {
                deleted_at: null,
                module_group: {
                    deleted_at: null,
                    program_id: parseInt(programId),
                    rules: {
                        some: {
                            deleted_at: null,
                            is_compulsory: true,
                        }
                    }
                }
            },
            select: {
                module_id: true,
            }
        });

        console.log(compulsoryModules)
        const excludedModuleIds = new Set(compulsoryModules.map(m => m.module_id));

        const groupedModules = await prisma.module_selection_result.groupBy({
            by: ['module_id', 'type'],
            where: {
                deleted_at: null,
                student: {
                    program_id: parseInt(programId),
                    deleted_at: null
                },
                module_id: {
                    notIn: Array.from(excludedModuleIds)
                }
            },
            _count: {
                _all: true,
            }
        })
        console.log(groupedModules)

        //Find the non-compulsory module information 
        const modules = await prisma.module.findMany({
            where: { id: { in: Array.from(new Set(groupedModules.map(g => g.module_id))) } },
            select: { id: true, title: true }
        });

        const moduleMap = Object.fromEntries(modules.map(m => [m.id, m.title]));

        //Create module selection status which has structure: { 1 : { "SITIN": 1, "REGISTER": 2 }, 2: { "SITIN": 4, "REGISTER": 5 }}
        const moduleStats: Record<number, Record<string, number>> = {}
        for (const entry of groupedModules) {
            const { module_id, type, _count } = entry;
            if (!moduleStats[module_id]) {
                moduleStats[module_id] = {}
            }
            moduleStats[module_id][type] = _count._all;
        }

        const result = Object.entries(moduleStats).map(([moduleId, counts]) => {
            const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
            return {
                module_id: parseInt(moduleId),
                title: moduleMap[parseInt(moduleId)] ?? null,
                counts,
                total
            }
        }).sort((a, b) => b.total - a.total);

        return NextResponse.json({
            success: true,
            data: result,
        })
    }  catch (error) {
        console.error("Error finding program modules registration status: ", error);
        return NextResponse.json({ 
            success: false,
            message: `Error finding program modules registration status: ${(error as Error).message}`
        }, { status: 500 });
    }
}