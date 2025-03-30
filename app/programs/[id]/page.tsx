"use client"

import { useEffect, useState } from "react";
import { Prisma } from "@prisma/client";
import { useParams } from "next/navigation";
import { Snackbar, Alert, Checkbox, Button, Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, FormControlLabel, Box } from "@mui/material";


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
    const [selectedModules, setSelectedModules] = useState<number[]>([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
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

    const handleToggleModule = (moduleId: number) => {
        setSelectedModules(prev => prev.includes(moduleId) 
            ? prev.filter(id => id !== moduleId) 
            : [...prev, moduleId]);
    }

    const handleSubmit = () => {
        const electiveSelectedIds = selectedModules.filter(id => {
            const module = modules.find(m => m.module.id === id);
            const groupName = module ? module.module_group.name.toLocaleLowerCase() : '';
            return !groupName.includes("compulsory");
        })
        
        // try {
        //     const response = await fetch()
        // }
        setSnackbarOpen(true);
    }

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
                                    {grouped_modules[category].modules.map((module) => {
                                        const isCompulsory = category.toLocaleLowerCase().includes('compulsory');
                                        return (
                                            <TableRow key={module.module.id}>
                                                <TableCell>{module.module.code}</TableCell>
                                                <TableCell>{module.module.title}</TableCell>
                                                <TableCell>{module.module.term}</TableCell>
                                                <TableCell>{module.module.ects ? `${module.module.ects} ECTS` : 'N/A'}</TableCell>
                                                <TableCell>
                                                    <FormControlLabel
                                                        control = {
                                                            <Checkbox
                                                            checked={isCompulsory || selectedModules.includes(module.module.id)}
                                                            onChange={() => !isCompulsory && handleToggleModule(module.module.id)}
                                                            disabled={isCompulsory}
                                                            />
                                                        }
                                                        label=""
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
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
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    paddingTop: 4,
                    paddingBottom: 4,
                    gap: 2,
                }}
            >
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleSubmit}
                >
                    Save
                </Button>
                <Button
                    variant="contained"
                    color="success"
                    onClick={handleSubmit}
                >
                    Submit
                </Button>
            </Box>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
                    "Elective modules have been saved successfully"
                </Alert>
            </Snackbar>
        </Container>
    );

}

