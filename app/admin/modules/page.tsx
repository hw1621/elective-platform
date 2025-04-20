'use client';
import { useEffect, useState } from "react";

type Module = {
    id: number;
    code: string;
    lecturer: string;
    department: string;
    employee_type: string;
    subject_area: string;
    lead_program: string;
    eligible_cohorts: string;
    term: string;
    role: string;
    file_name: string;
    title: string;
    brief_description: string;
    ects: number;
    cats: number;
    FHEQ_level: string;
    delivery_mode: string;
    learning_outcome: string;
    module_content: string;
    learn_teach_approach: string;
    assessment: string;
    leading_list: string;
    suite: string;
}