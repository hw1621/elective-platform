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

export default function ModuleTable({academic_year_id}: {academic_year_id: number}) {
    const [modules, setModules] = useState<Module[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {   
        const fetchModule = async () => {
            const response = await fetch(`api/modules/all?academic_year_id=${academic_year_id}&page=${page}&page_size=${pageSize}`);
            if (!response.ok) {
                throw new Error("Failed to fetch modules");
            }
            const data = await response.json();
            setModules(data.data);
            setTotalCount(data.totalCount);
            setPage(data.page);
        }
    }, [academic_year_id, page, pageSize]);
    const data = fetch("api/modules/all");

    const handlePrevPage = () => {
        setPage((prevPage) => Math.max(prevPage - 1, 1));
    };
    const handleNextPage = () => {
        setPage((prevPage) => Math.min(prevPage + 1, Math.ceil(totalCount / pageSize)));
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="p-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">id</TableHead>
                        <TableHead className="w-[100px]">Code</TableHead>
                        <TableHead className="w-[100px]">Lecturer</TableHead>
                        <TableHead className="w-[100px]">Department</TableHead>
                        <TableHead className="w-[100px]">Employee Type</TableHead>
                        <TableHead className="w-[100px]">Subject Area</TableHead>
                        <TableHead className="w-[100px]">Lead Program</TableHead>
                        <TableHead className="w-[100px]">Eligible Cohorts</TableHead>
                        <TableHead className="w-[100px]">Term</TableHead>
                        <TableHead className="w-[100px]">Role</TableHead>
                        <TableHead className="w-[100px]">File Name</TableHead>
                        <TableHead className="w-[100px]">Title</TableHead>
                        <TableHead className="w-[100px]">Brief Description</TableHead>
                        <TableHead className="w-[100px]">ECTS</TableHead>
                        <TableHead className="w-[100px]">CATS</TableHead>
                        <TableHead className="w-[100px]">FHEQ Level</TableHead>
                        <TableHead className="w-[100px]">Delivery Mode</TableHead>
                        <TableHead className="w-[100px]">Learning Outcome</TableHead>
                        <TableHead className="w-[100px]">Module Content</TableHead>
                        <TableHead className="w-[100px]">Learn Teach Approach</TableHead>
                        <TableHead className="w-[100px]">Assessment</TableHead>
                        <TableHead className="w-[100px]">Reading List</TableHead>
                        <TableHead className="w-[100px]">Suite</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {modules.map((module) => (
                        <TableRow key={module.id}>
                            <TableCell className="w-[100px]">{module.id}</TableCell>
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

                        </TableRow>))}
                </TableBody>
            </Table>

            <div className="flex justify-between mt-4">
                <Button onClick={handlePrevPage} disabled={page === 1}>
                    Previous
                </Button>  
                <span className="text-sm">Page {page} of {totalPages}</span>
                <Button onClick={handleNextPage} disabled={page === Math.ceil(totalCount / pageSize)}>
                    Next
                </Button>
            </div>
        </div>
    )

}

