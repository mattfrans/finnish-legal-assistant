import { Scale } from "lucide-react";

export function Header() {
  return (
    <header className="h-16 border-b flex items-center px-6 bg-white shadow-sm">
      <div className="flex items-center gap-2">
        <Scale className="h-6 w-6" />
        <h1 className="text-xl font-semibold">Finnish Legal Assistant</h1>
      </div>
    </header>
  );
}
