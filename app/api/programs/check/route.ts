import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";


type Selection = {
    group_id: number;
    selected_modules: {
        id: number;
        ects: number
    }[];
}

export async function POST(request: NextRequest) {
    const { program_id, academic_year_id, selections }: {
        program_id: number;
        academic_year_id: number;
        selections: Selection[];
    } = await request.json();

    const prisma = new PrismaClient();
    console.log("Selections: ", selections);
    if (!program_id || !academic_year_id || !selections) {
        return NextResponse.json({ errors: [{message: "Missing required parameters"}] }, { status: 400 });
    }

    const rules = await prisma.rule.findMany({
        where: {
            deleted_at: null,
            program_id: program_id,
            academic_year_id: academic_year_id
        },
        include: {
            module_group: true,
        }
    });

    const ruleMap = new Map<number, typeof rules[number]>();
    for (const rule of rules) {
        if (rule.module_group.name.toLowerCase().includes('Compulsory')) {
            continue;
        }
        ruleMap.set(rule.module_group.id, rule);
    }

    const errors = [];
    for (const selection of selections) {
        const { group_id, selected_modules } = selection;
        const rule = ruleMap.get(group_id);

        if (!rule) {
            errors.push({
                message: `Module group ${group_id} not found`
            });
            continue;
        }
    
        const selectedEcts = selected_modules.reduce(
            (sum, mod) => sum.add(new Prisma.Decimal(mod.ects ?? 0)),
            new Prisma.Decimal(0)
          );
        // const min = rule.module_group.min_ects;
        // const max = rule.module_group.max_ects;

        const min = Decimal(1.0);
        const max = Decimal(1.0);
        
        if (min !== null &&  min.gt(selectedEcts) || max !== null && max.lt(selectedEcts)) {
            errors.push({
                message: `Module group "${rule.module_group.name}" requires ECTS between ${min} and ${max}, but selected ${selectedEcts}`
            });
        }
    }
    if (errors.length > 0) {
        return NextResponse.json({ errors: errors }, { status: 400 });
    } else {
        return NextResponse.json({ message: "Selection is valid" }, { status: 200 });
    }
}