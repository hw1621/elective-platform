import { SelectionStatus } from "@/types/selection_status_enum";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const academicYearId = searchParams.get("academic_year_id");
  
    if (!academicYearId) {
      return NextResponse.json({ 
        success: false,
        message: "Missing academic_year_id",
    }, { status: 400 });
    }

    try {
        const programs = await prisma.program.findMany({
            where: {
                academic_year_id: parseInt(academicYearId),
                deleted_at: null,
            },
            include: {
                students: true,
            },
        });

        const result = programs.map((program) => {
            const statusCounts = {
                [SelectionStatus.COMPLETE]: 0,
                [SelectionStatus.IN_PROGRESS]: 0,
                [SelectionStatus.NOT_STARTED]: 0,
            };

            program.students.forEach((student) => {
                const status = student.selection_status;
                if (status in statusCounts) {
                statusCounts[status as keyof typeof statusCounts]++;
                }
            });

            return {
                program_name: program.short_title,
                ...statusCounts,
                total: 
                    statusCounts[SelectionStatus.COMPLETE] +
                    statusCounts[SelectionStatus.IN_PROGRESS] + 
                    statusCounts[SelectionStatus.NOT_STARTED]
            };
        });
        return NextResponse.json({
            success: true,
            data: result,
            message: "Successfully fetch student registration status"
        });
    } catch (error) {
        console.error("Error finding student registraion status: ", error);
        return NextResponse.json({ 
            success: true,
            message: "Error finding student registraion status" 
        }, { status: 500 });
    }
}
