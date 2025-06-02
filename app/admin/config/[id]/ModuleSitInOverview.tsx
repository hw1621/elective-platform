import { useEffect } from "react";
import { ModuleMappingCache } from "@/types/admin_rule_types";
import { Switch } from "@/components/ui/switch";

interface Props {
  moduleMappingCache: ModuleMappingCache | null;
  setModuleMappingCache: React.Dispatch<React.SetStateAction<ModuleMappingCache | null>>;
  refreshMappings: () => Promise<ModuleMappingCache | null>;
  settings: Record<string, { id: number; value: string }>;
}

export function ModuleSitInOverview({  
    moduleMappingCache,
    setModuleMappingCache,
    refreshMappings,
    settings,
  }: Props) {

    useEffect(() => {
        const init = async () => {
          if (!moduleMappingCache) {
            const refreshed = await refreshMappings();
            setModuleMappingCache(refreshed);
          }
        };
        init();
      }, [moduleMappingCache, refreshMappings, setModuleMappingCache]);

    const allModules = moduleMappingCache?.groups.flatMap((group) => 
        group.modules.map((mod) => ({
            ...mod, 
            module_group_id: group.module_group_id,
            groupName: group.module_group_name
        }))
    ) || [];

    const isSitInEnabled = settings["enable_sit_in"]?.value === "true";

    const handleSitInChange = async (modId: number, moduleGroupId: number, currentValue: boolean) => {
      try {
        const res = await fetch("/api/module_mappings", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            module_id: modId,
            module_group_id: moduleGroupId,
            allow_sit_in: !currentValue,
          }),
        });

        const json = await res.json();
        if (!json.success) {
          throw new Error(json.message);
        }
        setModuleMappingCache((prev) => {
          if (!prev) return null;
          const updatedGroups = prev.groups.map((group) => {
            if (group.module_group_id !== moduleGroupId) return group;
            return {
              ...group,
              modules: group.modules.map((mod) =>
                mod.id === modId ? { ...mod, allow_sit_in: !currentValue } : mod
              ),
            };
          });
          return { ...prev, groups: updatedGroups };
        });
      } catch (error) {
        console.error("Failed to update sit-in status:", error);
        alert("Failed to update sit-in status");
      }
    }

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
                  <Switch 
                    checked={mod.allow_sit_in === true} 
                    onCheckedChange={() => handleSitInChange(mod.id, mod.module_group_id, mod.allow_sit_in)}
                    disabled={!isSitInEnabled}/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
