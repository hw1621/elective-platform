// import DatePicker from 'react-datepicker';
// import "react-datepicker/dist/react-datepicker.css";
'use client';
import { TextField } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useState } from "react";


export function TimeSettingRow({
    label,
    settingKey,
    relatedKey,
    relation,
    settings, 
    updateSetting,
}: {
    label: string;
    settingKey: string;
    relatedKey: string;
    relation: 'before' | 'after'
    settings: Record<string, { id: number; value: string }>;
    updateSetting: (key: string, value: string) => Promise<void>;
}) {

    const rawValue = settings[settingKey]?.value;
    const [date, setDate] = useState<Date | null>(
        rawValue ? new Date(rawValue) : null
    );
    const relatedValue = settings[relatedKey]?.value;
    const relatedDate = new Date(relatedValue);

    const pickerProps = relation === 'before' ? {
        maxDate: relatedDate,
    } : {
        minDate: relatedDate,
    };

    const handleChange = async (newDate: Date | null) => {
        if (!newDate) return;

        if (relation === 'before' && newDate > relatedDate) {
            alert(`The ${label} must be before the ${relatedKey!.replaceAll('_', ' ')}`);
            return;
        }
        if (relation === 'after' && newDate < relatedDate) {
            alert(`The ${label} must be after the ${relatedKey!.replaceAll('_', ' ')}`);
            return;
        }

        const iso = newDate.toISOString();
        await updateSetting(settingKey, iso);
        setDate(newDate);
    }

    return (
        <div className="flex items-center gap-4 py-2">
            <div className="w-40 shrink-0 text-m font-medium text-black">
                {label}:
            </div>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                    value={date}
                    onChange={handleChange}
                    ampm={false}
                    enableAccessibleFieldDOMStructure={false}
                    {...pickerProps}
                    slots={{ textField: TextField }}
                    slotProps={{
                        textField: {
                        size: "small",
                        sx: { width: 220 },
                        },
                    }}
                />
            </LocalizationProvider>
        </div>
    )
}