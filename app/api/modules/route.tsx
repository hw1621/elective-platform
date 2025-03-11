import { PrismaClient, term } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get("program_id");
    const academic_year_id = searchParams.get("academic_year_id");

    if (!programId || !academic_year_id) {
      return NextResponse.json({ error: "Missing program_id"}, { status: 400 });
    }

    try {
      const module_instances = await prisma.rule.findMany({
        where: { 
          deleted_at: null,
          program_id: parseInt(programId),
          academic_year_id: parseInt(academic_year_id)
        },
        select: {
          program: {
            select: {
              title: true
            }
          },
          module_group: {
            select: { 
              mappings: {
                select: {
                  module_group: {
                    select: {
                      name: true,
                      max_ects: true,
                      min_ects: true
                    }
                  },
                  module_instance: {
                    select: {
                      module: {
                        select: {
                          id: true,
                          code: true,
                          title: true,
                          ects: true,
                          term: true,
                        }
                      }
                    }
                  }
                }
              } 
            }
          }
        }
      });
      const flattenedModules = module_instances.flatMap((rule) => 
        { 
          const program_name = rule.program.title
          return rule.module_group.mappings.map((mapping) => ({
            program_name: program_name,
            module_group: mapping.module_group,
            module: mapping.module_instance.module }))
        })
      console.log(flattenedModules)
      return NextResponse.json(flattenedModules)
    } catch (error) {
      console.error(error.message);
      return NextResponse.json(
        { error: `Failed to fetch modules of program id = ${programId}`},
        { status: 500 }
      );
    }
}