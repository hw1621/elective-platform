import { Button } from "@/components/ui/button";
import { ModuleGroup, Route, Rule } from "@/types/admin_rule_types";
import { RuleType } from "@/types/rule_type_enum";
import { useState } from "react";

interface Props {
    rules: Rule[];
    routes: Route[];
    setRules: React.Dispatch<React.SetStateAction<Rule[]>>;
    moduleGroups: ModuleGroup[];
    academic_year_id: number;
    programId: number;
}

export function RouteSection({
    rules,
    routes,
    setRules,
    moduleGroups,
    academic_year_id,
    programId,
}: Props) {
    const [routeFormData, setrouteFormData] = useState<Partial<Rule>>({})
    const [editingRouteRuleId, setEditingRuleId] = useState<number | null>(null);
    const [creatingRuleRouteId, setCreatingRuleRouteId] = useState<number | null>(null)
    const [newRuleForm, setNewRuleForm] = useState<Partial<Rule>>({});
    const [creatingRuleType, setCreatingRuleType] = useState<RuleType|null>(null);

    const handleRouteCancel = () => {
        setEditingRuleId(null);
        setrouteFormData({});
    }

    const handleRouteEdit = (rule: Rule) => {
        setEditingRuleId(rule.id);
        if (rule.type === RuleType.ECTS) {
            setrouteFormData({
                min_ects: rule.min_ects,
                max_ects: rule.max_ects,
            });
        } else if (rule.type === RuleType.TERM) {
            setrouteFormData({
                term: rule.term,
                max_module_count: rule.max_module_count,
            });
        }
    }

    const handleChange = (field: keyof Rule, value: string) => {
        setrouteFormData((prev) => ({
            ...prev,
            [field]: parseFloat(value),
        }))
    }

    const handleRouteSave = async (rule: Rule) => {
        try {
            let body = {}
            if (rule.type === RuleType.ECTS) {
                body = {
                    type: RuleType.ECTS,
                    rule_id: rule.id,
                    min_ects: parseFloat(routeFormData.min_ects + ""),
                    max_ects: parseFloat(routeFormData.max_ects + ""),
                }     
            } else if (rule.type === RuleType.TERM) {
                body = {
                    type: RuleType.TERM,
                    rule_id: rule.id,
                    term: routeFormData.term,
                    max_module_count: routeFormData.max_module_count,    
                }
            }
            const response = await fetch(`/api/rules`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message)
            }

            setRules((prev) => prev.map(r => r.id === rule.id ? {...r, ...getUpdatedRuleData(r, routeFormData)} : r))
            setEditingRuleId(null)
        } catch (error) {
            console.error("Failed to save route rules:", error)
            alert("Failed to save route rules")
        }
    }
    
    const handleCreateRouteRule = async (routeId: number) => {
        try {
            let body: any = {
                program_id: programId,
                route_id: routeId,
                academic_year_id,
            };
        
            if (creatingRuleType === "ECTS") {
                if (
                    !newRuleForm.module_group_id ||
                    newRuleForm.min_ects === undefined ||
                    newRuleForm.max_ects === undefined
                ) {
                    alert("Please complete all fields for ECTS Rule");
                    return;
                }

                if (newRuleForm.min_ects > newRuleForm.max_ects) {
                    alert("Min ECTS cannot be greater than Max ECTS");  
                    return;
                }
        
                body = {
                    ...body,
                    type: RuleType.ECTS,
                    module_group_id: newRuleForm.module_group_id,
                    min_ects: newRuleForm.min_ects,
                    max_ects: newRuleForm.max_ects,
                };
            } else if (creatingRuleType === "TERM") {
                if (!newRuleForm.term || newRuleForm.max_module_count === undefined) {
                    alert("Please complete all fields for Term Rule");
                    return;
                }
        
                body = {
                    ...body,
                    type: RuleType.TERM,
                    term: newRuleForm.term,
                    max_module_count: newRuleForm.max_module_count,
                };
            } else {
                alert("Please select a rule type");
                return;
            }
      
            const response = await fetch("/api/rules", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });
        
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message);
            }
        
            setCreatingRuleRouteId(null);
            setCreatingRuleType(null);
            setNewRuleForm({});
        
            setRules((prev) => [
                ...prev,
                {
                    ...result.data,
                    route_id: routeId,
                    route_name: routes.find((r) => r.id === routeId)?.name ?? "",
                    ...(creatingRuleType === "ECTS"
                        ? {
                            module_group_id: newRuleForm.module_group_id!,
                            module_group_name: moduleGroups.find((g) => g.id === newRuleForm.module_group_id)?.name ?? "",
                        }
                        : {
                            term: newRuleForm.term!,
                            max_module_count: newRuleForm.max_module_count!,
                        }),
                },
            ]);
        } catch (error) {
            console.error("Failed to create rule:", error);
            alert("Failed to create rule, please try again.");
        }
      };
      

    const handleDeleteRouteRule = async (ruleId: number) => {
        const confirmed = confirm("Are you sure you want to delete this rule?");
        if (!confirmed) {
            return;
        }
        try {   
            const response = await fetch(`/api/rules`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    rule_id: ruleId,
                }),
            });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message);
            }
            setRules((prev) => prev.filter((rule) => rule.id !== ruleId));
        } catch (error) {
            console.error("Failed to delete rule:", error);
            alert("Failed to delete rule");
        }
    }
    
    return (
        <div className="space-y-4">
            <h1 className='text-3xl font-bold'>Routes</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routes.map((route) => {
                    const matchedRules = rules.filter(r => r.route_id === route.id);
                    const usedGroupIds = new Set(matchedRules.map(r => r.module_group_id));
                    return (
                        <div key={route.id} className="border rounded-lg p-3 bg-white shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl font-semibold">{route.name}</h2>
                                <Button
                                    variant="link"
                                    className="text-blue-600 underline hover:text-blue-800 px-0"
                                    onClick={() => {
                                        setCreatingRuleRouteId(route.id)
                                        setCreatingRuleType(null)
                                        setNewRuleForm({})
                                    }}
                                >
                                    + Add Rule
                                </Button>
                            </div>
                        

                            <div className="space-y-2">
                                {matchedRules.filter(rule => rule.type === RuleType.ECTS).map((rule) => (
                                    <div key={rule.id} className="border px-3 py-2 rounded-md bg-gray-50">
                                        <div className="grid grid-cols-[1fr_120px_120px_auto] items-center gap-4 text-sm">
                                            <div className="font-medium text-gray-900">{rule.module_group_name}</div>

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
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="outline" size="sm" onClick={() => handleRouteEdit(rule)}>Edit</Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDeleteRouteRule(rule.id)}>Delete</Button>
                                            </div>
                                            </>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {matchedRules.filter(rule => rule.type === RuleType.TERM).map((rule) => (
                                    <div key={rule.id} className="border px-3 py-2 rounded-md bg-gray-50">
                                        <div className="grid grid-cols-[2fr_300px_auto] items-center gap-4 text-sm">
                                        {editingRouteRuleId === rule.id ? (
                                            <>
                                            <select
                                                className="border rounded px-2 py-1"
                                                value={routeFormData.term ?? rule.term}
                                                onChange={(e) =>
                                                    setrouteFormData((prev) => ({
                                                        ...prev,
                                                        term: e.target.value,
                                                    }))
                                                }
                                            >
                                            <option value="SP">SP</option>
                                            <option value="SUP">SUP</option>
                                            <option value='AU'>AU</option>
                                            <option value="SU">SU</option>
                                            </select>

                                            <div className="flex items-baseline space-x-2">
                                                <span className="text-sm text-gray-500">Maximum electives allowed:</span>
                                                <input
                                                type="number"
                                                value={routeFormData.max_module_count ?? rule.max_module_count}
                                                onChange={(e) =>
                                                    setrouteFormData((prev) => ({
                                                    ...prev,
                                                    max_module_count: parseInt(e.target.value),
                                                    }))
                                                }
                                                className="border px-2 py-1 rounded w-16"
                                                />
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="ghost" size="sm" onClick={handleRouteCancel}>Cancel</Button>
                                                <Button variant="default" size="sm" onClick={() => handleRouteSave(rule)}>Save</Button>
                                            </div>
                                            </>
                                        ) : (
                                            <>
                                            <div className="font-medium text-gray-900">{rule.term} Term</div>
                                            <div className="flex items-baseline space-x-2">
                                                <span className="text-sm text-gray-500">Maximum electives allowed:</span>
                                                <span className="text-lg text-gray-900 font-semibold">{rule.max_module_count}</span>
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="outline" size="sm" onClick={() => handleRouteEdit(rule)}>Edit</Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDeleteRouteRule(rule.id)}>Delete</Button>
                                            </div>
                                            </>
                                        )}
                                        </div>
                                    </div>
                                ))}

                                { /* Creat new rule and select type */}
                                {creatingRuleRouteId === route.id && creatingRuleType === null && (
                                    <div className="mt-3 space-y-2 border-t pt-3 text-sm">
                                        <div className="flex flex-wrap gap-6 items-center">
                                            <span className="text-gray-700 font-medium mr-2">Select Rule Type:</span>
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="bg-blue-100 text-blue-700 hover:bg-blue-200"
                                                onClick={() => {
                                                    setCreatingRuleType("ECTS");
                                                    setNewRuleForm({ min_ects: 0, max_ects: 0, module_group_id: undefined });
                                                }}
                                            >
                                                ECTS Rule
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="bg-green-100 text-green-700 hover:bg-green-200"
                                                onClick={() => {
                                                    setCreatingRuleType("TERM");
                                                    setNewRuleForm({ term: undefined, max_module_count: 0 });
                                                }}
                                            >
                                                Term Rule
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="ml-auto"
                                                onClick={() => {
                                                    setCreatingRuleRouteId(null);
                                                    setCreatingRuleType(null);
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                { /* Create Term Rule */ }
                                {creatingRuleRouteId === route.id && creatingRuleType === "TERM" && (
                                <div className="mt-3 space-y-2 border-t pt-3">
                                    <div className="grid grid-cols-[1fr_100px_auto] items-center gap-4 text-sm">
                                    <select
                                        className="border rounded px-2 py-1"
                                        value={newRuleForm.term ?? ""}
                                        onChange={(e) =>
                                        setNewRuleForm((prev) => ({
                                            ...prev,
                                            term: e.target.value,
                                        }))
                                        }
                                    >
                                        <option value="">Select Term</option>
                                        <option value="SP">SP</option>
                                        <option value="SUP">SUP</option>
                                        <option value='AU'>AU</option>
                                        <option value="SU">SU</option>
                                    </select>

                                    <input
                                        type="number"
                                        placeholder="Max modules"
                                        className="border px-2 py-1 rounded"
                                        value={newRuleForm.max_module_count ?? ""}
                                        onChange={(e) =>
                                            setNewRuleForm((prev) => ({
                                                ...prev,
                                                max_module_count: parseInt(e.target.value),
                                            }))
                                        }
                                    />

                                    <div className="flex space-x-2">
                                        <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setCreatingRuleRouteId(null);
                                            setCreatingRuleType(null);
                                        }}
                                        >
                                            Cancel
                                        </Button>

                                        <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => handleCreateRouteRule(route.id)}
                                        >
                                            Save
                                        </Button>
                                    </div>
                                    </div>
                                </div>
                                )}

                                {/* ECTS Rule Creation Form */}
                                {creatingRuleRouteId === route.id && creatingRuleType === RuleType.ECTS && (
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
                                                    onClick={() => handleCreateRouteRule(route.id)}
                                                >
                                                    Save
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function getUpdatedRuleData(rule: Rule, formData: Partial<Rule>): Partial<Rule> {
    switch (rule.type) {
        case RuleType.ECTS:
            return {
                min_ects: formData.min_ects!,
                max_ects: formData.max_ects!,
            };
        case RuleType.TERM:
            return {
                term: formData.term!,
                max_module_count: formData.max_module_count!,
            };
        default:
            return {};
    }
}
