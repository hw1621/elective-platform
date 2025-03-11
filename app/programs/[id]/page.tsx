"use client"

import { useEffect, useState } from "react";
import { Prisma } from "@prisma/client";
import { useParams } from "next/navigation";
import { Button, Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";


type ModulesInfo = {
    program_name: string,
    module_group: {
        name: string,
        max_ects: number | null,
        min_ects: number | null
    }
    module: {
        id: number,
        code: string,
        title: string,
        ects: number | null,
        term: string;
    };
}

export default function Modules( ) {
    const [modules, setModules] = useState<ModulesInfo[]>([]);
    const params = useParams();
    console.log(`check the params ${params}`)
    const programId = Number(params.id)
    const academic_year_id = Number(1)

    useEffect(() => {
        fetch(`/api/modules?program_id=${programId}&&academic_year_id=${academic_year_id}`)
            .then(response => response.json())
            .then(data => {
                console.log("Module data:", data)
                data.map
                setModules(data)
            })
    }, [programId, academic_year_id]);


    const programName = modules.length > 0 ? modules[0].program_name : 'Loading...';

    //Group modules based on their types and put them into the same section
    const grouped_modules = modules.reduce((groups, module) => {
        const group_name = module.module_group.name;
        if (!groups[group_name]) {
            groups[group_name] = {
                max_ects: module.module_group.max_ects,
                min_ects: module.module_group.min_ects,
                modules: []
            };
        }
        groups[group_name].modules.push(module);
        return groups;
    }, {} as Record<string, { max_ects: number | null; min_ects: number | null; modules: ModulesInfo[] }>);

    const moduleCategories = Object.keys(grouped_modules)

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Modules for Program: {programName}
            </Typography>
            {moduleCategories.map((category) => (
                grouped_modules[category] && (
                    <Paper key={category} elevation={3} style={{ marginBottom: '20px' }}>
                        <Typography variant="h6" component="div" style={{ padding: '20px', backgroundColor: '#f5f5f5' }}>
                            {category}
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Code</TableCell>
                                        <TableCell>Title</TableCell>
                                        <TableCell>Term</TableCell>
                                        <TableCell>Credits</TableCell>
                                        <TableCell>Registration</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {grouped_modules[category].modules.map((module) => (
                                        <TableRow key={module.module.id}>
                                            <TableCell>{module.module.code}</TableCell>
                                            <TableCell>{module.module.title}</TableCell>
                                            <TableCell>{module.module.term}</TableCell>
                                            <TableCell>{module.module.ects ? `${module.module.ects} ECTS` : 'N/A'}</TableCell>
                                            <TableCell>
                                                <Button variant="contained" color="primary" >
                                                    Enroll
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {
                                        <TableRow>
                                            <TableCell colSpan={4} />
                                            <TableCell align="right" style={{ fontWeight: "bold"}}>
                                                {grouped_modules[category].min_ects} {" ≤ "} {" Total ≤ "} {grouped_modules[category].max_ects}
                                            </TableCell>
                                        </TableRow>
                                    }
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )
            ))}
        </Container>
    );

}

