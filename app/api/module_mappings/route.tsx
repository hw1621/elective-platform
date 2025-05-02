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
          

        const rules = await prisma.rule.findMany({
            where: {
                deleted_at: null,
                program_id: program_id,
            },
            include: {
                module_group: {
                    include: {
                        mappings: {
                            include: {
                                module: {
                                    select: {
                                        id: true,
                                        code: true,
                                        title: true,
                                    }
                                }
                            }
                        }
                    }
                }   
            }
        });


        const allModules = await prisma.module.findMany({
            where: {
                deleted_at: null,
                academic_year_id: academic_year_id,
            },
            select: {
                id: true,
                title: true,
                code: true,
            }
        });

        const usedModuleIds = new Set<number>();
        const groups = rules.map(rule => {
            const modules = rule.module_group.mappings.map(m => {
                usedModuleIds.add(m.module.id);
                return m.module;
            })
            return {
                module_group_id: rule.module_group.id,
                module_group_name: rule.module_group.name,
                modules,
            }
        });

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