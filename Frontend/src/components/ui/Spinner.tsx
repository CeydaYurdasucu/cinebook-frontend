import { Loader2 } from "lucide-react";

export default function Spinner() {
    return (
        <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 text-[#3DD9B4] animate-spin" />
        </div>
    );
}