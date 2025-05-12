'use client';
import { useEffect, useRef, useState } from "react";
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
import { parseBuffer, ParsedModule } from '@/utils/parseExcelToModules';

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
    const [previewData, setPreviewData] = useState<ParsedModule[]>([]);
    const [showDialog, setShowDialog] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const [editingCell, setEditingCell] = useState<{ row: number; column: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [parseErrors, setParseErrors] = useState<{ row: number; reason: string }[]>([]);

    useEffect(() => {   
        const fetchAcademicYear = async () => {
            const res = await fetch('/api/academic_year');
            const data = await res.json();
            if (!data.success) {
                throw new Error("Failed to fetch academic years, errorMsg: " + data.message);  
            }
            setAcademicYears(data.data);
        }
        fetchAcademicYear()
    }, []);

    useEffect(() => {
        const fetchModule = async () => {
            const response = await fetch(`/api/modules/all?academic_year_id=${academic_year_id}&page=${page}&page_size=${pageSize}`);
            const data = await response.json();
            if (!data.success) {
                alert(data.message);
                return;
            }
            setModules(data.data);
            setTotalCount(data.totalCount);
            setPage(data.page);
        }
        fetchModule()
    }, [academic_year_id, page, pageSize]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('textarea')) {
                return;
            }
            if (editingCell !== null) {
                setEditingCell(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [editingCell]);

    const yearIdMap = () => {
        const map: Record<string, number> = {};
        academicYears.forEach((year: { id: number; name: string }) => {
            map[year.name] = year.id;
        });
        return map;
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file?.name.endsWith('.xlsx')) {
            alert("Please upload a valid Excel file");
            return;
        }
        const parseExcel = async (file: File) => {
            const buffer = await file.arrayBuffer();
            const idMap = await yearIdMap();
            const parseResult = parseBuffer(Buffer.from(buffer), idMap);

            setPreviewData(parseResult.parsed);
            setParseErrors(parseResult.errors);
            setShowDialog(true);
        }      
        parseExcel(file);
        e.target.value = "";
    };

    const totalPages = Math.ceil(totalCount / pageSize);
    const handleExport = async () => {
        const response = await fetch(`/api/modules/export?academic_year_id=${academic_year_id}`);
        const data = await response.json();
        if (!data.success) {
            throw new Error("Failed to export modules, errorMsg: " + data.message);
        }
        const allModules: Module[] = data.data.modules;
        const exportData = allModules.map((module) => ({
            "BUSI Code": module.code,
            "Assignment": module.lecturer,
            "Department": module.department,
            "Employee Type": module.employee_type,
            "Subject Area": module.subject_area,
            "Lead Program": module.lead_program,
            "Eligible Cohorts": module.eligible_cohorts,
            "Term": module.term,
            "Role": module.role,
            "File Name": module.file_name,
            "Long Title": module.title,
            "Brief Description": module.brief_description,
            "Ects": module.ects,
            "Cats": module.cats,
            "FHEQ Level": module.FHEQ_level,
            "Delivery Mode": module.delivery_mode,
            "Learning Outcomes": module.learning_outcome,
            "Module Content": module.module_content,
            "Learning and Teaching_Approach": module.learn_teach_approach,
            "Assessment Strategy": module.assessment,
            "Reading List": module.reading_list,
            "Suite": module.suite,
            "Year": module.academic_year.name
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Modules");
        const now = new Date();
        const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 12);
        XLSX.writeFile(workbook, `modules_${academic_year_id}_${timestamp}.xlsx`);
    };

    const handleCellEdit = (row: number, column: string, newValue: string) => {
        setPreviewData(prev => {
            const newData = [...prev];
            newData[row] = {
                ...newData[row],
                [column]: newValue,
            };
            return newData;
        });
    };

    const handleConfirmSave = async () => {
        setLoading(true);
        const response = await fetch('/api/modules/import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(previewData),
        });

        const data = await response.json();
        if (!data.success) {
            setLoading(false);
            alert(`Import failed, errorMsg: ${data.message}`);
            return;
        }

        alert("Import successful");
        setShowDialog(false);
        setLoading(false);

        const refethchModule = await fetch(`/api/modules/all?academic_year_id=${academic_year_id}&page=${page}&page_size=${pageSize}`);
        const moduleData = await refethchModule.json();
        if (!moduleData.success) {
            alert(moduleData.message);
            return;
        }
        setModules(moduleData.data);
        setTotalCount(moduleData.totalCount);
        setPage(moduleData.page);
    }

    return (
        <div>
            <div className="flex justify-start gap-4 mb-4">
            <Button onClick={() => setShowFilter((prev) => !prev)}>Apply Filter</Button>
            <input type='file' accept='.xlsx' ref={fileInput} onChange={handleFileUpload} className="hidden" />
            <Button onClick={() => fileInput.current?.click()}>Upload</Button>
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
                    {[
                        module.code, module.lecturer, module.department, module.employee_type,
                        module.subject_area, module.lead_program, module.eligible_cohorts, module.term,
                        module.role, module.file_name, module.title, module.brief_description,
                        module.ects, module.cats, module.FHEQ_level, module.delivery_mode,
                        module.learning_outcome, module.module_content, module.learn_teach_approach,
                        module.assessment, module.reading_list, module.suite, module.academic_year.name,
                    ].map((value, idx) => (
                        <TableCell key={idx} className="w-[140px]">
                        <div className="max-h-[120px] overflow-auto text-xs whitespace-pre-wrap break-words">
                            {String(value ?? '')}
                        </div>
                        </TableCell>
                    ))}
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
          {showDialog && (
            <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
                <div className="bg-white rounded-xl p-6 w-[90vw] max-w-6xl max-h-[90vh] overflow-auto shadow-lg">
                <h2 className="text-lg font-bold mb-4">Preview of Imported Modules</h2>

                {parseErrors.length > 0 && (
                    <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm max-h-40 overflow-auto">
                        ⚠️ {parseErrors.length} error(s) found:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            {parseErrors.map((error, idx) => (
                                <li key={idx}>
                                    Row {error.row}: {error.reason}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {previewData.length === 0 ? (
                    <p>No valid data to preview</p>
                ) : (
                    <div className="overflow-auto max-h-[70vh]">
                        <table className="w-full border-collapse text-sm">
                            <thead className="sticky top-0 bg-gray-200">
                                <tr>
                                {Object.keys(previewData[0]).map((key) => (
                                    <th
                                    key={key}
                                    className="border px-2 py-2 font-medium text-mid min-w-[120px] max-w-[250px] truncate"
                                    >
                                    {key}
                                    </th>
                                ))}
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.map((module, rowIndex) => (
                                <tr key={rowIndex}>
                                    {Object.entries(module).map(([key, value], colIndex) => (
                                        <td key={colIndex} className="border px-2 py-2 align-top" 
                                            onDoubleClick={() => setEditingCell({ row: rowIndex, column: colIndex.toString() })}
                                        >  
                                        {editingCell?.row === rowIndex && editingCell.column === colIndex.toString() ? (
                                            <textarea
                                                key={`${module.code}-${key}-textarea`}
                                                autoFocus
                                                value={String(value ?? '')}
                                                onChange={(e) => handleCellEdit(rowIndex, key, e.target.value)}
                                                className="w-full h-auto min-h-[120px] max-h-[300px] text-xs p-2 border border-gray-300 resize-none overflow-auto"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleCellEdit(rowIndex, key, e.currentTarget.value);
                                                        setEditingCell(null);
                                                    }
                                                    if (e.key === 'Escape') {
                                                        setEditingCell(null);
                                                    }
                                                }}
                                            />  
                                        ) : (
                                            <div className="max-h-[80px] max-w-[250px] overflow-auto text-xs whitespace-pre-wrap break-words">
                                            {String(value)}
                                            </div>
                                        )}
                                        </td>
                                    ))}
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-4 flex justify-end gap-2">
                    <Button 
                        variant="outline" 
                        onClick={() => setShowDialog(false)}
                        disabled={loading}
                    >
                        Close
                    </Button>
                    <Button 
                        onClick={handleConfirmSave} 
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Confirm"}
                    </Button>
                </div>

                </div>
            </div>
          )}

        </div>
    )
      
}

