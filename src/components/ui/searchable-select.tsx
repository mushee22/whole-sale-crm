import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "../../lib/utils"
import { Input } from "./input"

export interface SearchableSelectOption {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    emptyText?: string;
    className?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select option...",
    emptyText = "No option found.",
    className,
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const wrapperRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false)
                setSearch("") // Clear search when closing
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const selectedOption = options.find((opt) => opt.value === value)
    
    // Filter options based on local search
    const filteredOptions = React.useMemo(() => {
        if (!search) return options
        return options.filter(opt => 
            opt.label.toLowerCase().includes(search.toLowerCase())
        )
    }, [options, search])

    const handleSelect = (optionValue: string) => {
        onChange(optionValue)
        setOpen(false)
        setSearch("")
    }

    return (
        <div className={cn("relative w-full", className)} ref={wrapperRef}>
            <div className="relative">
                {/* Search Icon if no value, or if searching */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                </div>
                
                <Input
                    className="pl-9 pr-10 bg-white"
                    placeholder={selectedOption ? selectedOption.label : placeholder}
                    value={open ? search : (selectedOption ? selectedOption.label : "")}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setOpen(true)
                    }}
                    onFocus={() => {
                        setOpen(true)
                        setSearch("") // Clear display text to show placeholder/search as you type
                    }}
                />
                
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronsUpDown className="h-4 w-4 text-gray-400 opacity-50" />
                </div>
            </div>

            {open && (
                <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-y-auto">
                    {filteredOptions.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            {emptyText}
                        </div>
                    ) : (
                        <ul className="py-1">
                            {filteredOptions.map((option) => (
                                <li
                                    key={option.value}
                                    className={cn(
                                        "px-4 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-slate-100",
                                        value === option.value && "bg-slate-50 font-medium"
                                    )}
                                    // Use onMouseDown to trigger BEFORE focus leaves input
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        handleSelect(option.value)
                                    }}
                                >
                                    <span className="text-slate-900">{option.label}</span>
                                    {value === option.value && (
                                        <Check className="h-4 w-4 text-emerald-600" />
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}
