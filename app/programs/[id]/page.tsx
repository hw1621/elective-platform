"use client"

import { useEffect, useState } from "react";
import { Prisma } from "@prisma/client";
import { useParams } from "next/navigation";
import { Button, Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";


type ModulesInfo = {
    id: number,
    type: 'COMPULSORY' | 'REQUIRED' | 'ELECTIVE'
    program: {
        title: String
    }
    module: {
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

    useEffect(() => {
        fetch(`/api/modules?program_id=${programId}`)
            .then(response => response.json())
            .then(data => setModules(data))
    }, [programId]);

    const programName = modules.length > 0 ? modules[0].program.title : 'Loading...';

    //Group modules based on their types and put them into the same section
    const grouped_modules = modules.reduce((groups, module) => {
        groups[module.type] = groups[module.type] || [];
        groups[module.type].push(module);
        return groups;
    }, {} as Record<string, ModulesInfo[]>);

    const moduleCategories = ['REQUIRED', 'COMPULSORY', 'ELECTIVE'];

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
                                    {grouped_modules[category].map((module) => (
                                        <TableRow key={module.id}>
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
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )
            ))}
        </Container>
    );

}

