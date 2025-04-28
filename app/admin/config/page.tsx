// import { access } from "fs";
// import { useEffect, useState } from "react";

// type Program {
//     id: number;
//     title: string;
//     code: string;
//     suite: string;
// }

// export default function ProgramList() {
//     const [programs, setPrograms] = useState<Program[]>([]);

//     useEffect(() => {
//         const fetchPrograms = async () => {
//             try {
//                 const response = await fetch("/api/programs");
//                 if (!response.ok) {
//                     throw new Error("Network response was not ok");
//                 }
//                 const data = await response.json();
//                 setPrograms(data);
//             } catch (error) {
//                 console.error("Error fetching programs:", error);
//             }
//         };

//         fetchPrograms();
//     }, []);

//     const groupedPrograms = programs.reduce((acc, program)) => {
//         if (!acc[program.suite]) {
//             acc[programs.suite] = [];
//         } 
//         acc[programs.suite].push(program);
//         return access;
//     }, {} as Record<string, Program[]>);
// }