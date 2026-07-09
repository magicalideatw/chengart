"use client";

import { Search } from "lucide-react";

type AdminSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
};

export function AdminSearchBar({
  value,
  onChange,
  resultCount,
}: AdminSearchBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="搜尋姓名…"
          className="w-full rounded-full border border-border bg-white py-3 pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
        />
      </div>
      <p className="text-sm text-muted">
        顯示 <span className="font-medium text-foreground">{resultCount}</span>{" "}
        筆結果
      </p>
    </div>
  );
}
