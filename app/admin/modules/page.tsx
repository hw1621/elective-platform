'use client';
import { useEffect, useState } from "react";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
  } from "@/components/ui/table"
import { Select, SelectContent } from "@/components/ui/select"
import { SelectItem, SelectTrigger } from "@radix-ui/react-select";
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx';

type Module = {
    id: number;
    code: string;
    lecturer: string;
    department: string;
    employee_type: string;
    subject_area: string;
    lead_program: string;
    eligible_cohorts: string;
    term: string;
    role: string;
    file_name: string;
    title: string;
    brief_description: string;
    ects: number;
    cats: number;
    FHEQ_level: string;
    delivery_mode: string;
    learning_outcome: string;
    module_content: string;
    learn_teach_approach: string;
    assessment: string;
    reading_list: string;
    suite: string;
    academic_year: {
        name: string;
    };
}

export default function ModuleTable() {
    const [modules, setModules] = useState<Module[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const [academic_year_id, setAcademicYearId] = useState<number>(1);
    const [academicYears, setAcademicYears] = useState<{id: number; name: string}[]>([]);
    const [showFilter, setShowFilter] = useState(false);
    const [suiteFilter, setSuiteFilter] = useState<string | undefined>();

    useEffect(() => {   
        const fetchAcademicYear = async () => {
            const res = await fetch('/api/academic_year');
            if (!res.ok) {
                throw new Error("Failed to fetch academic years");
            }
            const data = await res.json();
            setAcademicYears(data);
        }
        fetchAcademicYear()
    }, []);

    useEffect(() => {
        const fetchModule = async () => {
            const response = await fetch(`/api/modules/all?academic_year_id=${academic_year_id}&page=${page}&page_size=${pageSize}`);
            if (!response.ok) {
                throw new Error("Failed to fetch modules");
            }
            const data = await response.json();
            setModules(data.data);
            setTotalCount(data.totalCount);
            setPage(data.page);
        }
        fetchModule()
    }, [academic_year_id, page, pageSize]);

    const totalPages = Math.ceil(totalCount / pageSize);
    const handleExport = async () => {
        const response = await fetch(`/api/modules/export?academic_year_id=${academic_year_id}`);
        if (!response.ok) {
            throw new Error("Failed to export modules");
        }
        const allModules: Module[] = await response.json();
        const exportData = allModules.map((module) => ({
            "Code": module.code,
            "Assignment": module.lecturer,
            "Department": module.department,
            "Employee Type": module.employee_type,
            "Subject Area": module.subject_area,
            "Lead Program": module.lead_program,
            "Eligible Cohorts/Programmes": module.eligible_cohorts,
            "Term": module.term,
            "Role": module.role,
            "File Name": module.file_name,
            "Long Title": module.title,
            "Brief Description": module.brief_description,
            "Ects": module.ects,
            "Cats": module.cats,
            "FHEQ Level": module.FHEQ_level,
            "Delivery_Mode": module.delivery_mode,
            "Learning_Outcome": module.learning_outcome,
            "Module_Content": module.module_content,
            "Learning_and_Teaching_Approach": module.learn_teach_approach,
            "Assessment_Strategy": module.assessment,
            "Reading_List": module.reading_list,
            "Suite": module.suite,
            "Year": module.academic_year.name
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Modules");
        XLSX.writeFile(workbook, `modules_${academic_year_id}.xlsx`);
    };

    return (
        <div>
            <div className="flex justify-start gap-4 mb-4">
            <Button onClick={() => setShowFilter((prev) => !prev)}>Apply Filter</Button>
            <Button>Upload</Button>
            <Button onClick={handleExport}>Export</Button>
            </div>

            <div className={`transform-gpu transition-transform duration-500 origin-top${showFilter ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}`}>
                {showFilter && (
                    <div className="p-4 mt-2 border rounded-lg bg-white shadow-sm w-fit space-y-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium w-24">Term</label>
                            <select value={academic_year_id} onChange={(e) => setAcademicYearId(Number(e.target.value))} className="px-2 py-1 border rounded">
                                {academicYears.map((year) => (
                                    <option key={year.id} value={year.id}>
                                        {year.name}
                                    </option>
                                ))}
                            </select>
                        </div> 
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium w-24">Suite</label>
                            <select
                            value={suiteFilter ?? ""}
                            onChange={(e) => setSuiteFilter(e.target.value || undefined)}
                            className="px-2 py-1 border rounded"
                            >
                            <option value="">All</option>
                            <option value="Finance">Finance</option>
                            <option value="Management">Management</option>
                            <option value="MBA">MBA</option>
                            <option value="Specialised Master">Specialised Master</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

          <Table className="table-fixed border border-gray-300">
            <TableHeader>
                <TableRow className="bg-gray-300">
                    {[
                    "Code", "Lecturer", "Department", "Employee Type", "Subject Area", "Lead Program",
                    "Eligible Cohorts", "Term", "Role", "File Name", "Title", "Brief Description",
                    "ECTS", "CATS", "FHEQ Level", "Delivery Mode", "Learning Outcome", "Module Content",
                    "Learn Teach Approach", "Assessment", "Reading List", "Suite", "Year"
                    ].map((header, idx) => (
                    <TableHead
                        key={idx}
                        className="px-4 py-2 w-[140px] font-semibold text-gray-700"
                    >
                        {header}
                    </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((module) => (
                <TableRow key={module.id}>
                  <TableCell className="w-[100px]">{module.code}</TableCell>
                  <TableCell className="w-[100px]">{module.lecturer}</TableCell>
                  <TableCell className="w-[100px]">{module.department}</TableCell>
                  <TableCell className="w-[100px]">{module.employee_type}</TableCell>
                  <TableCell className="w-[100px]">{module.subject_area}</TableCell>
                  <TableCell className="w-[100px]">{module.lead_program}</TableCell>
                  <TableCell className="w-[100px]">{module.eligible_cohorts}</TableCell>
                  <TableCell className="w-[100px]">{module.term}</TableCell>
                  <TableCell className="w-[100px]">{module.role}</TableCell>
                  <TableCell className="w-[100px]">{module.file_name}</TableCell>   
                  <TableCell className="w-[100px]">{module.title}</TableCell>
                  <TableCell className="w-[100px]">{module.brief_description}</TableCell>
                  <TableCell className="w-[100px]">{module.ects}</TableCell>
                  <TableCell className="w-[100px]">{module.cats}</TableCell>
                  <TableCell className="w-[100px]">{module.FHEQ_level}</TableCell>
                  <TableCell className="w-[100px]">{module.delivery_mode}</TableCell>
                  <TableCell className="w-[100px]">{module.learning_outcome}</TableCell>
                  <TableCell className="w-[100px]">{module.module_content}</TableCell>
                  <TableCell className="w-[100px]">{module.learn_teach_approach}</TableCell>
                  <TableCell className="w-[100px]">{module.assessment}</TableCell>
                  <TableCell className="w-[100px]">{module.reading_list}</TableCell>
                  <TableCell className="w-[100px]">{module.suite}</TableCell>  
                  <TableCell className="w-[100px]">{module.academic_year.name}</TableCell>
                </TableRow> 
              ))}
            </TableBody>
          </Table>
      
          {/* 分页器区域 */}
          <div className="flex justify-end mt-6 w-full">
            <div className="flex items-center space-x-3 text-sm">
              <span className="text-gray-700">PageSize:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(parseInt(value))
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-16 h-8 border rounded px-2">
                  {pageSize}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
      
              {/* < 前一页 */}
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-2 py-1 text-gray-600 hover:bg-gray-200 disabled:opacity-40 rounded"
              >
                {"<"}
              </button>
      
              {/* 页码按钮 */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true
                  if (page <= 4) return p <= 5 || p === totalPages
                  if (page >= totalPages - 3) return p >= totalPages - 4 || p === 1
                  return Math.abs(p - page) <= 1 || p === 1 || p === totalPages
                })
                .map((p, i, arr) => {
                  const prev = arr[i - 1]
                  const showDots = prev && p - prev > 1
                  return (
                    <span key={p} className="inline-flex items-center">
                      {showDots && <span className="px-1 text-gray-500">...</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`px-2 py-1 rounded ${
                          p === page
                            ? "bg-blue-100 text-blue-600 font-semibold"
                            : "hover:bg-gray-200 text-gray-700"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  )
                })}
      
              {/* > 下一页 */}
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-2 py-1 text-gray-600 hover:bg-gray-200 disabled:opacity-40 rounded"
              >
                {">"}
              </button>
            </div>
          </div>
        </div>
    )
      
}

