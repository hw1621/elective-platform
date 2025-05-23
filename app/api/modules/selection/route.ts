import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest} from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('route_id')

    if (!routeId) {
      return NextResponse.json({ error: "Missing route_id"}, { status: 400 });
    }

    try {
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
            },
            select: {
              min_ects: true,
              max_ects: true,
              module_group: {
                select: {
                  id: true,
                  name: true,
                  mappings: {
                    where: {
                      deleted_at: null
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
        rules: routeInfo.rules.map((rule) => ({
          min_ects: rule.min_ects,
          max_ects: rule.max_ects,
          module_group_id: rule.module_group.id,
          module_group_name: rule.module_group.name,
          modules: rule.module_group.mappings.map((mapping) => ({
            allow_sit_in: mapping.allow_sit_in,
            ...mapping.module,
          })),
        }))
      };
      
      console.log(formatted)
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