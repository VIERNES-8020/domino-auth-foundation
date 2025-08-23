import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Agent {
  id: string;
  full_name: string;
  agent_code: string;
}

interface AgentSearchSelectorProps {
  agents: Agent[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  defaultOption?: {
    value: string;
    label: string;
  };
}

export function AgentSearchSelector({ 
  agents, 
  value, 
  onValueChange, 
  placeholder = "Buscar agente...",
  defaultOption = {
    value: "default",
    label: "Agente asignado a la propiedad"
  }
}: AgentSearchSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const allOptions = [
    { ...defaultOption, searchText: defaultOption.label.toLowerCase() },
    ...agents.map(agent => ({
      value: agent.agent_code,
      label: `${agent.full_name} - ${agent.agent_code}`,
      searchText: `${agent.full_name} ${agent.agent_code}`.toLowerCase()
    }))
  ];

  const filteredOptions = allOptions.filter(option => {
    if (!searchValue) return true;
    const search = searchValue.toLowerCase();
    return (
      option.label.toLowerCase().includes(search) ||
      option.searchText.includes(search)
    );
  });

  const selectedOption = allOptions.find(option => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Buscar por nombre o código..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No se encontraron agentes.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                    setSearchValue("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    {option.value !== "default" && (
                      <div className="text-sm text-muted-foreground">
                        Código: {option.value}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}