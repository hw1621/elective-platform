'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
  } from "recharts";
import { useEffect, useState } from "react";
import { SelectionStatus } from "@/types/selection_status_enum";

type StudentRegistrationDataItem = {
    program_name: string;
    [SelectionStatus.COMPLETE]: number;
    [SelectionStatus.IN_PROGRESS]: number;
    [SelectionStatus.NOT_STARTED]: number;
}

export default function DashboardPage() {
  const [academic_year_id, setAcademicYearId] = useState<number>(1); // ✅ 直接初始化
    const [studentRegistrationData, setStudentRegistrationData] = useState<StudentRegistrationDataItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchStudentRegistrationData = async () => {
          if (academic_year_id === null) return;
          setLoading(true);
          try {
              const res = await fetch(`/api/dashboard/program-overview?academic_year_id=${academic_year_id}`);
              const body = await res.json();
              if (body.success) {
                console.log("Fetched chart data:", body.data);
                setStudentRegistrationData(body.data ?? []);
              } else {
                setError("Failed to fetch student registration data. Please try again later.");
              }
          } catch (error) {
              console.error("Error fetching student registration data:", error);
              setError("Failed to fetch student registration data. Please try again later.");
          } finally {
              setLoading(false);
          }
        }
        fetchStudentRegistrationData();
    }, [academic_year_id]);


    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Program Selection Status Dashboard</h1>

        {loading && <p>Loading chart...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && studentRegistrationData.length > 0 && (
          <div 
            className="overflow-x-auto bg-white rounded-xl" 
            style={{width: '1400px', height: "500px",}}
          >
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={studentRegistrationData}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <XAxis
                  dataKey="program_name"
                  fontSize={15}
                />
                <YAxis 
                  allowDecimals={false} 
                  tickCount={6}
                />
                <Tooltip />
                <Legend verticalAlign="top" align="right" />
                <Bar dataKey={SelectionStatus.COMPLETE} stackId="a" name="Complete" fill="#22c55e" barSize={60} />
                <Bar dataKey={SelectionStatus.IN_PROGRESS} stackId="a" name="In Progress" fill="#9ca3af" />
                <Bar dataKey={SelectionStatus.NOT_STARTED} stackId="a" name="Not Started" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
}
