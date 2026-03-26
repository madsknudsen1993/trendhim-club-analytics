"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RotateCcw } from "lucide-react";

interface FilterSidebarProps {
  startDate: string;
  endDate: string;
  countryCode: string;
  currencyCode: string;
  countries: string[];
  currencies: string[];
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onReset: () => void;
}

export function FilterSidebar({
  startDate,
  endDate,
  countryCode,
  currencyCode,
  countries,
  currencies,
  onStartDateChange,
  onEndDateChange,
  onCountryChange,
  onCurrencyChange,
  onReset,
}: FilterSidebarProps) {
  return (
    <div className="space-y-4 rounded-lg border bg-white p-4 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm text-zinc-500">Start Date</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-500">End Date</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-500">Country</label>
          <Select value={countryCode || "all"} onValueChange={onCountryChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-500">Currency</label>
          <Select
            value={currencyCode || "all"}
            onValueChange={onCurrencyChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Currencies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Currencies</SelectItem>
              {currencies.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
