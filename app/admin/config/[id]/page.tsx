"use client"

import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect } from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button";


type Rule = {
    id: number;
    program_id: number;
    module_group: ModuleGroup;
    module_group_id: number;
    academic_year_id: number;
    route_id: number,
    route: {
        name: string,
    }
    min_ects: number,
    max_ects: number
}

type ModuleGroup = {
    id: number;
    name: string;
    program_id: number;
}

type Module = {
    id: number;
    code: string;
    title: string;
}

type GroupModules = {
    module_group_id: number;
    module_group_name: string;
    modules: Module[];
}

type ModuleMappingCache = {
    groups: GroupModules[];
    notIncluded: Module[];
}

export default function ProgramRuleConfig() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const programTitle = searchParams.get("title");

    const [rules, setRules] = useState<Rule[]>([])
    const [moduleGroups, setModuleGroups] = useState<ModuleGroup[]>([]);

    //Module Group editing data
    const [groupFormData, setgroupFormData] = useState<Partial<ModuleGroup>>({});
    const [editingGroupId, setEditingGroupId ] = useState<number | null>(null);

    //Route rule editing data
    const [routeFormData, setrouteFormData] = useState<Partial<Rule>>({})
    const [editingRouteRuleId, setEditingRuleId] = useState<number | null>(null);

    const [showManageModulesModal, setShowManageModulesModal] = useState(false);
    const [moduleMappingCache, setModuleMappingCache] = useState<ModuleMappingCache | null>(null);
    const [initialIncludedModules, setInitialIncludedModules] = useState<Set<number>>(new Set<number>());
    const [includedModules, setIncludedModules] = useState<Module[]>([]);
    const [notIncludedModules, setNotIncludedModules] = useState<Module[]>([]);

    const params = useParams();
    const programId = Number(params.id);

    //TODO: later modify the academic_year_id to be dynamic
    const academic_year_id = 1;
    
    useEffect(() => {
        const fetchRules = async () => {
            try {
                const response = await fetch(`/api/rules/?program_id=${programId}`);
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message);
                }
                setRules(result.data);
            } catch (error) {
                console.error("Error fetching rules: ", error);
            }
        };

        fetchRules();
    }, [programId]);

    useEffect(() => {
        const fetchModuleGroups = async () => {
            try {
                const res = await fetch(`/api/module_group/?program_id=${programId}`)
                const result = await res.json();
                if (!result.success) {
                    throw new Error(result.message);
                }
                setModuleGroups(result.data);
            } catch (error) {
                console.error("Error fetching module groups: ", error);
                alert("Error fetching module groups")
            }
        };
        fetchModuleGroups();
    }, [programId])

    //Elective Group Section Operations:
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

    const handleChange = (field: keyof (ModuleGroup & Rule), value: string) => {
        if (field === 'min_ects' || field === 'max_ects') {
            setrouteFormData((prev) => ({
                ...prev,
                [field]: parseFloat(value),
            }))
        } else {
            setgroupFormData((prev) => ({
                ...prev,
                [field]: value,
            }));            
        }
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
            setRules((prev) => prev.map((r) => 
                r.module_group_id === group.id 
                    ? {...r, module_group: {...r.module_group, name:groupFormData.name!}}
                    : r
                )
            );
        setEditingGroupId(null);
        } catch (error) {
            console.error("Error saving module group:", error);
            alert("Failed to save the module group. Please try again.");
        }
    }

    const handleGroupDelete = async (group: ModuleGroup) => {
        const confirmDelete = confirm("Are you sure you want to delete this rule?");

        if (!confirmDelete) return;
        try {
            const response = await fetch(`api/module_group`, {
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
            alert("Failed to delete the module group. Please try again.");
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

    const handleManageModules = async (group: ModuleGroup) => {
        setEditingGroupId(group.id);
        setShowManageModulesModal(true);

        if (!moduleMappingCache) {
            try {
                const response = await fetch(`/api/module_mappings?academic_year_id=${academic_year_id}&program_id=${programId}`);
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message);
                }
                setStates(result.data, group.id);
            } catch (error) {
                console.error("Faied to fetch module mappings:", error);
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

    //Update data in mapping cache 
    const refreshMappings = async () => {
        try {
            const refreshMapping = await fetch(`/api/module_mappings?academic_year_id=${academic_year_id}&program_id=${programId}`);
            const result = await refreshMapping.json();
            if (!result.success) {
                throw new Error(result.message);
            }
            setModuleMappingCache(result.data);
        } catch (error) {
            console.error("Failed to refetch mappings:", error);
        }
    }

    const handleSaveModules = async () => {
        if (!editingGroupId) {
            return
        }

        const currentIdSet = new Set(includedModules.map((mod) => mod.id));

        const added = [...currentIdSet].filter(id => !initialIncludedModules.has(id));
        const removed = [...initialIncludedModules].filter(id => !currentIdSet.has(id));

        if (added.length === 0 && removed.length === 0) {
            alert("No changes to save")
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
            alert("Module Group updated successfully")
            setShowManageModulesModal(false);
            setEditingGroupId(null)
            await refreshMappings();
        } catch (error) {
            console.error("Failed to save modules:", error);
            alert("Failed to save modules");
        }
    }

    //Route Section Operation:
    const handleRouteCancel = () => {
        setEditingRuleId(null);
        setrouteFormData({});
    }

    const handleRouteEdit = (rule: Rule) => {
        setEditingRuleId(rule.id);
        setrouteFormData({
            min_ects: rule.min_ects,
            max_ects: rule.max_ects
        })
    }

    const handleRouteSave = async (rule: Rule) => {
        try {
            const response = await fetch(`/api/rules`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    rule_id: rule.id,
                    min_ects: parseFloat(routeFormData.min_ects + ""),
                    max_ects: parseFloat(routeFormData.max_ects + ""),
                }),
            });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message)
            }

            setRules((prev) => prev.map(r => r.id === rule.id 
                ? {...r, min_ects: routeFormData.min_ects!, max_ects: routeFormData.max_ects!} 
                : r
            ))
            setEditingRuleId(null)
        } catch (error) {
            console.error("Failed to save route rules:", error)
            alert("Failed to save changes")
        }
        
    }
    
    const rulesByRoute = rules.reduce((acc, rule) => {
        if (!acc[rule.route_id]) {
            acc[rule.route_id] = {
                route_name: rule.route.name,
                rules:[],
            };
        }
        acc[rule.route_id].rules.push(rule);
        return acc;
    }, {} as  Record<string, { route_name: string; rules: Rule[]}>)
    
    const editingGroup = moduleGroups.find((g) => g.id === editingGroupId);

    return (
        <div className='p-8 space-y-10'>
            <h1 className="text-4xl font-semibold text-gray-900 mb-6">Config of Program {programTitle}</h1>

            <div className="flex items-center gap-4">
                <h1 className='text-3xl font-bold'>Elective Groups</h1>
                <Button variant='outline' onClick={() => router.back()}>
                    Back
                </Button>
                <Button variant='outline'>
                    Import Rule
                </Button>
            </div>

            <div className="space-y-4">
                {moduleGroups.map((group, index) => (
                    <div key={group.id} className="flex items-center space-x-4">
                        <div className="w-40 text-lg font-semibold text-gray-700">
                            Elective Group {index + 1}:
                         </div>
                        <div className="w-full">
                            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center border border-gray-300 rounded-lg px-4 py-3 bg-white shadow-sm hover:shadow-md transition gap-3 max-w-[900px]">
                                {editingGroupId === group.id ? (
                                <>
                                    <input
                                        type="text"
                                        value={groupFormData
                                .name ?? ""}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        className="border rounded px-2 py-1"
                                    />

                                    <div className="flex space-x-2 justify-end">
                                        <Button variant="ghost" size="sm" onClick={handleGroupCancel}>Cancel</Button>
                                        <Button variant="default" size="sm" onClick={() => handleGroupSave(group)}>Save</Button>
                                        <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleManageModules(group)}
                                        >
                                        Manage Modules
                                        </Button>
                                    </div>
                                    </>
                                ) : (
                                    <>
                                    <span className="text-base font-medium capitalize">{group.name}</span>
                                    <div className="flex space-x-2 justify-end">
                                        <Button variant="outline" size="sm" onClick={() => handleGroupEdit(group)}>Edit</Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleGroupDelete(group)}>Delete</Button>
                                        <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleManageModules(group)}
                                        >
                                        Manage Modules
                                        </Button>
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
                                <h3 className='font-semibold mb-2'>Included Modules</h3>
                                <div className="border rounded-md p-4 min-h-[200px] max-h-[300px] overflow-y-auto bg-gray-50">
                                    {includedModules.map(mod => (
                                        <div key={mod.id} 
                                             className="p-2 bg-white rounded shadow-sm mb-2 cursor-pointer hover:bg-blue-50"
                                             onClick={() => handleToggleModule(mod, "remove")}
                                        >
                                            {mod.code} - {mod.title}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Not Included Modules */}
                            <div>
                                <h3 className='font-semibold mb-2'>Not Included Modules</h3>
                                 <div className="border rounded-md p-4 min-h-[200px] max-h-[300px] overflow-y-auto bg-gray-50">
                                 {notIncludedModules.map(mod => (
                                    <div
                                        key={mod.id}
                                        className="p-2 bg-white rounded shadow-sm mb-2 cursor-pointer hover:bg-green-50"
                                        onClick={() => handleToggleModule(mod, "add")}
                                    >
                                        {mod.code} - {mod.title}
                                    </div>
                                ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6 space-x-2">
                            <Button variant="ghost" onClick={() => {setShowManageModulesModal(false); setEditingGroupId(null)}}>Cancel</Button>
                            <Button variant="default" onClick={() => handleSaveModules()}>Save</Button>
                        </div>
                    </div> 
                </div>
            )}

            
            <div className="space-y-4">
                <h1 className='text-3xl font-bold'>Routes</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(rulesByRoute).map(([routeId, { route_name, rules }]) => (
                        <div key={routeId} className="border rounded-lg p-3 bg-white shadow-sm">
                        <h2 className="text-base font-semibold mb-2">Route: {route_name}</h2>
                        <div className="space-y-2">
                            {rules.map((rule) => (
                                <div key={rule.id} className="border px-3 py-2 rounded-md bg-gray-50">
                                    <div className="grid grid-cols-[1fr_120px_120px_auto] items-center gap-4 text-sm">
                                        <div className="font-medium text-gray-900">{rule.module_group.name}</div>

                                        {editingRouteRuleId === rule.id ? (
                                        <>
                                            <div className="flex flex-col">
                                            <span className="text-xs text-gray-500">Min</span>
                                            <input
                                                type="number"
                                                step="0.5"
                                                value={routeFormData.min_ects ?? rule.min_ects}
                                                onChange={(e) => handleChange("min_ects", e.target.value)}
                                                className="border px-2 py-1 rounded"
                                                placeholder="Min"
                                            />
                                            </div>
                                            <div className="flex flex-col">
                                            <span className="text-xs text-gray-500">Max</span>
                                            <input
                                                type="number"
                                                step="0.5"
                                                value={routeFormData.max_ects ?? rule.max_ects}
                                                onChange={(e) => handleChange("max_ects", e.target.value)}
                                                className="border px-2 py-1 rounded"
                                                placeholder="Max"
                                            />
                                            </div>
                                            <div className="flex gap-1 justify-end">
                                            <Button variant="ghost" size="sm" onClick={handleRouteCancel}>Cancel</Button>
                                            <Button variant="default" size="sm" onClick={() => handleRouteSave(rule)}>Save</Button>
                                            </div>
                                        </>
                                        ) : (
                                        <>
                                            <div className="text-gray-900 font-medium">
                                            <span className="text-xs text-gray-500 mr-1">Min</span>
                                            {rule.min_ects}
                                            </div>
                                            <div className="text-gray-900 font-medium">
                                            <span className="text-xs text-gray-500 mr-1">Max</span>
                                            {rule.max_ects}
                                            </div>
                                            <Button variant="outline" size="sm" className="justify-self-end" onClick={() => handleRouteEdit(rule)}>Edit</Button>
                                        </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        </div>
                    ))}
                </div>
            </div>


        </div>

    )
}