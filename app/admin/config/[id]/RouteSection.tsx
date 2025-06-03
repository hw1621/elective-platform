import { Button } from "@/components/ui/button";
import { ModuleGroup, Route, Rule } from "@/types/admin_rule_types";
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
    const handleChange = (field: keyof Rule, value: string) => {
        setrouteFormData((prev) => ({
            ...prev,
            [field]: parseFloat(value),
        }))
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
            alert("Failed to save route rules")
        }
    }
    
    const handleCreateRouteRule = async (routeId: number) => {
        if (!newRuleForm.module_group_id || 
            newRuleForm.min_ects === undefined || 
            newRuleForm.max_ects === undefined
        ) {
            alert("Please complete all fields")
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
                    route_id: routeId,
                    route_name: routes.find(r => r.id === routeId)?.name ?? "",
                    module_group_id: newRuleForm.module_group_id!,
                    module_group_name: moduleGroups.find(g => g.id === newRuleForm.module_group_id)?.name ?? "",
                }
            ])
        } catch (error) {
            console.error("Failed to create rule:", error);
            alert("Failed to create rule, please try again.");
        }
    }

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

    const rulesByRoute = rules.reduce((acc, rule) => {
        if (!acc[rule.route_id]) {
          acc[rule.route_id] = {
            route_name: rule.route_name,
            rules: [],
          };
        }
        acc[rule.route_id].rules.push(rule);
        return acc;
      }, {} as Record<string, { route_name: string; rules: Rule[] }>);
    
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
                                        setNewRuleForm({ min_ects: 0, max_ects: 0, module_group_id: undefined })
                                    }}
                                >
                                    + Add Rule
                                </Button>
                            </div>
                        

                            <div className="space-y-2">
                                {matchedRules.map((rule) => (
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
                                {creatingRuleRouteId === route.id && (
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