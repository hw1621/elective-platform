import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest} from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const academic_year_id = searchParams.get("academic_year_id");
    const mode = searchParams.get("mode");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, parseInt(searchParams.get("page_size") || "20"));    

    if (!academic_year_id) {
      return NextResponse.json({ success: false, message: "Missing academic_year_id"}, { status: 400 });
    }

    const yearId = parseInt(academic_year_id);
    if (isNaN(yearId)) {
      return NextResponse.json({ success: false, message: "Invalid academic_year_id" }, { status: 400 });
    }

    try {
      //Fetch all module codes for the given academic year
      if (mode === "code") {
        const modules = await prisma.module.findMany({
          where: { 
            deleted_at: null,
            academic_year_id: yearId
          },
          select: {
            code: true,
          },
        });

        const codes = modules.map((module) => module.code);
        return NextResponse.json({ success: true, data: codes });
      }

      //Default mode: fetch all modules
      const totalCount = await prisma.module.count({
        where: { 
          deleted_at: null,
          academic_year_id: yearId,
        }
      });
      const modules = await prisma.module.findMany({
        where: { 
          deleted_at: null,
          academic_year_id: yearId
        },
        include: {
          academic_year: {
            select: {
              name: true
            }
          }
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
            id: 'asc',
        },
      });
      return NextResponse.json({
        success: true,
        data: modules,
        pageSize: pageSize,
        page: page,
        totalCount: totalCount
      })
    } catch (error) {
      console.error((error as Error).message);
      return NextResponse.json(
        { success: false, message: `Failed to fetch modules of academic_year_id = ${academic_year_id}`},
        { status: 500 }
      );
    }
}