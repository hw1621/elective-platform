"use client"

import { useParams } from "next/navigation";
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

export default function ProgramRuleConfig() {
    const router = useRouter();
    const [rules, setRules] = useState<Rule[]>([])
    const [formData, setFormData] = useState<Partial<ModuleGroup>>({});
    const [editingId, setEditingId ] = useState<number | null>(null);
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
            name: rule.module_group.name,
            min_ects: rule.module_group.min_ects,
            max_ects: rule.module_group.max_ects
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
                    module_group_id: rule.module_group.id,
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
    
    return (
        <div className='p-8 space-y-10'>
            <div className="flex justfiy-between items-center">
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
                                        onClick={() => router.push(`/admin/config/${programId}/rules/${rule.id}`)}
                                        >
                                        Manage Modules
                                        </Button>
                                    </div>
                                    </>
                                ) : (
                                    <>
                                    <span className="text-base font-medium capitalize">{rule.module_group.name}</span>
                                    <span className="text-base">Min ECTs: {rule.module_group.min_ects}</span>
                                    <span className="text-base">Max ECTs: {rule.module_group.max_ects}</span>

                                    <div className="flex space-x-2 justify-end">
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(rule)}>Edit</Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleEdit(rule)}>Delete</Button>
                                        <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push(`/admin/config/${programId}/rules/${rule.id}`)}
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
        </div>

    )
}