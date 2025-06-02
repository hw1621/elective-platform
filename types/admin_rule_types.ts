export type Rule = {
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
