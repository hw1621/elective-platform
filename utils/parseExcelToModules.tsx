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

export function parseBuffer(buffer: Buffer, idMap: Record<string, number>): ParsedModule[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet).slice(1); // skip first row

  return rows
      .map((row) => {
          const yearName = row["Year"];
          const academicYearId = idMap[yearName];

          if (!academicYearId) {
              throw new Error(`Invalid academic year name: ${yearName}`);
          }

          const safeString = (value: any): string | undefined => {
              if (value === null || value === undefined || value === '') return undefined;
              return String(value).trim();
          };

          const safeNumber = (value: any): number | undefined => {
              const num = parseFloat(value);
              return isNaN(num) ? undefined : num;
          };

          return {
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
      });
}