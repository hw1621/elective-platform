import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET() {
  try {
    const programs = await prisma.program.findMany({
      where: { is_deleted: false },
      include: { 
        academic_year: {
          select: { name: true }
        }
      },
    });
    return NextResponse.json(programs)    
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json(
      { error: "Failed to fetch programs" },
      { status: 500 }
    );
  }
}