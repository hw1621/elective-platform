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

//Update the rule based on rule_id
// export async function PATCH(request: NextRequest) {
//     try {
//         const body = await request.json();
//         const { rule_id, name, min_ects, max_ects} = body;
//         const updateData: Prisma.ruleUpdateInput = {};
//         if (name !== undefined) updateData.name = name;
//         if (min_ects !== undefined) updateData.min_ects = min_ects;
//         if (max_ects !== undefined) updateData.max_ects = max_ects;
            
//         const updatedGroupModule = await prisma.module_group.update({
//             where: {
//                 id: rul,
//             },
//             data: updateData,
//         });
    
//         return NextResponse.json({
//             success: true,
//             data: updatedGroupModule,
//             message: "Module group updated successfully"
//         }, { status: 200 })
//     } catch (error) {
//         console.error("Error updateing module group: ", error);
//         return NextResponse.json({
//             success: false, 
//             message: (error as Error).message,
//         }, { status: 500 })
//     }
// }

//Delete module_group
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { module_group_id, rule_id } = body;
        if (!module_group_id || !rule_id) {
            return NextResponse.json({
                success: false,
                message: "Missing module_group_id or rule_idparameter"
            }, { status: 400 });
        }

        const now = new Date();
        await prisma.$transaction([
            prisma.rule.updateMany({
                where: {
                    id: rule_id
                },
                data: {
                    deleted_at: now
                }
            }),
            prisma.module_group.update({
                where: {
                    id: module_group_id
                },
                data: {
                    deleted_at: now
                }
            })
        ]);

        return NextResponse.json({
            success: true,
            message: "Module group deleted successfully"
        }, { status: 200 });
    } catch (error) {
        console.error("Error deleting module group: ", error);
        return NextResponse.json({
            success: false,
            message: (error as Error).message,
        }, { status: 500 });
    }
}