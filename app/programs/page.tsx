"use client";

import { useEffect, useState } from "react";
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { Prisma } from "@prisma/client";
import { useRouter } from "next/navigation";

type ProgramWithAcademicYear = Prisma.programGetPayload<{
  include: {
    academic_year: true;
  };
}>;

export default function Programs() {
  const [programs, setPrograms] = useState<ProgramWithAcademicYear[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/programs")
      .then((res) => res.json())
      .then((data: ProgramWithAcademicYear[]) => {
        setPrograms(data);
      });
  }, []);

  const handleRowClick = (programId: number) => {
    router.push(`/programs/${programId}`)
  }

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
              <TableCell>Code</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Academic Year</TableCell>
              <TableCell>Suite</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {programs.map((program) => (
              <TableRow 
                key={program.id} 
                hover 
                onClick={() => handleRowClick(program.id)}
                style={{ cursor: "pointer" }}
              >
                <TableCell>{program.code}</TableCell>
                <TableCell>{program.title}</TableCell>
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
