import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";

interface Props {
   settings: Record<string, { id: number; value: string }>;
   setSettings: React.Dispatch<React.SetStateAction<Record<string, { id: number; value: string }>>>;
}
export function SettingSection({
    settings,
    setSettings,
}: Props) {

    const updateSetting = async (key: string, value: string) => {  
        const setting = settings[key];
        if (!setting) {
            return;
        } 

        try {
            const response = await fetch(`/api/settings`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    setting_id: setting.id,
                    value,
                }),
            });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message);
            }
            setSettings((prev) => ({
                ...prev,
                [key]: { ...prev[key], value },
            }));
            toast.success("Setting updated successfully");
        } catch (error) {
            console.error("Failed to update setting:", error);
            toast.error("Failed to update setting");
        }
    }

    return (
        <div className="space-y-4">
            <h1 className="text-3xl font-bold">Settings</h1>

            <div className="w-[600px] rounded-lg border px-4 py-3 bg-white shadow-sm">
                <div className="flex items-left gap-x-3">
                    <Switch
                        id="enable-sit-in"
                        checked={settings["enable_sit_in"]?.value === "true"}
                        onCheckedChange={(checked) =>
                        updateSetting("enable_sit_in", checked ? "true" : "false")
                        }
                    />
                    <span className="text-base font-medium text-gray-900">
                        Enable &lsquo;sit-in&rsquo; option
                    </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                Allow students to mark a selection as sit-in instead of normal selection.
                </p>
            </div>
        </div>
    )
}
