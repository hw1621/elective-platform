import { useEffect } from "react";
import { ModuleMappingCache } from "@/types/rule-types";
import { Switch } from "@/components/ui/switch";

interface Props {
  programId: number;
  academic_year_id: number;
  moduleMappingCache: ModuleMappingCache | null;
  setModuleMappingCache: React.Dispatch<React.SetStateAction<ModuleMappingCache | null>>;
  refreshMappings: () => Promise<ModuleMappingCache | null>;
  setView: React.Dispatch<React.SetStateAction<"main" | "modules">>;
  
}

export function ModuleSitInOverview({  
    programId,
    academic_year_id,
    moduleMappingCache,
    setModuleMappingCache,
    refreshMappings,
    setView,
  }: Props) {

    useEffect(() => {
        const init = async () => {
          if (!moduleMappingCache) {
            const refreshed = await refreshMappings();
            setModuleMappingCache(refreshed);
          }
        //   setLoading(false);
        };
        init();
      }, [moduleMappingCache, refreshMappings]);

    const allModules = moduleMappingCache?.groups.flatMap((group) => 
        group.modules.map((mod) => ({
            ...mod, 
            groupName: group.module_group_name
        }))
    ) || [];
     

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Module Sit-In Overview</h2>

      <div className="border rounded-md p-4 bg-white shadow-sm">
        <table className="w-full table-auto border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2 text-left">Code</th>
              <th className="border px-3 py-2 text-left">Title</th>
              <th className="border px-3 py-2 text-left">Group</th>
              <th className="border px-3 py-2 text-left">Sit-In</th>
            </tr>
          </thead>
          <tbody>
            {allModules.map((mod) => (
              <tr key={mod.id} className="border-t">
                <td className="px-3 py-2">{mod.code}</td>
                <td className="px-3 py-2">{mod.title}</td>
                <td className="px-3 py-2">{mod.groupName}</td>
                <td className="px-3 py-2">
                    <Switch checked={false} disabled />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
