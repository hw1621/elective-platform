'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LabelList,
  } from "recharts";
import { useEffect, useState } from "react";
import { SelectionStatus } from "@/types/selection_status_enum";
import { RegisterLevel } from "@/types/register_level_enum";

type StudentRegistrationDataItem = {
    program_name: string;
    [SelectionStatus.COMPLETE]: number;
    [SelectionStatus.IN_PROGRESS]: number;
    [SelectionStatus.NOT_STARTED]: number;
}

type ModuleSelectionItem = {
  module_id: number,
  title: string,
  counts: Record<string, number>,
  total: number,
}

type Program = {
  id: number,
  title: string,
  code: string,
  suite: string,
}

export default function DashboardPage() {
  //First dashboard
  //TODO: change to dynamic year 
  const [academic_year_id] = useState<number>(1); // ✅ 直接初始化
  const [studentRegistrationData, setStudentRegistrationData] = useState<StudentRegistrationDataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  //Second dashboard
  const [moduleSelectionData, setModuleSelectionData] = useState<ModuleSelectionItem[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null); // 可用于切换 program
  const [moduleError, setModuleError] = useState<string | null>(null);
  const [moduleLoading, setModuleLoading] = useState(false);

  //All programs
  const [programs, setPrograms] = useState<Program[]>([]);

  // useEffect(() => {
  //   const mockData: StudentRegistrationDataItem[] = [
  //     { program_name: "Finance", COMPLETE: 45, IN_PROGRESS: 7, NOT_STARTED: 2 },
  //     { program_name: "FinTech", COMPLETE: 25, IN_PROGRESS: 8, NOT_STARTED: 1 },
  //     { program_name: "IWM", COMPLETE: 33, IN_PROGRESS: 10, NOT_STARTED: 5 },
  //     { program_name: "F&A", COMPLETE: 24, IN_PROGRESS: 7, NOT_STARTED: 3 },
  //     { program_name: "RMFE", COMPLETE: 19, IN_PROGRESS: 2, NOT_STARTED: 0 },
  //     { program_name: "Exchange", COMPLETE: 10, IN_PROGRESS: 0, NOT_STARTED: 1 },
  //   ];
  //   setStudentRegistrationData(mockData);
  // }, []);

  // useEffect(() => {
  //   const mockModules: ModuleSelectionItem[] = [
  //     {
  //       module_id: 6,
  //       title: "Sustainable Finance",
  //       counts: { CREDIT: 40, SITIN: 0 },
  //       total: 40,
  //     },
  //     {
  //       module_id: 7,
  //       title: "Financial Modelling",
  //       counts: { CREDIT: 34, SITIN: 0 },
  //       total: 34,
  //     },
  //     {
  //       module_id: 5,
  //       title: "Python for Finance",
  //       counts: { CREDIT: 28, SITIN: 4 },
  //       total: 28,
  //     },
  //     {
  //       module_id: 1,
  //       title: "Big Data, AI and Machine Learning",
  //       counts: { CREDIT: 18, SITIN: 3 },
  //       total: 21,
  //     },
  //     {
  //       module_id: 2,
  //       title: "Consumer Behaviour",
  //       counts: { CREDIT: 9, SITIN: 6 },
  //       total: 15,
  //     },
  //     {
  //       module_id: 3,
  //       title: "Brand Experience Design",
  //       counts: { CREDIT: 7, SITIN: 4 },
  //       total: 11,
  //     },
  //     {
  //       module_id: 4,
  //       title: "Business Analytics",
  //       counts: { CREDIT: 7, SITIN: 2 },
  //       total: 9,
  //     },
  //   ];
  //   setModuleSelectionData(mockModules);
  // }, [selectedProgramId]);
  
  useEffect(() => {
    const fecthPrograms = async () => {
      try {
        const res = await fetch(`/api/programs?academic_year_id=${academic_year_id}`)
        const body = await res.json();
        if (body.success) {
          setPrograms(body.data);
          if (body.data.length > 0) {
            setSelectedProgramId(body.data[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch programs", error);
      }
    }
    fecthPrograms();
  }, [academic_year_id])

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


  useEffect(() => {
    const fetchModuleSelectionData = async() => {
      if (!selectedProgramId) return;
      setModuleLoading(true);
      try {
        const res = await fetch(`/api/dashboard/module-overview?program_id=${selectedProgramId}`)
        const body = await res.json();
        if (body.success) {
          setModuleSelectionData(body.data ?? []);
        } else {
          setModuleError("Faied to fetch module selection data")
        }
      } catch (error) {
        console.error("Error fetching module selection data:", error);
        setModuleError("Failed to fetch module selection data.");
      } finally {
        setModuleLoading(false)
      }
    }
    fetchModuleSelectionData()
  }, [selectedProgramId])

  return (
    <div className="p-6 space-y-12">
      {/* Dashboard 1: Program-level selection status */}
      <section>
        <h1 className="text-2xl font-bold mb-6">Program Student Registration Status Dashboard</h1>

        <div className="bg-white rounded-xl shadow p-4 overflow-x-auto" style={{ width: '100%', height: '500px' }}>
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-gray-500 text-lg">Loading chart...</p>
            </div>
          ): error ? (
            <p className="text-red-600">{error}</p>
          ) : studentRegistrationData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={studentRegistrationData}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <XAxis dataKey="program_name" fontSize={15} />
                <YAxis allowDecimals={false} tickCount={10} />
                <Tooltip />
                <Legend verticalAlign="top" align="right" />
                <Bar dataKey={SelectionStatus.COMPLETE} stackId="a" name="Complete" fill="#16a34a" barSize={60} />
                <Bar dataKey={SelectionStatus.IN_PROGRESS} stackId="a" name="In Progress" fill="#9ca3af" />
                <Bar dataKey={SelectionStatus.NOT_STARTED} stackId="a" name="Not Started" fill="#f87171">
                  <LabelList dataKey="total" position="top" style={{ fill: '#000', fontWeight: 'bold', fontSize: 16 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400">No data available</p>
          )}
        </div>
      </section>
  
      {/* Dashboard 2: Module-level selection count */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Program-level Module Selection Count Dashboard</h2>
        
        <div className="bg-white rounded-xl shadow p-4 overflow-y-auto" style={{ width: '100%', height: 600 }}>
          <div className="mt-3 flex justify-start">
            {programs.length > 0 && (
              <div className="mb-6">
                <label htmlFor="program-select" className="font-medium mr-2">Select Program:</label>
                <select
                  id="program-select"
                  value={selectedProgramId ?? ""}
                  onChange={(e) => setSelectedProgramId(parseInt(e.target.value))}
                  className="border rounded p-2"
                >
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {moduleLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-gray-500 text-lg">Loading module selection count chart...</p>
            </div>
          ) : moduleError ? (
            <p className="text-red-600">{moduleError}</p>
          ) : moduleSelectionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={moduleSelectionData.map((item) => ({
                  title: item.title,
                  ...item.counts,
                  total: item.total,
                }))}
                layout="vertical"
                barCategoryGap={3}
                barGap={0}
                margin={{ top: 20, right: 40, bottom: 40 }}
              >
                <XAxis type="number" allowDecimals={false} tickCount={10}/>
                <YAxis dataKey="title" type="category" width={300} />
                <Tooltip formatter={(value: number, name: string) => [`${value} students`, name]} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  layout="vertical"
                  wrapperStyle={{ right: 0, top: 0 }}
                />
                <Bar dataKey={RegisterLevel.CREDIT} stackId="a" name="Credit" fill="#16a34a" barSize={25} />
                <Bar dataKey={RegisterLevel.SITIN} stackId="a" name="Sit-in" fill="#9ca3af">
                  <LabelList
                    dataKey="total"
                    position="right"
                    style={{ fill: '#000', fontSize: 13, fontWeight: 500 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400">No module data available</p>
          )}
        </div>
      </section>

    </div>
  );
  
}
