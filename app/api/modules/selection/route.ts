import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest} from "next/server";

const prisma = new PrismaClient();

//Find all modules and module groups of a route
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('route_id')
    const academicYearId = searchParams.get('academic_year_id')

    if (!routeId || !academicYearId) {
      return NextResponse.json({ error: "Missing route_id"}, { status: 400 });
    }

    try {
      const successCounts = await prisma.module_selection_result.groupBy({
        by: ['module_id'],
        where: {
          academic_year_id: Number(academicYearId),
          bid_result: 'SUCCESS',
          deleted_at: null,
        },
        _count: true,
      });

      const countMap = new Map<number, number>();
      successCounts.forEach((item) => {
        countMap.set(item.module_id, item._count);
      });

      const routeInfo = await prisma.route.findUnique({
        where: {
          id: parseInt(routeId),
          deleted_at: null,
        },
        select: {
          id: true,
          name: true,
          rules: {
            where: {
              deleted_at: null,
              module_group_id: {
                not: null 
              },
            },
            select: {
              min_ects: true,
              max_ects: true,
              is_compulsory: true,
              module_group: {
                select: {
                  id: true,
                  name: true,
                  mappings: {
                    where: {
                      deleted_at: null,
                      module: {
                        deleted_at: null
                      }
                    },
                    select: {
                      allow_sit_in: true,
                      module: {
                        select: {
                          id: true,
                          code: true,
                          title: true,
                          ects: true,
                          term: true, 
                          learn_teach_approach: true,
                          learning_outcome: true,
                          module_content: true,
                          reading_list: true,
                          assessment: true,
                          capacity: true,
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })

      if (!routeInfo) {
        return NextResponse.json({
          success: false,
          message: `Router route_id=${routeId} not found`
        })
      }
      
      const formatted = {
        route_id: routeInfo.id,
        route_name: routeInfo.name,
        rules: routeInfo.rules
          .filter(rule => rule.module_group !== null)
          .map((rule) => ({
            min_ects: rule.min_ects,
            max_ects: rule.max_ects,
            module_group_id: rule.module_group!.id,
            module_group_name: rule.module_group!.name,
            is_compulsory: rule.is_compulsory,
            modules: rule.module_group!.mappings.map((mapping) => ({
              allow_sit_in: mapping.allow_sit_in,
              is_full: (countMap.get(mapping.module.id) ?? 0) >= mapping.module.capacity,
              ...mapping.module,
            })),
          }))
      };
      
      return NextResponse.json({
        success: true,
        message: "Modules fetched successfully",
        data: formatted, 
      })
    } catch (error) {
      console.error(`[GET /api/modules/program_modules] Error fetching modules of routeId=${routeId}, errorMsg=${(error as Error).message}`);
      return NextResponse.json(
        { success: false, message: `Failed to fetch modules in module selection page`},
        { status: 500 }
      );
    }
}