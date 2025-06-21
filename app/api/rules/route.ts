import { ECTSRulePayload, TermRulePayload, ECTSRuleCreationPayload, TermRuleCreationPayload } from "@/types/admin_rule_types";
import { RuleType } from "@/types/rule_type_enum";
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
            module_group_name: rule.module_group?.name,
            academic_year_id: rule.academic_year_id,
            term: rule.term,
            max_module_count: rule.max_module_count,
            type: rule.type,
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
        const { type } = body;
        console.log(body)

        if (!type || !["ECTS", "TERM"].includes(type)) {
            return NextResponse.json(
                { success: false, message: "Parameters missing rule type" },
                { status: 400 }
            );
        }

        if (type === RuleType.ECTS) {
            return await updateECTSRule(body);
        } else if (type === RuleType.TERM) {
            return await updateTermRule(body);
        }
    } catch (error) {
        console.error("[PATCH /api/rules] Error updateing rule: ", error);
        return NextResponse.json({
            success: false, 
            message: (error as Error).message,
        }, { status: 500 })
    }
}

async function updateECTSRule(body: ECTSRulePayload) {     
    const { rule_id, min_ects, max_ects } = body;
    if (!rule_id || typeof min_ects !== 'number' || typeof max_ects !== 'number') {
        return NextResponse.json({
            success: false,
            message: "Invalid min_ects or max_ects for ECTS rule update"
        }, { status: 400 })
    }
    
    const rule = await prisma.rule.findUnique({
        where: { id: rule_id },
        select: { module_group_id: true },
    });

    if (!rule) {
        return NextResponse.json({
            success: false,
            message: "No rule found in update ECTS rule",
        }, { status: 404 });
    }

    if (!rule.module_group_id) {
        return NextResponse.json({
          success: false,
          message: "Cannot update ECTS rule: module_group_id is missing on the ECTS rule",
        }, { status: 400 });
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

    const updatedTermRule = await prisma.rule.update({
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
        data: updatedTermRule,
    })   
}

async function updateTermRule(body: TermRulePayload) {
    const { rule_id, term, max_module_count } = body;
    if (!rule_id || typeof term !== 'string' || typeof max_module_count !== 'number') {
        return NextResponse.json({
            success: false,
            message: "Invalid parameters for term rule update"
        }, { status: 400 });
    }

    const updatedTermRule =  await prisma.rule.update({
        where: { id: rule_id },
        data: {
            term,
            max_module_count,
        },
    });

    return NextResponse.json({
        success: true,
        data: updatedTermRule,
    });
}


//Insert new rules 
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type } = body;
        
        if (!type || !["ECTS", "TERM"].includes(type)) {
            return NextResponse.json(
                { success: false, message: "Update missing rule type" },
                { status: 400 }
            );
        }

        if (type === RuleType.ECTS) {
            return await handleEctsRuleCreation(body);
        } else if (type === RuleType.TERM) {
            return await handleTermRuleCreation(body);
        } 
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

async function handleEctsRuleCreation(body: ECTSRuleCreationPayload) {
    const { program_id, route_id, module_group_id, academic_year_id, min_ects, max_ects, type } = body;
  
    if (
        !program_id ||
        !route_id ||
        !module_group_id ||
        !academic_year_id ||
        min_ects === undefined ||
        max_ects === undefined
    ) {
        return NextResponse.json(
            { success: false, message: "Missing or invalid ECTS rule parameters" },
            { status: 400 }
        );
    }
  
    let isCompulsory = false;
    if (min_ects === max_ects) {
        const moduleGroupModules = await prisma.module_group_mapping.findMany({
            where: {
            module_group_id,
            deleted_at: null,
            },
            include: {
            module: {
                select: { ects: true },
            },
            },
        });
  
        const totalEcts = moduleGroupModules.reduce((sum, m) => sum + Number(m.module.ects), 0);
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
            type,
        },
    });
  
    return NextResponse.json({ success: true, data: newRule });
}
  
async function handleTermRuleCreation(body: TermRuleCreationPayload) {
    const { program_id, route_id, academic_year_id, term, max_module_count, type } = body;
    if (
        !program_id ||
        !route_id ||
        !academic_year_id ||
        !term ||
        max_module_count === undefined
    ) {
        return NextResponse.json(
        { success: false, message: "Missing or invalid Term rule parameters" },
        { status: 400 }
        );
    }

    const newTermRule = await prisma.rule.create({
        data: {
        program_id,
        route_id,
        academic_year_id,
        type,
        term,
        max_module_count,
        },
    });

    return NextResponse.json({ success: true, data: newTermRule });
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

