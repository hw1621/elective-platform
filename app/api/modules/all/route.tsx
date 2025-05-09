import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest} from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const academic_year_id = searchParams.get("academic_year_id");
    const page = parseInt(searchParams.get("page") || "1") ;
    const pageSize = parseInt(searchParams.get("page_size") || "20");

    if (!academic_year_id) {
      return NextResponse.json({ error: "Missing academic_year_id"}, { status: 400 });
    }

    try {
      const totalCount = await prisma.module.count({
        where: { 
          deleted_at: null,
          academic_year_id: parseInt(academic_year_id)
        }
      });
      const modules = await prisma.module.findMany({
        where: { 
          deleted_at: null,
          academic_year_id: parseInt(academic_year_id)
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
      console.log(modules);
      return NextResponse.json({
        data: modules,
        pageSize: pageSize,
        page: page,
        totalCount: totalCount
      })
    } catch (error) {
      console.error((error as Error).message);
      return NextResponse.json(
        { error: `Failed to fetch modules of academic_year_id = ${academic_year_id}`},
        { status: 500 }
      );
    }
}