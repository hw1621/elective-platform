"use client";

import { useEffect, useState } from "react";
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { Prisma } from "@prisma/client";

type ProgramWithAcademicYear = Prisma.programGetPayload<{
  include: {
    academic_year: true;
  };
}>;

export default function Programs() {
  const [programs, setPrograms] = useState<ProgramWithAcademicYear[]>([]);

  useEffect(() => {
    fetch("/api/programs")
      .then((res) => res.json())
      .then((data: ProgramWithAcademicYear[]) => {
        setPrograms(data);
      });
  }, []);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Programs List
      </Typography>

      {/* Basic Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow style={{ backgroundColor: "#f5f5f5" }}>
              <TableCell>ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Academic Year</TableCell>
              <TableCell>Suite</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {programs.map((program) => (
              <TableRow key={program.id} hover>
                <TableCell>{program.id}</TableCell>
                <TableCell>{program.title}</TableCell>
                <TableCell>{program.code}</TableCell>
                <TableCell>{program.academic_year?.name ?? "N/A"}</TableCell>
                <TableCell>{program.suite ?? "N/A"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
