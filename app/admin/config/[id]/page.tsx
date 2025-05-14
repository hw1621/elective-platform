"use client"

import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { toast } from "react-hot-toast";
import { exportProgramRulesToExcel, parseRuleExcel } from "@/utils/parseExcelToModules";
import { fetchWithCheck } from "@/utils/fetchWithCheck";
import { ModuleGroup, ModuleMappingCache, ParsedImportRule, Rule } from "@/types/rule-types";
import React from "react";
import { ElectiveGroupSection } from "./ElectiveGroupSection";
import { RouteSection } from "./RouteSection";
import { SettingSection } from "./SettingSection";


export default function ProgramRuleConfig() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const programTitle = searchParams.get("title");

    const [rules, setRules] = useState<Rule[]>([])
    const [moduleGroups, setModuleGroups] = useState<ModuleGroup[]>([]);
    const [settings, setSettings] = useState<Record<string, { id: number; value: string }>>({});
    const [moduleMappingCache, setModuleMappingCache] = useState<ModuleMappingCache | null>(null);
    const params = useParams();
    const programId = Number(params.id);

    //Dialog for imported rules
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [importedRules, setImportedRules] = useState<ParsedImportRule | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const [saving, setSaving] = useState(false);
    

    //TODO: later modify the academic_year_id to be dynamic
    const academic_year_id = 1;
    
    useEffect(() => {
        const fetchRules = async () => {
            try {
                const data = await fetchWithCheck<Rule[]>(`/api/rules/?program_id=${programId}`);
                setRules(data);
            } catch (error) {
                console.error("Error fetching rules: ", error);
            }
        };

        fetchRules();
    }, [programId]);

    useEffect(() => {
        const fetchModuleGroups = async () => {
            try {
                const data = await fetchWithCheck<ModuleGroup[]>(`/api/module_group/?program_id=${programId}`)
                setModuleGroups(data);
            } catch (error) {
                console.error("Error fetching module groups: ", error);
                toast.error("Error fetching module groups")
            }
        };
        fetchModuleGroups();
    }, [programId])

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await fetchWithCheck<Array<{ id: number; key: string; value: string }>>(`/api/settings/?program_id=${programId}`);
                const settings = Object.fromEntries(
                    data.map((setting) => [
                        setting.key,
                        { id: setting.id, value: setting.value }
                    ])
                );

                setSettings(settings);
            } catch (error) {
                console.error("Error fetching program settings: ", error);
                toast.error("Error fetching program settings")
            };
        }
        fetchSettings();
    }, [programId]);

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
            const refreshMapping = await fetchWithCheck<ModuleMappingCache>(`/api/module_mappings?academic_year_id=${academic_year_id}&program_id=${programId}`);
            setModuleMappingCache(refreshMapping);
            return refreshMapping;
        } catch (error) {
            console.error("Failed to refetch mappings:", error);
            toast.error("Failed to refresh module group mappings");
            return null;
        }
    }

    //Refetch module groups (used as refreshing mechanism)
    const refreshModuleGroups = async () => {
        try {
            const data = await fetchWithCheck<ModuleGroup[]>(`/api/module_group/?program_id=${programId}`);
            setModuleGroups(data);
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

    return (
        <div className='p-8 space-y-10'>
            <div className='flex items-center justify-between mb-6'>
                <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 font-serif">
                    Configuration of Program {programTitle}
                </h1>

                <div className="flex gap-3">
                    <input type='file' accept='.xlsx' ref={fileInput} onChange={handleImportRule} className="hidden" />
                    <Button variant='outline' onClick={() => fileInput.current?.click()}>
                        Import Rule
                    </Button>
                    <Button
                        variant='outline'
                        onClick={async () => {
                        let cache = moduleMappingCache;
                        cache = await refreshMappings();
                        if (cache) {
                            exportProgramRulesToExcel(programTitle, rules, cache);
                        } else {
                            toast.error("Failed to load module mappings. Please try again.");
                        }
                        }}
                    >
                        Export Rule
                    </Button>
                </div>

                <Button
                        variant='link'
                        className='text-blue-600 underline hover:text-blue-800 px-0 mt-1'
                        onClick={() => router.back()}
                    >
                        Back
                </Button>
            </div>

            <ElectiveGroupSection 
                moduleGroups={moduleGroups}
                setModuleGroups={setModuleGroups}
                setRules={setRules}
                programId={programId}
                moduleMappingCache={moduleMappingCache}
                setModuleMappingCache={setModuleMappingCache}
                academic_year_id={academic_year_id}
            />

            <RouteSection
                programId={programId}
                academic_year_id={academic_year_id}
                moduleGroups={moduleGroups}
                rules={rules}
                setRules={setRules}
            />

            <SettingSection
                settings={settings}
                setSettings={setSettings}
            />

            {/* Import Rules from File */}
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