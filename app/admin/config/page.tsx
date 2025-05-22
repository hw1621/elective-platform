"use client";
import { useEffect, useState } from "react";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type Program = {
    id: number;
    title: string;
    code: string;
    suite: string;
};

export default function ProgramList() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const response = await fetch("/api/programs?academic_year_id=1");
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message);
                }
                setPrograms(result.data);
            } catch (error) {
                console.error("Error fetching programs:", error);
            }
        };

        fetchPrograms();
    }, []);

    const groupedPrograms = programs.reduce((acc, program) => {
        const suite = program.suite || "Unassigned";
        if (!acc[suite]) {
            acc[suite] = [];
        } 
        acc[suite].push(program);
        return acc;
    }, {} as Record<string, Program[]>);

    const handleConfigure = (programId: number, title: string) => {
      router.push(`/admin/config/${programId}?title=${encodeURIComponent(title)}`);
    };

    return (
        <div className="p-8 space-y-10">
          {Object.entries(groupedPrograms).map(([suite, programs]) => (
            <div key={suite} className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-3xl font-extrabold tracking-wide uppercase">{suite}</span>
                </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {programs.map((program) => (
                  <Card key={program.id} className="hover:shadow-lg transition-shadow h-[220px]">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                      <CardTitle className="text-lg font-semibold">
                        {program.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{program.code}</p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={()=>handleConfigure(program.id, program.title)}
                      >
                        Configure
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
}