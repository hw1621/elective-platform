import * as XLSX from 'xlsx';

export type RawExcelRow = Record<string, any>
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
}

export function parseBuffer(buffer: Buffer, idMap: Record<string, number>): ParsedModule[] {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet).slice(1);
    console.log(JSON.stringify(rows));
  
    return rows.map((row, i) => {
  
      return {
        code: String(row["BUSI Code"]),
        title: String(row["Long Title"]),
        academic_year_id: idMap[row.Year], 
        lecturer: row["Assignment"] ?? null,
        department: row["Department"] ?? null,
        employee_type: row["Employee Type"] ?? null,
        subject_area: row["Subject Area"] ?? null,
        lead_program: row["Lead Programme"] ?? null,
        eligible_cohorts: row["Eligible Cohorts"] ?? null,
        term: row.Term ?? null,
        role: row.Role ?? null,
        file_name: row["File Name"] ?? null,
        brief_description: row["Brief Description"] ?? null,
        ects: parseFloat(row.ECTs) || undefined,
        cats: parseFloat(row.CATs) || undefined,
        FHEQ_level: row["FHEQ Level"] ?? null,
        delivery_mode: row["Delivery Mode"] ?? null,
        learning_outcome: row["Learning Outcomes"] ?? null,
        module_content: row["Module Content"] ?? null,
        learn_teach_approach: row["Learning and Teaching Approach"] ?? null,
        assessment: row["Assessment Strategy"] ?? null,
        reading_list: row["Reading List"] ?? null,
        suite: row.Suite ?? null,
      };
    });
  }