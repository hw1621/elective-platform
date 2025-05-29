import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

//Fetch module mapppings for all module groups
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const academic_year_id = Number(searchParams.get("academic_year_id"));
        const program_id = Number(searchParams.get("program_id"));

        if (!program_id || !academic_year_id) {
            return NextResponse.json({
              success: false,
              data: null,
              message: "Missing program_id or academic_year_id"
            }, { status: 400 });
          }
          

        const moduleGroups = await prisma.module_group.findMany({
            where: {
                deleted_at: null,
                program_id: program_id,
            },
            include: {
                mappings: {
                    where: {
                        module: {
                            academic_year_id,
                            deleted_at: null,
                        },
                        deleted_at: null,
                    },
                    include: {
                        module: {
                            select: {
                                id: true,
                                code: true,
                                title: true,
                                ects: true,
                            }
                        }
                    }
                }   
            }
        });

        const groups = moduleGroups.map(group => ({
            module_group_id: group.id,
            module_group_name: group.name,
            modules: group.mappings.map(mapping => ({
                ...mapping.module,
                allow_sit_in: mapping.allow_sit_in ?? false
              }))
        }))



        const allModules = await prisma.module.findMany({
            where: {
                deleted_at: null,
                academic_year_id: academic_year_id,
            },
            select: {
                id: true,
                title: true,
                code: true,
                ects: true,
            }
        });

        const usedModuleIds = new Set<number>(
            groups.flatMap(group => group.modules.map(mod => mod.id))
        );
        const notIncluded = allModules.filter(m => !usedModuleIds.has(m.id));
        return NextResponse.json({
            success: true,  
            data: {
                groups,
                notIncluded
            },
            message: "Module mappings fetched successfully"
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({
            success: false,
            data: null,
            message: `Failed to fetch module mappings, errorMsg: ${(error as Error).message}`
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { module_group_id, added_module_ids = [], removed_module_ids = [] } = body;
    
        if (!module_group_id || (!Array.isArray(added_module_ids) || !Array.isArray(removed_module_ids))) {
          return NextResponse.json({ success: false, message: "Invalid parameters of updating module group mappings request" }, { status: 400 });
        }

        const now = new Date();
        const operations = [
            ...added_module_ids.map((module_id: number) => 
                prisma.module_group_mapping.upsert({
                    where: {
                        module_group_id_module_id: {
                            module_group_id,
                            module_id,
                        }
                    },
                    update: {
                        deleted_at: null,
                    },
                    create: {
                        module_group_id,
                        module_id,
                    },
                })
            ),
            ...removed_module_ids.map((module_id: number) => 
                prisma.module_group_mapping.updateMany({
                    where: {
                        module_group_id,
                        module_id,
                    },
                    data: {
                        deleted_at: now
                    }
                })
            )
        ];

        await prisma.$transaction(operations);
        return NextResponse.json({
            success: true,
            message: "Update module group mappings successfully"
        })
    } catch (error) {
        console.error("[POST /api/module_mappings] Update module group mappings error:", error)
        return NextResponse.json({
            success: false,
            message: `Fail to update module group mappings, errMsg: ${(error as Error).message}`
        })
    }
}

//Update allow sit in
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { module_group_id, module_id, allow_sit_in } = body;

        if (!module_group_id || !module_id || typeof allow_sit_in !== "boolean") {
            return NextResponse.json({ success: false, message: "Invalid parameters of updating module group mappings request"});
          }

        await prisma.module_group_mapping.updateMany({
            where: {
                module_group_id,
                module_id,
                deleted_at: null,
            },
            data: {
                allow_sit_in
            }
        });

        return NextResponse.json({
            success: true,
            message: "Update module group mapping(sit-in) successfully"
        })
    } catch (error) {
        console.error("[PATCH /api/module_mappings] Update module group mapping error:", error)
        return NextResponse.json({
            success: false,
            message: `Fail to update module group mapping, errMsg: ${(error as Error).message}`
        })
    }
}