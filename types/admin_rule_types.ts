import { RuleType } from "./rule_type_enum";

export type Rule = {
    id: number;
    program_id: number;
    module_group_name: string;
    module_group_id: number;
    academic_year_id: number;
    route_id: number,
    route_name: string,
    min_ects: number,
    max_ects: number,
    term: string,
    max_module_count: number,
    type: RuleType,
}

export type Route = {
    id: number,
    name: string
}

export type ModuleGroup = {
    id: number;
    name: string;
    program_id: number;
}

export type Module = {
    id: number;
    code: string;
    title: string;
    ects: number;
    allow_sit_in: boolean;
}

export type GroupModules = {
    module_group_id: number;
    module_group_name: string;
    modules: Module[];
}

export type ModuleMappingCache = {
    groups: GroupModules[];
    notIncluded: Module[];
}

export type ParsedImportRule = {
    moduleGroups: Record<string, string[]>;
    rules: {
        route_name: string,
        group_name: string,
        min_ects: number,
        max_ects: number,
    }[];
    errors: string[];
}

export type CreateRulePayload = ECTSRuleCreationPayload | TermRuleCreationPayload;

export interface ECTSRulePayload {
    rule_id: number;
    min_ects: number;
    max_ects: number;
}
  
export interface TermRulePayload {
    rule_id: number;
    term: string;
    max_module_count: number;
}
  
export interface ECTSRuleCreationPayload {
    program_id: number;
    route_id: number;
    academic_year_id: number;
    module_group_id: number;
    min_ects: number;
    max_ects: number;
    type: RuleType
}
  
export interface TermRuleCreationPayload {
    program_id: number;
    route_id: number;
    academic_year_id: number;
    term: string;
    max_module_count: number;
    type: RuleType;
}
