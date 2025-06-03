import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";

const prisma = new PrismaClient();

//Fetch all rules under given program_id
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const program_id = searchParams.get("program_id");

    if (!program_id) {
        return NextResponse.json({
            success: false,
            data: null,
            message: "Missing program_id or academic_year_id parameter"
        },
        { status: 400 }
        );
    }   
    
    try {
        const rules = await prisma.rule.findMany({
            where: {
                deleted_at: null,
                program_id: parseInt(program_id),
            },
            include: {
                route: {
                    select: {
                        name: true,
                    }
                },
                module_group: {
                    select: {
                        id: true,
                        name: true,
                    }
                },                
            }
        });
        console.log(rules)

        const flattenedRules = rules.map(rule => ({
            id: rule.id,
            program_id: rule.program_id,
            module_group_id: rule.module_group_id,
            module_group_name: rule.module_group.name,
            academic_year_id: rule.academic_year_id,
            route_id: rule.route_id,
            route_name: rule.route.name,
            min_ects: rule.min_ects,
            max_ects: rule.max_ects
        }));
    
        return NextResponse.json({
            success: true,
            data: flattenedRules,
            message: "Rules fetched successfully"
        }, 
        { status: 200}
        );
    } catch (error) {
        console.error("[GET /api/rules] Error fetching rules:", error);
        return NextResponse.json({
            success: false,
            data: null,
            message: `Failed to fetch rules for program_id = ${program_id}, errorMsg: ${(error as Error).message}`
        }, { status: 500 }
        );
    }

}

// Update the rule based on rule_id
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { rule_id, min_ects, max_ects } = body;
        if (typeof min_ects !== 'number' 
            || typeof max_ects !== 'number'
        ) {
            return NextResponse.json({
                success: false,
                message: "Invalid min_ects or max_ects"
            }, { status: 400 })
        }
        
        const rule = await prisma.rule.findUnique({
            where: { id: rule_id },
            select: { module_group_id: true },
        });

        if (!rule) {
            return NextResponse.json({
                success: false,
                message: "Rule not found",
            }, { status: 404 });
        }

        let isCompulsory = false
        if (min_ects === max_ects) {
            const groupModules = await prisma.module_group_mapping.findMany({
                where: {
                    module_group_id: rule.module_group_id,
                    deleted_at: null,
                    module: {
                        deleted_at: null,
                    }
                },
                include: {
                    module: {
                        select: {
                            ects: true,
                        }
                    }
                }
            })
            const totalEcts = groupModules.reduce((sum, m) => sum + Number(m.module.ects), 0)
            isCompulsory = totalEcts === max_ects
        }

        const updatedRule = await prisma.rule.update({
            where: {
                id: rule_id,
            },
            data: {
                min_ects,
                max_ects,
                is_compulsory: isCompulsory,
            },
        });
    
        return NextResponse.json({
            success: true,
            data: updatedRule,
            message: "Rule updated successfully"
        }, { status: 200 })
    } catch (error) {
        console.error("[PATCH /api/rules] Error updateing rule: ", error);
        return NextResponse.json({
            success: false, 
            message: (error as Error).message,
        }, { status: 500 })
    }
}

//Insert new rules 
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { program_id, route_id, module_group_id, academic_year_id, min_ects, max_ects } = body
        if (
            !program_id ||
            !route_id ||
            !module_group_id ||
            !academic_year_id ||
            min_ects === undefined ||
            max_ects === undefined
        ) {
            return NextResponse.json(
                { success: false, message: "Missing or invalid rule parameters"}
            )
        } 

        let isCompulsory = false
        if (min_ects === max_ects) {
            const moduleGroupModules = await prisma.module_group_mapping.findMany({
                where: {
                    module_group_id,
                    deleted_at: null
                },
                include: {
                    module: {
                        select: {
                            ects: true
                        }
                    }
                }
            })

            const totalEcts = moduleGroupModules.reduce((sum, m) => sum + Number(m.module.ects), 0)
            isCompulsory = min_ects === totalEcts;
        }

        const newRule = await prisma.rule.create({
            data: {
                program_id,
                route_id,
                module_group_id,
                academic_year_id,
                min_ects,
                max_ects,
                is_compulsory: isCompulsory,
            }
        })

        return NextResponse.json({
            success: true,
            data: newRule,
        })
    } catch (error) {
        console.error("[POST /api/rules] Failed to create route rule:", error);
        return NextResponse.json(
          {
            success: false,
            message: `Failed to create rule: ${(error as Error).message}`,
          }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { rule_id } = body;

        if (!rule_id) {
        return NextResponse.json({ success: false, message: "Missing rule_id" }, { status: 400 });
        }

        await prisma.rule.update({
            where: { id: rule_id },
            data: {
                deleted_at: new Date(),
            },
        });
        return NextResponse.json({ success: true, message: "Rule deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("[DELETE /api/rules/] Error deleting rule:", error);
        return NextResponse.json({ success: false, message: "Failed to delete rule" }, { status: 500 });
    }
}

