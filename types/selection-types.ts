export type Module = {
    id: number,
    code: string,
    title: string,
    ects: number | null,
    term: string,
    allow_sit_in: boolean,
}

export type Rule = {
    min_ects: number | null;
    max_ects: number | null;
    module_group_id: number;
    module_group_name: string;
    modules: Module[];
};

export type RouteData = {
    route_id: number;
    route_name: string;
    rules: Rule[];
};