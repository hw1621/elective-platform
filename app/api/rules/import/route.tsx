import { NextRequest, NextResponse } from "next/server";
import { ParsedImportRule } from "@/types/rule-types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

//Import rules from the given file
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { program_id, academic_year_id, data }: {
            program_id: number;
            academic_year_id: number;
            data: ParsedImportRule;
        } = body;
        const { moduleGroups, rules } = data;

        const now = new Date();
        await prisma.$transaction(async (tx) => {
            //Delete rules
            await tx.rule.updateMany({
                where: {
                    program_id: program_id,
                    deleted_at: null,
                },
                data: {
                    deleted_at: now, 
                }
            })
            
            //Delete module group mappings
            await tx.module_group_mapping.updateMany({
                where: {
                    module_group: {
                        program_id: program_id,
                    },
                    deleted_at: null,
                },
                data: {
                    deleted_at: now,
                }
            })

            //Delete module groups
            await tx.module_group.updateMany({
                where: {
                    program_id: program_id,
                    deleted_at: null,
                }, 
                data: {
                    deleted_at: now,
                }
            })

            //Delete routes
            await tx.route.updateMany({
                where: {
                    program_id: program_id,
                    deleted_at: null,
                },
                data: {
                    deleted_at: now,
                }   
            })

            //Insert new routes
            const routeMap = new Map<string, number>();
            for (const rule of rules) {
                const routeName = rule.route_name.trim();
                if (!routeMap.has(routeName)) {
                    const createdRoute = await tx.route.create({
                        data: {
                            program_id: program_id,
                            name: routeName,
                        },
                    });
                    routeMap.set(routeName, createdRoute.id);
                }
            }

            //Insert new module groups
            const groupMap = new Map<string, number>();
            for (const [ groupName, moduleCodes ] of Object.entries(moduleGroups)) {
                const group = await tx.module_group.create({
                    data: {
                        program_id: program_id,
                        name: groupName,
                    }
                });
                groupMap.set(groupName, group.id);
                
                if (moduleCodes.length > 0) {
                    //Find the corresponding module records based on codes and acedmic year id
                    const modules = await tx.module.findMany({
                        where: {
                            code: { in: moduleCodes },
                            academic_year_id: academic_year_id,
                            deleted_at: null,
                        },
                        select: { id: true, code: true }
                    })
                    //Insert module group mappings
                    if (modules.length > 0) {
                        await tx.module_group_mapping.createMany({
                            data: modules.map(module => ({
                                module_group_id: group.id,
                                module_id: module.id,
                            })),
                            skipDuplicates: true,
                        })
                    }   
                }
            }

            //Insert new rules
            for (const rule of rules) {
                const routeId = routeMap.get(rule.route_name.trim());
                const groupId = groupMap.get(rule.group_name.trim());
                if (routeId && groupId) {
                    await tx.rule.create({
                        data: {
                            program_id: program_id,
                            academic_year_id: academic_year_id,
                            route_id: routeId,
                            module_group_id: groupId,
                            min_ects: rule.min_ects,
                            max_ects: rule.max_ects,
                        }
                    })
                }
            }
        })

    } catch (error) {
        console.error("[POST /api/rules/import] Failed to import rules: ", error);
        return NextResponse.json({ success: false, message: "Error importing rules" }, { status: 500 });
    }
}