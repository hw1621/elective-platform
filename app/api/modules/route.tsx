import { PrismaClient, term } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get("program_id");

    if (!programId) {
      return NextResponse.json({ error: "Missing program_id"}, { status: 400 });
    }

    try {
      const module_instances = await prisma.module_instance.findMany({
        where: { 
          is_deleted: false,
          program_id: parseInt(programId)
        },
        select: {
          id: true,
          type: true,
          program: {
            select: {
              title: true
            }
          },
          module: {
            select: { 
              code: true,
              title: true,
              ects: true,
              term: true,
            }
          }
        }
      });
      console.log(module_instances)
      return NextResponse.json(module_instances)
    } catch (error) {
      console.error(`Error fetching modules of program id = ${programId}`)
      return NextResponse.json(
        { error: `Failed to fetch modules of program id = ${programId}`},
        { status: 500 }
      );
    }
}