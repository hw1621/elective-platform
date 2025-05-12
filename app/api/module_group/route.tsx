import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";

const prisma = new PrismaClient();

//Get all module_groups under given program_id 
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const program_id = searchParams.get("program_id")
        if (!program_id) {
            return NextResponse.json({
                success: false,
                message: "Missing program_id"
            }, { status: 400 })
        }

        const groups = await prisma.module_group.findMany({
            where: {
                program_id: Number(program_id),
                deleted_at: null
            },
            orderBy: {
                created_at: "asc"
            }
        })
        return NextResponse.json({
            success: true,
            data: groups
        })
    } catch (error) {
        console.error("[GET /api/module_group] Error fetching module groups", error)
        return NextResponse.json({
            success: false,
            data: null,
            message: "Fetch module groups fail"
        }, { status: 500 })
    }
}

//Update particular module_group 
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { module_group_id , name } = body;

        if (!module_group_id || typeof name !== "string" || name.trim() === "") {
            return NextResponse.json({
              success: false,
              message: "Invalid module_group_id or name"
            }, { status: 400 });
          }
                 
        const updatedGroup = await prisma.module_group.update({
            where: {
                id: module_group_id,
            },
            data: {
                name,
            },
        });
    
        return NextResponse.json({
            success: true,
            data: updatedGroup,
            message: "Module group updated successfully"
        }, { status: 200 })
    } catch (error) {
        console.error("[PATCH /api/module_group] Error updateing module group: ", error);
        return NextResponse.json({
            success: false, 
            message: (error as Error).message,
        }, { status: 500 })
    }
}
//Delete module_group
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { module_group_id } = body;
        if (!module_group_id) {
            return NextResponse.json({
                success: false,
                message: "Missing module_group_id parameter"
            }, { status: 400 });
        }

        const now = new Date();
        await prisma.$transaction([
            prisma.module_group.update({
                where: {
                    id: Number(module_group_id),
                    deleted_at: null,
                },
                data: {
                    deleted_at: now
                }
            }),
            prisma.rule.updateMany({
                where: {
                    module_group_id: Number(module_group_id),
                    deleted_at: null,
                },
                data: {
                    deleted_at: now
                }
            }),
        ]);

        return NextResponse.json({
            success: true,
            message: "Module group deleted successfully"
        }, { status: 200 });
    } catch (error) {
        console.error("[DELETE /api/module_group] Error deleting module group: ", error);
        return NextResponse.json({
            success: false,
            message: (error as Error).message,
        }, { status: 500 });
    }
}

//Add new module group
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, program_id } = body;
        if (!name || !program_id) {
            return NextResponse.json(
              { success: false, message: "Invalid name or program_id" },
              { status: 400 }
            );
        }

        const newGroup = await prisma.module_group.create({
            data: {
                name,
                program_id
            }
        });

        return NextResponse.json({
            success:true,
            data: newGroup,
            message: "Module group created successfully"
        });
    } catch (error) {
        console.error("[POST /api/module_group] Error creating module group:", error);
        return NextResponse.json({
            success: false,
            message: `Failed to create module group: ${(error as Error).message}`
        }, { status: 500 })
    }
}