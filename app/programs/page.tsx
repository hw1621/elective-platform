"use client";

import { useEffect, useState } from "react";
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { useRouter } from "next/navigation";

type Program = {
  id: number;
  title: string;
  code: string;
  suite: string;
};

export default function Programs() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchPrograms() {
      const response = await fetch("/api/programs?academic_year_id=1");
      const result = await response.json();
      if (result.success) {
        setPrograms(result.data);
      } else {
        console.error("Failed to fetch programs:", result.message);
      }
    }
    fetchPrograms();
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
                <TableCell>{"2425"}</TableCell>
                <TableCell>{program.suite ?? "N/A"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
