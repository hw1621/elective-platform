"use client"

import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { toast } from "react-hot-toast";
import { exportProgramRulesToExcel, parseRuleExcel } from "@/utils/parseExcelToModules";
import { GroupModules, Module, ModuleGroup, ModuleMappingCache, ParsedImportRule, Rule } from "@/types/rule-types";
import React from "react";


export default function ProgramRuleConfig() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const programTitle = searchParams.get("title");

    const [rules, setRules] = useState<Rule[]>([])
    const [moduleGroups, setModuleGroups] = useState<ModuleGroup[]>([]);

    //Module Group editing data
    const [groupFormData, setgroupFormData] = useState<Partial<ModuleGroup>>({});
    const [editingGroupId, setEditingGroupId ] = useState<number | null>(null);
    const [creatingNewGroup, setCreatingNewGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");

    //Route rule editing data
    const [routeFormData, setrouteFormData] = useState<Partial<Rule>>({})
    const [editingRouteRuleId, setEditingRuleId] = useState<number | null>(null);
    //RouteId for new created rule
    const [creatingRuleRouteId, setCreatingRuleRouteId] = useState<number | null>(null)
    //Data for new created rule
    const [newRuleForm, setNewRuleForm] = useState<Partial<Rule>>({});

    //Dialog for imported rules
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [importedRules, setImportedRules] = useState<ParsedImportRule | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const [saving, setSaving] = useState(false);
    

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
                toast.error("Error fetching module groups")
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
            await refreshMappings();
        } catch (error) {
            console.error("Failed to save module mappings:", error);
            toast.error("Failed to save module mappings");
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
            toast.error("Failed to save route rules")
        }
    }
    
    const handleCreateRouteRule = async (routeId: number) => {
        if (!newRuleForm.module_group_id || 
            newRuleForm.min_ects === undefined || 
            newRuleForm.max_ects === undefined
        ) {
            toast.error("Please complete all fields")
            return;
        }

        try {
            const response = await fetch("/api/rules", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  program_id: programId,
                  route_id: routeId,
                  academic_year_id,
                  module_group_id: newRuleForm.module_group_id,
                  min_ects: newRuleForm.min_ects,
                  max_ects: newRuleForm.max_ects,
                }),
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message);
            }

            setCreatingRuleRouteId(null);
            setNewRuleForm({});
            setRules((prev) => [...prev, 
                {
                  ...result.data,
                  route: { name: rulesByRoute[routeId].route_name },
                  module_group: moduleGroups.find(g => g.id === newRuleForm.module_group_id)!
                }
            ])
        } catch (error) {
            console.error("Failed to create rule:", error);
            toast.error("Failed to create rule, please try again.");
        }
    }

    //Refetch route rules (used as refreshing mechanism)
    const refreshRouteRules = async () => {
        try {
            const refreshed = await fetch(`/api/rules/?program_id=${programId}`);
            const result = await refreshed.json();
            if (!result.success) {
                throw new Error(result.message);
            }
            setRules(result.data);
        } catch (error) {
            console.error("Failed to refetch route rules:", error);
            toast.error("Failed to refresh route rules after inserting new rule");
        }
    }

    //Refetch modules group mappings (used as refreshing mechanism)
    const refreshMappings = async () => {
        try {
            const refreshMapping = await fetch(`/api/module_mappings?academic_year_id=${academic_year_id}&program_id=${programId}`);
            const result = await refreshMapping.json();
            if (!result.success) {
                throw new Error(result.message);
            }
            setModuleMappingCache(result.data);
            return result.data
        } catch (error) {
            console.error("Failed to refetch mappings:", error);
            toast.error("Failed to refresh module group mappings");
        }
    }

    //Refetch module groups (used as refreshing mechanism)
    const refreshModuleGroups = async () => {
        try {
            const res = await fetch(`/api/module_group/?program_id=${programId}`)
            const result = await res.json();
            if (!result.success) {
                throw new Error(result.message);
            }
            setModuleGroups(result.data);
        } catch (error) {
            console.error("Error refetching module groups: ", error);
            toast.error("Error refetching module groups")
        }
    }

    const handleImportRule = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.name.endsWith('.xlsx')) {
            toast.error("Please select a valid .xlsx file");
            return;
        }
    
        try {
            const res = await fetch(`/api/modules/all?academic_year_id=${academic_year_id}&mode=code`);
            const json = await res.json();
            if (!json.success) {
                toast.error("Failed to fetch valid module codes");
                return;
            }
    
            const buffer = await file.arrayBuffer();
            const result = parseRuleExcel(Buffer.from(buffer), json.data);
            setImportedRules(result);
            setImportDialogOpen(true);
        } catch (error) {
            console.error("Failed to parse rule file:", error);
            toast.error("Failed to parse Excel file. Make sure it's correctly formatted.");
        } finally {
            e.target.value = "";
        }
    };    

    const handleRuleFinalSave = async () => {
        if (!importedRules) return;
        if (importedRules.errors?.length > 0) {
            toast.error("There are errors in the imported file. Please resolve them before saving.");
            return;
        }

        setSaving(true);

        try {
            const res = await fetch('/api/rules/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  program_id: programId,
                  academic_year_id,
                  data: importedRules,
                }),
            });
            const response = await res.json();
            if (!response.success) {
                throw new Error(response.message);
            }
            toast.success("Imported rules saved successfully");
            setImportDialogOpen(false);
            setImportedRules(null);
            await refreshMappings();
            await refreshRouteRules();
            await refreshModuleGroups();
        } catch (error) {
            console.error("Failed to save imported rules:", error);
            toast.error("Failed to save imported rules");
        } finally {
            setSaving(false);
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

    const usedGroupIds = new Set(rules.map(r => r.module_group_id));

    return (
        <div className='p-8 space-y-10'>
            <div className='flex items-center justify-between mb-6'>
                <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 font-serif">
                    Configuration of Program {programTitle}
                </h1>
                <Button variant='link'className='text-blue-600 underline hover:text-blue-800 px-0' onClick={() => router.back()}>
                        Back
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <h1 className='text-3xl font-bold'>Elective Groups</h1>
                <Button variant='outline' onClick={() => setCreatingNewGroup(true)}>
                    Add Group
                </Button>
                <input type='file' accept='.xlsx' ref={fileInput} onChange={handleImportRule} className="hidden" />
                <Button variant='outline' onClick={() => fileInput.current?.click()}>
                    Import Rule
                </Button>
                <Button variant='outline' onClick={ async () => {
                    let cache = moduleMappingCache;
                    cache = await refreshMappings();
                    if (cache) {
                        exportProgramRulesToExcel(programTitle, rules, cache)
                    } else {
                        toast.error("Failed to load module mappings. Please try again.");
                    }
                }}>
                    Export Rule
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
                        ) : editingGroupId === group.id ? ( // 👈 编辑已有分组
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
                        ) : ( // 👈 正常显示已有分组
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
                                <h3 className='font-semibold mb-2'>Excluded Modules</h3>
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
                            <Button variant="default" onClick={() => handleSaveModuleMappings()}>Save</Button>
                        </div>
                    </div> 
                </div>
            )}

            
            <div className="space-y-4">
                <h1 className='text-3xl font-bold'>Routes</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(rulesByRoute).map(([routeId, { route_name, rules }]) => (
                        <div key={routeId} className="border rounded-lg p-3 bg-white shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl font-semibold">{route_name}</h2>
                                <Button
                                    variant="link"
                                    className="text-blue-600 underline hover:text-blue-800 px-0"
                                    onClick={() => {
                                        setCreatingRuleRouteId(parseInt(routeId))
                                        setNewRuleForm({ min_ects: 0, max_ects: 0, module_group_id: undefined })
                                    }}
                                >
                                    + Add Rule
                                </Button>
                            </div>
                        

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
                                {creatingRuleRouteId === parseInt(routeId) && (
                                    <div className='mt-3 space-y-2 border-t pt-3'>
                                        <div className="grid grid-cols-[1fr_100px_100px_auto] items-center gap-4 text-sm">
                                            <select className='border rounded px-2 py-1' value={newRuleForm.module_group_id ?? "" }
                                                onChange={(e) => setNewRuleForm((prev) => ({
                                                    ...prev,
                                                    module_group_id: Number(e.target.value),
                                                    }))
                                                }>
                                                <option value="">Select group</option>
                                                {moduleGroups
                                                    .filter(group => !usedGroupIds.has(group.id))
                                                    .map((group) => (
                                                        <option key={group.id} value={group.id}>
                                                            {group.name}
                                                        </option>
                                                    ))
                                                }
                                            </select>

                                            <input 
                                                type="number" 
                                                step='0.5' 
                                                placeholder="Min" 
                                                className="border px-2 py-1 rounded"
                                                value={newRuleForm.min_ects ?? ""}
                                                onChange={(e) => 
                                                    setNewRuleForm((prev) => ({
                                                        ...prev,
                                                        min_ects: parseFloat(e.target.value)
                                                    }))
                                                }
                                            />

                                            <input 
                                                type="number" 
                                                step='0.5' 
                                                placeholder="Max" 
                                                className="border px-2 py-1 rounded"
                                                value={newRuleForm.max_ects ?? ""}
                                                onChange={(e) => 
                                                    setNewRuleForm((prev) => ({
                                                        ...prev,
                                                        max_ects: parseFloat(e.target.value)
                                                    }))
                                                }
                                            />

                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setCreatingRuleRouteId(null)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => handleCreateRouteRule(parseInt(routeId))}
                                                >
                                                    Save
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {importDialogOpen && importedRules && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="relative bg-white rounded-lg p-6 max-w-3xl w-full space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-between">
                        <button
                            className="absolute top-4 right-4 text-gray-500 hover:text-black"
                            onClick={() => setImportDialogOpen(false)}
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {importedRules.errors.length > 0 ? (
                        <div className="text-red-600 space-y-1">
                            <p className="font-semibold">⚠️ Errors:</p>
                            <ul className="list-disc pl-5 text-sm">
                                {importedRules.errors.map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                        </div>
                    ) : (
                        <>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-1">Module Groups</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {Object.entries(importedRules.moduleGroups).map(([groupName, codes]) => (
                                    <div key={groupName} className="border rounded-md p-3 bg-gray-50">
                                    <h4 className="font-semibold text-gray-800 mb-1">{groupName}</h4>
                                    {codes.length > 0 ? (
                                        <ul className="list-disc pl-5 text-sm text-gray-700">
                                        {codes.map(code => <li key={code}>{code}</li>)}
                                        </ul>
                                    ) : (
                                        <p className="text-sm italic text-gray-400">No modules in this group</p>
                                    )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-1">Rules</h3>
                            <div className="space-y-4 mt-6">
                                {Object.entries(
                                    importedRules.rules.reduce((acc, rule) => {
                                        if (!acc[rule.route_name]) acc[rule.route_name] = [];
                                        acc[rule.route_name].push(rule);
                                        return acc;
                                    }, {} as Record<string, typeof importedRules.rules>)
                                ).map(([routeName, routeRules]) => (
                                    <div key={routeName} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                                        <h4 className="text-lg font-bold text-gray-900 mb-3 pb-1">{routeName}</h4>
                                        <ul className="list-disc pl-5 space-y-1.5">
                                            {routeRules.map((rule, idx) => (
                                                <li key={idx}>
                                                    <div className="grid grid-cols-[1fr_140px_120px] gap-x-5 items-center">
                                                        <span className="font-medium text-gray-900">{rule.group_name}</span>
                                                        <div className="text-left">
                                                        <span className="text-xs text-gray-500 mr-1">Min</span>
                                                        <span className="font-semibold text-gray-900">{rule.min_ects}</span>
                                                        </div>
                                                        <div className="text-left">
                                                        <span className="text-xs text-gray-500 mr-1">Max</span>
                                                        <span className="font-semibold text-gray-900">{rule.max_ects}</span>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
                            <Button variant="default" onClick={() => handleRuleFinalSave()} disabled={saving}>
                                {saving ? "Saving..." : "Confirm Import"}
                            </Button>
                        </div>
                        </>
                    )}
                </div>
            </div>
            )}
        </div>
    )
}