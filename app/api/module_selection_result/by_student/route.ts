import { authOptions } from "@/auth-options";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findFirst({
      where: {
        email: session.user.email,
        deleted_at: null,
      },
      select: {
        id: true,
        program_id: true,
        route_id: true,
        selection_status: true,
      }
    });

    if (!student) {
      return NextResponse.json({ success: false, message: "Student not found" }, { status: 404 });
    }

    if (!student.route_id) {
      return NextResponse.json({ success: false, message: "Student hasn't chosen route yet" }, { status: 404 });
    }

    const compulsoryModuleIds = (
      await prisma.rule.findMany({
        where: {
          route_id: student.route_id,
          program_id: student.program_id,
          is_compulsory: true,
          deleted_at: null,
        },
        select: {
          module_group: {
            select: {
              mappings: {
                where: {
                  deleted_at: null
                },
                select: {
                  module_id: true,
                }
              }
            }
          }
        }
      })
    ).flatMap(rule =>
      rule.module_group?.mappings?.map(mapping => mapping.module_id) ?? []
    );
    
    console.log(compulsoryModuleIds)
    const records = await prisma.module_selection_result.findMany({
      where: {
        student_id: student.id,
        route_id: student.route_id,
        deleted_at: null,
        module_id: {
          notIn: compulsoryModuleIds
        }
      },
      select: {
        register_level: true,
        bid_points: true,
        module: {
          select: {
            id: true,
            title: true,
            term: true,
            code: true,
            ects: true,
          },
        },
      },
    });

    const result = records.map((r) => ({
      id: r.module.id,
      name: r.module.title,
      term: r.module.term,
      register_level: r.register_level,
      ects: r.module.ects,
      code: r.module.code,
      bid_points: r.bid_points,
    }));

    console.log(result)
    return NextResponse.json({
      success: true,
      data: {
        selectionStatus: student.selection_status,
        programId: student.program_id,
        selectedModules: result,
      },
    });
  } catch (error) {
    console.error("[GET /module_selection_result]", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch selection results in bidding page." },
      { status: 500 }
    );
  }
}
