import { Button } from "@/components/ui/button";
import { GroupModules, Module, ModuleGroup, ModuleMappingCache, Rule } from "@/types/admin_rule_types";
import { fetchWithCheck } from "@/utils/fetchWithCheck";
import { useState } from "react";
import { Search, XCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
    programId: number;
    moduleGroups: ModuleGroup[];
    setModuleGroups: React.Dispatch<React.SetStateAction<ModuleGroup[]>>;
    setRules: React.Dispatch<React.SetStateAction<Rule[]>>;
    moduleMappingCache: ModuleMappingCache | null;
    setModuleMappingCache: (cache: ModuleMappingCache | null) => void;
    academic_year_id: number;
  }


export function ElectiveGroupSection({
    programId,
    moduleGroups,
    setModuleGroups,
    setRules,
    moduleMappingCache,
    setModuleMappingCache,
    academic_year_id
}: Props) {
    const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
    const [groupFormData, setgroupFormData] = useState<Partial<ModuleGroup>>({});
    const [creatingNewGroup, setCreatingNewGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [showManageModulesModal, setShowManageModulesModal] = useState(false);
    const [initialIncludedModules, setInitialIncludedModules] = useState<Set<number>>(new Set<number>());
    const [includedModules, setIncludedModules] = useState<Module[]>([]);
    const [notIncludedModules, setNotIncludedModules] = useState<Module[]>([]);

    const [excludedSearchTerm, setExcludedSearchTerm] = useState('');
    const [includedSearchTerm, setIncludedSearchTerm] = useState('');

    const handleGroupEdit = (group : ModuleGroup) => {
        setEditingGroupId(group.id);
        setgroupFormData({
            name: group.name,
        });
    }
    
    const handleGroupCancel = () => {
        setEditingGroupId(null);
        setgroupFormData({});
    }
    
    const handleChange = (field: keyof ModuleGroup, value: string) => {
        setgroupFormData((prev) => ({
            ...prev,
            [field]: value,
        }));            
    }

    const handleGroupSave = async (group: ModuleGroup) => {
        try {
            const response = await fetch(`/api/module_group`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    module_group_id: group.id,
                    name: groupFormData.name,
                }),
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message);
            }
            setModuleGroups((prev) => prev.map((g) => (g.id === group.id 
                ? { ...g, name: groupFormData.name! } 
                : g
            )));
            setRules((prev) =>
                prev.map((r) =>
                    r.module_group_id === group.id
                        ? { ...r, module_group_name: groupFormData.name! }
                        : r
                )
            );
        setEditingGroupId(null);
        } catch (error) {
            console.error("Error saving module group:", error);
            toast.error("Failed to save the module group. Please try again.");
        }
    }

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            toast.error("Group name can't be empty")
            return;
        }

        try {
            const response = await fetch("/api/module_group", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: newGroupName,
                    program_id: programId,
                })
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message);
            }
            
            setModuleGroups((prev) => [...prev, result.data])
            setNewGroupName("");
            setCreatingNewGroup(false);
        } catch (error) {
            console.error("Error creating module group:", error);
            toast.error("Failed to create module group")
        }
    }

    const handleGroupDelete = async (group: ModuleGroup) => {
        const confirmDelete = confirm("Are you sure you want to delete this rule?");

        if (!confirmDelete) return;
        try {
            const response = await fetch(`/api/module_group`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    module_group_id: group.id,
                }),
            });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message);
            }
            setModuleGroups((prev) => prev.filter((g) => g.id !== group.id));
            setRules((prev) => prev.filter(rule => rule.module_group_id !== group.id));
        } catch (error) {
            console.error("Error deleting module group:", error);
            toast.error("Failed to delete the module group. Please try again.");
        }
    }

    const handleManageModules = async (group: ModuleGroup) => {
        setEditingGroupId(group.id);
        setShowManageModulesModal(true);

        if (!moduleMappingCache) {
            try {
                const response = await fetchWithCheck<ModuleMappingCache>(`/api/module_mappings?academic_year_id=${academic_year_id}&program_id=${programId}`);
                setStates(response, group.id);
            } catch (error) {
                console.error("Failed to fetch module mappings:", error);
            }
        } else {
            setStates(moduleMappingCache, group.id);
        }
    }

    const handleToggleModule = (module: Module, action: "add" | "remove") => {
        if (action === "add") {
            setIncludedModules((prev) => [...prev, module])
            setNotIncludedModules((prev) => prev.filter(m => m.id !== module.id))
        } else {
            setNotIncludedModules((prev) => [...prev, module]);
            setIncludedModules((prev) => prev.filter(m => m.id !== module.id))
        }
    }

    const handleSaveModuleMappings = async () => {
        if (!editingGroupId) {
            return
        }

        const currentIdSet = new Set(includedModules.map((mod) => mod.id));

        const added = [...currentIdSet].filter(id => !initialIncludedModules.has(id));
        const removed = [...initialIncludedModules].filter(id => !currentIdSet.has(id));

        if (added.length === 0 && removed.length === 0) {
            toast.error("No changes to save")
            return
        }

        try {
            const response = await fetch('/api/module_mappings', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    module_group_id: editingGroupId,
                    added_module_ids: added,
                    removed_module_ids: removed,
                })
            })
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message);
            }
            toast.success("Module group mappings updated successfully")
            setShowManageModulesModal(false);
            setEditingGroupId(null)
            const updated = await refreshMappings();
            setModuleMappingCache(updated);
        } catch (error) {
            console.error("Failed to save module mappings:", error);
            toast.error("Failed to save module mappings");
        }
    }

    const setStates = (data: ModuleMappingCache, groupId: number) => {
        setModuleMappingCache(data);
        const currentGroup = data.groups.find((gp: GroupModules) => gp.module_group_id === groupId);
        const included = currentGroup?.modules ?? [];
        setIncludedModules(included);
        setInitialIncludedModules(new Set(included.map((m) => m.id)));
        setNotIncludedModules(data.notIncluded);
    }

    const refreshMappings = async () => {
        try {
            const refreshMapping = await fetchWithCheck<ModuleMappingCache>(`/api/module_mappings?academic_year_id=${academic_year_id}&program_id=${programId}`);
            setModuleMappingCache(refreshMapping);
            return refreshMapping;
        } catch (error) {
            console.error("Failed to refetch mappings:", error);
            toast.error("Failed to refresh module group mappings");
            return null;
        }
    }

    const editingGroup = moduleGroups.find((g) => g.id === editingGroupId);
    const totalECTS = includedModules.reduce((sum, mod) => sum + Number(mod.ects || 0), 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <h1 className='text-3xl font-bold'>Elective Groups</h1>
                <Button
                    variant="link"
                    className="text-blue-600 underline hover:text-blue-800 px-0"
                    onClick={() => setCreatingNewGroup(true)}
                    >
                    + Add Group
                </Button>
            </div>

            <div className="space-y-4">
            {[...moduleGroups, ...(creatingNewGroup ? [{} as ModuleGroup] : [])].map((group, index) => (
                <div key={group.id ?? `new-${index}`} className="flex items-center space-x-4">
                    <div className="w-40 text-lg font-semibold text-gray-700">
                    Elective Group {index + 1}:
                    </div>
                    <div className="w-full">
                    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center border border-gray-300 rounded-lg px-4 py-3 bg-white shadow-sm gap-3 max-w-[900px]">
                        {group.id === undefined ? (
                        <>
                            <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="border rounded px-2 py-1"
                            placeholder="New group name"
                            />
                            <div className="flex space-x-2 justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                setCreatingNewGroup(false);
                                setNewGroupName("");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleCreateGroup}
                            >
                                Save
                            </Button>
                            </div>
                        </>
                        ) : editingGroupId === group.id ? (
                        <>
                            <input
                            type="text"
                            value={groupFormData.name ?? ""}
                            onChange={(e) => handleChange("name", e.target.value)}
                            className="border rounded px-2 py-1"
                            />
                            <div className="flex space-x-2 justify-end">
                            <Button variant="ghost" size="sm" onClick={handleGroupCancel}>Cancel</Button>
                            <Button variant="default" size="sm" onClick={() => handleGroupSave(group)}>Save</Button>
                            <Button variant="outline" size="sm" onClick={() => handleManageModules(group)}>Manage Modules</Button>
                            </div>
                        </>
                        ) : (
                        <>
                            <span className="text-base font-medium capitalize">{group.name}</span>
                            <div className="flex space-x-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleGroupEdit(group)}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleGroupDelete(group)}>Delete</Button>
                            <Button variant="outline" size="sm" onClick={() => handleManageModules(group)}>Manage Modules</Button>
                            </div>
                        </>
                        )}
                    </div>
                    </div>
                </div>
            ))}
            </div>

            {showManageModulesModal && editingGroup && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-8 w-[1200px] max-w-[90vw] space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Manage Modules for Group {editingGroup.name}</h2>
                            <Button variant="ghost" onClick={() => {setShowManageModulesModal(false)}}>Close</Button>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            {/* Included Modules */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-semibold">
                                            Included Modules
                                            <span className="ml-2 text-sm font-normal text-black">
                                                (Total ECTS: {totalECTS})
                                            </span>
                                        </h3>
                                        <div className="relative w-64">
                                            <input
                                                type="text"
                                                value={includedSearchTerm}
                                                onChange={(e) => setIncludedSearchTerm(e.target.value)}
                                                placeholder="Search module..."
                                                className="w-full px-3 pr-9 py-1 border rounded-md text-sm"
                                            />
                                            {includedSearchTerm && (
                                                <XCircle 
                                                    className="w-5 h-5 absolute right-8 top-[6px] text-gray-400 cursor-pointer bg-white rounded-full" 
                                                    onClick={() => setIncludedSearchTerm('')} />
                                            )}
                                            <Search className="w-4 h-4 absolute right-2 top-2 text-gray-400 pointer-events-none" />
                                        </div>
                                </div>
                                <div className="border rounded-md p-4 min-h-[200px] max-h-[300px] overflow-y-auto bg-gray-50">
                                    {includedModules
                                        .filter(mod => mod.title.toLowerCase().includes(includedSearchTerm.toLowerCase()))
                                        .map(mod => (
                                            <div 
                                                key={mod.id}  
                                                className="p-2 bg-white rounded shadow-sm mb-2 cursor-pointer hover:bg-blue-50"
                                                onClick={() => handleToggleModule(mod, "remove")}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span>{mod.code} - {mod.title}</span>
                                                    <span className="text-sm text-black">{mod.ects} ECTS</span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Excluded Modules */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold">Excluded Modules</h3>
                                    <div className="relative w-64">
                                        <input
                                            type="text"
                                            value={excludedSearchTerm}
                                            onChange={(e) => setExcludedSearchTerm(e.target.value)}
                                            placeholder="Search module..."
                                            className="w-full px-3 pr-9 py-1 border rounded-md text-sm"
                                        />
                                        {excludedSearchTerm && (
                                            <XCircle 
                                                className="w-5 h-5 absolute right-8 top-[6px] text-gray-400 cursor-pointer bg-white rounded-full" 
                                                onClick={() => setExcludedSearchTerm('')} />
                                        )}
                                        <Search className="w-4 h-4 absolute right-2 top-2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="border rounded-md p-4 min-h-[200px] max-h-[300px] overflow-y-auto bg-gray-50">
                                {notIncludedModules
                                    .filter(mod => mod.title.toLowerCase().includes(excludedSearchTerm.toLocaleLowerCase()))
                                    .map(mod => (
                                        <div
                                            key={mod.id}
                                            className="p-2 bg-white rounded shadow-sm mb-2 cursor-pointer hover:bg-green-50"
                                            onClick={() => handleToggleModule(mod, "add")}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span>{mod.code} - {mod.title}</span>
                                                <span className="text-sm text-black">{mod.ects} ECTS</span>
                                            </div>
                                        </div>
                                ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6 space-x-2">
                            <Button variant="ghost" onClick={() => {setShowManageModulesModal(false); setEditingGroupId(null)}}>Cancel</Button>
                            <Button variant="default" onClick={() => handleSaveModuleMappings()}>Save</Button>
                        </div>
                    </div> 
                </div>
            )}
        </div>
    )
}