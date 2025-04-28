import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const academicYearId = searchParams.get("academic_year_id");

  if (!academicYearId) {
    return NextResponse.json({
      success: false,
      data: null,
      message: "Missing academic_year_id parameter"
    }, { status: 400 });
  }

  try {
    const programs = await prisma.program.findMany({
      where: { 
        deleted_at: null,
        academic_year_id: parseInt(academicYearId)
      },
      select: {
        id: true,
        title: true,
        code: true,
        suite: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: programs,
      message: "Programs and academic years fetched successfully"
    }, { status: 200 })
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json({
      success: false,
      data: null,
      message: "Failed to fetch programs"
    }, { status: 500 });
  }
}