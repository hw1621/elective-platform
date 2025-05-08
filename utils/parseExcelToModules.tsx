import { Module, ModuleGroup, Rule } from '@/types/rule-types';
import * as XLSX from 'xlsx';

export type RawExcelRow = Record<string, any>;
export type ParsedModule = {
    code: string;
    lecturer?: string;
    department?: string;
    employee_type?: string;
    subject_area?: string;
    lead_program?: string;
    eligible_cohorts?: string;
    term?: string;
    role?: string;
    file_name?: string;
    title: string;
    brief_description?: string;
    ects?: number;
    cats?: number;
    FHEQ_level?: string;
    delivery_mode?: string;
    learning_outcome?: string;
    module_content?: string;
    learn_teach_approach?: string;
    assessment?: string;
    reading_list?: string;
    suite?: string;
    academic_year_id: number;
};
export type ParseResult = {
    parsed: ParsedModule[];
    errors: { row: number; reason: string}[];
}

export function parseBuffer(buffer: Buffer, idMap: Record<string, number>): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet).slice(1); // skip first row

  const parsed: ParsedModule[] = [];
  const errors: { row: number; reason: string}[] = [];
  const safeString = (value: any): string | undefined => {
    if (value === null || value === undefined || value === '') return undefined;
    return String(value).trim();
  };

  const safeNumber = (value: any): number | undefined => {
      const num = parseFloat(value);
      return isNaN(num) ? undefined : num;
  };

   rows.forEach((row) => {

      const yearName = row["Year"];
      const academicYearId = idMap[yearName];

      if (!academicYearId) {
        errors.push({
          row: rows.indexOf(row) + 2, // +2 to account for header and 0-indexing
          reason: `Invalid academic year name: ${yearName}`
        });
        return;
      }

      if (!row["BUSI Code"]) {
        errors.push({
          row: rows.indexOf(row) + 2,
          reason: "Missing BUSI Code"
        });
        return;
      }

      const module =  {
          code: safeString(row["BUSI Code"])!,
          title: safeString(row["Long Title"])!,
          academic_year_id: academicYearId,
          lecturer: safeString(row["Assignment"]),
          department: safeString(row["Department"]),
          employee_type: safeString(row["Employee Type"]),
          subject_area: safeString(row["Subject Area"]),
          lead_program: safeString(row["Lead Programme"]),
          eligible_cohorts: safeString(row["Eligible Cohorts"]),
          term: safeString(row["Term"]),
          role: safeString(row["Role"]),
          file_name: safeString(row["File Name"]),
          brief_description: safeString(row["Brief Description"]),
          ects: safeNumber(row["ECTs"]),
          cats: safeNumber(row["CATs"]),
          FHEQ_level: safeString(row["FHEQ Level"]),
          delivery_mode: safeString(row["Delivery Mode"]),
          learning_outcome: safeString(row["Learning Outcomes"]),
          module_content: safeString(row["Module Content"]),
          learn_teach_approach: safeString(row["Learning and Teaching Approach"]),
          assessment: safeString(row["Assessment Strategy"]),
          reading_list: safeString(row["Reading List"]),
          suite: safeString(row["Suite"]),
      } as ParsedModule;
      parsed.push(module);
  });

  return { parsed, errors}
}

export function exportProgramRulesToExcel(
  programTitle: string | null,
  moduleGroups: ModuleGroup[],
  rules: Rule[],
  moduleMappingCache: { groups: { module_group_id: number; module_group_name: string; modules: Module[] }[] }
) {
  const groupColumns: Record<string, string[]> = {};
  moduleMappingCache.groups.forEach(group => {
    groupColumns[group.module_group_name] = group.modules.map(m => m.code);
  })

  //Create the elective group sheet
  const electiveGroupSheet: Record<string, any>[] = [];
  const maxRows = Math.max(...Object.values(groupColumns).map(arr => arr.length));
  for (let i = 0; i < maxRows; i++) {
    const row: Record<string, string> = {};
    for (const groupName in groupColumns) {
        row[groupName] = groupColumns[groupName][i] || "";
    }
    electiveGroupSheet.push(row);
  }

  //Create the route-rules sheet
  const routeRulesSheet = rules.map(rule => ({
    route_name: rule.route.name,
    group_name: rule.module_group.name,
    min_ects: rule.min_ects,
    max_ects: rule.max_ects
  }))

  // create workbook
  const workbook = XLSX.utils.book_new();

  const electiveSheet = XLSX.utils.json_to_sheet(electiveGroupSheet);
  XLSX.utils.book_append_sheet(workbook, electiveSheet, "ElectiveGroups");

  const rulesSheet = XLSX.utils.json_to_sheet(routeRulesSheet);
  XLSX.utils.book_append_sheet(workbook, rulesSheet, "Rules");

  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 12);
  const programName = programTitle ?? 'program';
  XLSX.writeFile(workbook, `${programName}_rules_${timestamp}.xlsx`);

}