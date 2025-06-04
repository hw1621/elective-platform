import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { RegisterLevelValue } from '@/types/register_level_enum'
import { authOptions } from '@/auth-options'

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
      console.log(student)
  
      if (!student) {
        return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
      }

      if (student.selection_status === 'NOT_STARTED') {
        return NextResponse.json({
            success: true,
            data: null,
        })
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
      
      return NextResponse.json({
        success: true,
        data: {
          route_id: records[0].route_id,
          selections_by_type,
        },
      });
    } catch (error) {
      console.error("[GET /module_selection_result/]", error);
      return NextResponse.json({ success: false, message: "Fail to get existing module selections" }, { status: 500 });
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
        const { status, academic_year_id, route_id, selections } = body;
        if (!academic_year_id || !route_id || !selections || !status) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        } 

        const now = new Date();
        await prisma.$transaction([
            prisma.module_selection_result.updateMany({
              where: {
                student_id: student.id,
              },
              data: {
                deleted_at: now
              }
            }),
            prisma.module_selection_result.createMany({
              data: selections.map((s: { module_id: number; register_level: RegisterLevelValue }) => ({
                student_id: student.id,
                academic_year_id,
                route_id,
                module_id: s.module_id,
                register_level: s.register_level,
              })),
            }),
            prisma.student.update({
                where: {
                    id: student.id
                },
                data: {
                    selection_status: status,
                    route_id: route_id,
                }
            })
        ]);

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