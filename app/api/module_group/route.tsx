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
            }
        })
        return NextResponse.json({
            success: true,
            data: groups
        })
    } catch (error) {
        console.error("Error fetching module groups", error)
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
                 
        const updatedRule = await prisma.module_group.update({
            where: {
                id: module_group_id,
            },
            data: {
                name,
            },
        });
    
        return NextResponse.json({
            success: true,
            data: updatedRule,
            message: "Module group updated successfully"
        }, { status: 200 })
    } catch (error) {
        console.error("Error updateing module group: ", error);
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
                    id: module_group_id
                },
                data: {
                    deleted_at: now
                }
            }),
            prisma.rule.updateMany({
                where: {
                    module_group_id: module_group_id
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
        console.error("Error deleting module group: ", error);
        return NextResponse.json({
            success: false,
            message: (error as Error).message,
        }, { status: 500 });
    }
}