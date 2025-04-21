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
import { Button } from "@/components/ui/button"
import { Select, SelectContent } from "@/components/ui/select"
import { SelectItem, SelectTrigger, SelectValue } from "@radix-ui/react-select";
import { Tab } from "@mui/material";


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
}

export default function ModuleTable() {
    const [modules, setModules] = useState<Module[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const [academic_year_id, setAcademicYearId] = useState(1);

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
    return (
        <div>
          <Table className="table-fixed border border-gray-300">
            <TableHeader>
                <TableRow className="bg-gray-300">
                    {[
                    "Code", "Lecturer", "Department", "Employee Type", "Subject Area", "Lead Program",
                    "Eligible Cohorts", "Term", "Role", "File Name", "Title", "Brief Description",
                    "ECTS", "CATS", "FHEQ Level", "Delivery Mode", "Learning Outcome", "Module Content",
                    "Learn Teach Approach", "Assessment", "Reading List", "Suite"
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
                  <SelectValue />
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

