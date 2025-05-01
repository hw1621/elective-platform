"use client"

import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect } from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button";

type ModuleGroup = {
    id: number;
    name: string;
    min_ects: number;
    max_ects: number;
}

type Rule = {
    id: number;
    program_id: number;
    module_group: ModuleGroup;
    module_group_id: number;
    academic_year_id: number;
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
    const [formData, setFormData] = useState<Partial<ModuleGroup>>({});
    const [editingId, setEditingId ] = useState<number | null>(null);
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
    const [moduleMappingCache, setModuleMappingCache] = useState<ModuleMappingCache | null>(null);
    const [includedModules, setIncludedModules] = useState<Module[]>([]);
    const [notIncludedModules, setNotIncludedModules] = useState<Module[]>([]);

    const params = useParams();
    const programId = Number(params.id);

    //TODO: later modify the academic_year_id to be dynamic
    const academic_year_id = 1;
    
    useEffect(() => {
        const fetchRules = async () => {
            try {
                const response = await fetch(`/api/rules/?program_id=${programId}&academic_year_id=${academic_year_id}`);
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message);
                }
                setRules(result.data);
            } catch (error) {
                console.error("Error fetching rules:", error);
            }
        };

        fetchRules();
    }, [programId]);

    const handleEdit = (rule : Rule) => {
        setEditingId(rule.id);
        setFormData({
            name: rule.module_group
    .name,
            min_ects: rule.module_group
    .min_ects,
            max_ects: rule.module_group
    .max_ects
        });
    }

    const handleCancel = () => {
        setEditingId(null);
        setFormData({});
    }

    const handleChange = (field: keyof ModuleGroup, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: field.includes("ects") ? Number(value) : value,
        }));
    }

    const handleSave = async (rule: Rule) => {
        try {
            const response = await fetch(`/api/rules`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    module_group_id: rule.module_group
            .id,
                    name: formData.name,
                    min_ects: formData.min_ects,
                    max_ects: formData.max_ects
                }),
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message);
            }
            setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, module_group: { ...r.module_group, ...formData } } : r)));
            setEditingId(null);
        } catch (error) {
            console.error("Error saving rule:", error);
            alert("Failed to save the rule. Please try again.");
        }
    }

    const handleDelete = async (rule: Rule) => {
        const confirmDelete = confirm("Are you sure you want to delete this rule?");

        if (!confirmDelete) return;
        try {
            const response = await fetch(`api/rules`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    module_group_id: rule.module_group.id,
                    rule_id: rule.id,
                }),
            });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message);
            }
            setRules((prev) => prev.filter((r) => r.id !== rule.id));
        } catch (error) {
            console.error("Error deleting rule:", error);
            alert("Failed to delete the rule. Please try again.");
        }
    }

    const handleMangeModules = async (rule: Rule) => {
        setSelectedRule(rule);

        if (!moduleMappingCache) {
            try {
                const response = await fetch(`/api/module_mappings?academic_year_id=${academic_year_id}&program_id=${programId}`);
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message);
                }

                setModuleMappingCache(result.data);
                const currentGroup = result.data.groups.find((group: GroupModules) => group.module_group_id === rule.module_group_id);
                setIncludedModules(currentGroup?.modules ?? [])
                setNotIncludedModules(result.data.notIncluded);
            } catch (error) {
                console.error("Faied to fetch module mappings:", error);
            }
        } else {
            const currentGroup = moduleMappingCache.groups.find((group: GroupModules) => group.module_group_id === rule.module_group_id);
            setIncludedModules(currentGroup?.modules ?? [])
            setNotIncludedModules(moduleMappingCache.notIncluded);
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
    
    return (
        <div className='p-8 space-y-10'>
            <h1 className="text-4xl font-semibold text-gray-900 mb-6">Config of Program {programTitle}</h1>

            <div className="flex items-center gap-4">
                <h1 className='text-3xl font-bold'>Elective Groups</h1>
                <Button variant='outline' onClick={() => router.back()}>
                    Back
                </Button>
            </div>

            <div className="space-y-4">
                {rules.map((rule, index) => (
                    <div key={rule.id} className="flex items-center space-x-4">
                        <div className="w-40 text-lg font-semibold text-gray-700">
                            Elective Group {index + 1}:
                         </div>
                        <div className="w-full">
                            <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-center border border-gray-300 rounded-lg px-6 py-4 bg-white shadow-sm hover:shadow-md transition gap-4">
                                {editingId === rule.id ? (
                                <>
                                    <input
                                        type="text"
                                        value={formData.name ?? ""}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        className="border rounded px-2 py-1"
                                    />
                                    <input
                                        type="number"
                                        value={formData.min_ects ?? ""}
                                        onChange={(e) => handleChange("min_ects", e.target.value)}
                                        className="border rounded px-2 py-1"
                                    />
                                    <input
                                        type="number"
                                        value={formData.max_ects ?? ""}
                                        onChange={(e) => handleChange("max_ects", e.target.value)}
                                        className="border rounded px-2 py-1"
                                    />

                                    <div className="flex space-x-2 justify-end">
                                        <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
                                        <Button variant="default" size="sm" onClick={() => handleSave(rule)}>Save</Button>
                                        <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleMangeModules(rule)}
                                        >
                                        Manage Modules
                                        </Button>
                                    </div>
                                    </>
                                ) : (
                                    <>
                                    <span className="text-base font-medium capitalize">{rule.module_group
                            .name}</span>
                                    <span className="text-base">Min ECTs: {rule.module_group
                            .min_ects}</span>
                                    <span className="text-base">Max ECTs: {rule.module_group
                            .max_ects}</span>

                                    <div className="flex space-x-2 justify-end">
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(rule)}>Edit</Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(rule)}>Delete</Button>
                                        <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleMangeModules(rule)}
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

            {selectedRule && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-8 w-[1200px] max-w-[90vw] space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Manage Modules for Group {selectedRule.module_group
                    .name}</h2>
                            <Button variant="ghost" onClick={() => setSelectedRule(null)}>Close</Button>
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
                            <Button variant="ghost" onClick={() => setSelectedRule(null)}>Cancel</Button>
                            <Button variant="default" >Save</Button>
                        </div>
                    </div> 
                </div>
            )}
        </div>

    )
}