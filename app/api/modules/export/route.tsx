import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const academic_year_id = searchParams.get("academic_year_id");

  if (!academic_year_id) {
    return NextResponse.json({
      success: false,
      data: null,
      message: "Missing academic_year_id parameter"
    }, { status: 400 });
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
    });

    return NextResponse.json({
      success: true,
      data: {
        totalCount,
        modules
      },
      message: "Modules fetched successfully"
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching modules:", error);
    return NextResponse.json({
      success: false,
      data: null,
      message: `Failed to fetch modules for academic_year_id = ${academic_year_id}`
    }, { status: 500 });
  }
}