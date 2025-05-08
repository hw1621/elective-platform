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
    
        return NextResponse.json({
            success: true,
            data: rules,
            message: "Rules fetched successfully"
        }, 
        { status: 200}
        );
    } catch (error) {
        console.error("Error fetching rules:", error);
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
        console.log(typeof(min_ects))
        console.log(max_ects)
        if (typeof min_ects !== 'number' 
            || typeof max_ects !== 'number'
        ) {
            return NextResponse.json({
                success: false,
                message: "Invalid min_ects or max_ects"
            }, { status: 400 })
        }
                 
        const updatedRule = await prisma.rule.update({
            where: {
                id: rule_id,
            },
            data: {
                min_ects,
                max_ects,
            },
        });
    
        return NextResponse.json({
            success: true,
            data: updatedRule,
            message: "Rule updated successfully"
        }, { status: 200 })
    } catch (error) {
        console.error("Error updateing rule: ", error);
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
        const newRule = await prisma.rule.create({
            data: {
                program_id,
                route_id,
                module_group_id,
                academic_year_id,
                min_ects,
                max_ects
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

