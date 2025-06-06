import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { RegisterLevel } from '@/types/register_level_enum'
import { authOptions } from '@/auth-options'
import { BidResult } from '@/types/bid_result_enum'

const prisma = new PrismaClient()

//Find the existing module selections
//return type: 
// {
//     "success": true,
//     "data": {
//       "academic_year_id": 2024,
//       "route_id": 3,
//       "selections_by_type": {
//         "CREDIT": [101, 102],
//         "SITIN": [103],
//       }
//     }
//  }
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findFirst({
      where: {
        email: session.user.email,
        deleted_at: null,
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    if (student.selection_status === 'NOT_STARTED') {
      return NextResponse.json({ success: false, data: null });
    }

    const records = await prisma.module_selection_result.findMany({
      where: {
        student_id: student.id,
        deleted_at: null,
      },
      select: {
        module_id: true,
        register_level: true,
        route_id: true,
        bid_result: true,
      },
    });

    if (records.length === 0) {
      return NextResponse.json({ success: true, data: null });
    }

    const selections_by_type = records.reduce((acc, record) => {
      if (!acc[record.register_level]) acc[record.register_level] = [];
      acc[record.register_level].push(record.module_id);
      return acc;
    }, {} as Record<string, number[]>);

    const waitlistedModuleIds = records
      .filter(r => r.bid_result === BidResult.WAITLIST)
      .map(r => r.module_id);

    const waitlistPositionMap: Record<number, number> = {};
    for (const moduleId of waitlistedModuleIds) {
      const waitlist = await prisma.wait_list.findMany({
        where: {
          module_id: moduleId,
          academic_year_id: student.academic_year_id,
          deleted_at: null,
        },
        orderBy: {
          bid_points: 'desc',
        },
        select: {
          student_id: true,
        },
      });

      const position = waitlist.findIndex(w => w.student_id === student.id);
      if (position >= 0) {
        waitlistPositionMap[moduleId] = position + 1;
      }
    }

    const bidResult = records.filter((r) => r.register_level === RegisterLevel.CREDIT).map((r) => ({
      module_id: r.module_id,
      bid_result: r.bid_result,
      ...(r.bid_result === BidResult.WAITLIST && waitlistPositionMap[r.module_id]
        ? { rank: waitlistPositionMap[r.module_id]}
        : {}
      )
    }))

    return NextResponse.json({
      success: true,
      data: {
        route_id: records[0].route_id,
        selections_by_type,
        records: bidResult
      },
    });
  } catch (error) {
    console.error("[GET /module_selection_result/]", error);
    return NextResponse.json(
      { success: false, message: "Fail to get existing module selections" },
      { status: 500 }
    );
  }
}

  
//Update module selections
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const student = await prisma.student.findFirst({
            where: {
                email: session.user.email,
                deleted_at: null,
            }
        })

        if (!student) {
            return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
        }

        const body = await req.json();
        const { status, academic_year_id, route_id, added, removedSitIn, removedCredit, bid_round } = body;
        if (!academic_year_id || !route_id || !status || !bid_round) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        } 

        const now = new Date();
        const inserts = added.map((entry: { module_id: number; register_level: RegisterLevel, is_compulsory: boolean }) => {
          return prisma.module_selection_result.upsert({
            where: {
              student_id_module_id_academic_year_id: {
                student_id: student.id,
                module_id: entry.module_id,
                academic_year_id,
              },
            },
            update: {
              register_level: entry.register_level,
              is_compulsory: entry.is_compulsory ?? false,
              bid_round: bid_round,
              route_id,
              modified_at: now,
              deleted_at: null,
            },
            create: {
              student_id: student.id,
              module_id: entry.module_id,
              register_level: entry.register_level,
              academic_year_id,
              is_compulsory: entry.is_compulsory ?? false,
              route_id,
              bid_round: bid_round,
              deleted_at: null,
            },
          });
        });

        const softDeletes = [...removedSitIn, ...removedCredit].map((moduleId: number) => {
          return prisma.module_selection_result.updateMany({
            where: {
              student_id: student.id,
              module_id: moduleId,
              deleted_at: null,
            },
            data: {
              deleted_at: now,
            },
          });
        });

        const updateStudent = prisma.student.update({
          where: {
            id: student.id,
          },
          data: {
            selection_status: status,
            route_id: route_id,
          }
        })
        await prisma.$transaction([...softDeletes, ...inserts, updateStudent]);

        //If the dropped modules have been allocated to current student
        //Then promote student on wait-list
        const droppedSuccessModules = removedCredit;
        for (const moduleId of droppedSuccessModules) {
          const topWaiter = await prisma.wait_list.findFirst({
            where: {
              module_id: moduleId,
              academic_year_id,
              deleted_at: null
            },
            orderBy: {
              bid_points: 'desc'
            },
            select: {
              id: true,
              student_id: true,
            }
          })
          if (topWaiter) {
            await prisma.$transaction([
              //Remove the first waiter from wait-list
              prisma.wait_list.update({
                where: {
                  id: topWaiter.id,
                },
                data: {
                  deleted_at: new Date()
                }
              }),
              prisma.module_selection_result.updateMany({
                where: {
                  student_id: topWaiter.student_id,
                  deleted_at: null,
                  module_id: moduleId,
                  academic_year_id: academic_year_id,
                }, 
                data: {
                  bid_result: 'SUCCESS'
                }
              })
            ])
          }
        }

        return NextResponse.json({
            success: true
        })
    } catch (error) {
        console.error('[POST /api/module_selection_result] Error:', error)
        return NextResponse.json(
            {
              success: false,
              data: null,
              message: `Error to update module selections: ${(error as Error).message}`,
            }, { status: 500 } 
        )
    }
}