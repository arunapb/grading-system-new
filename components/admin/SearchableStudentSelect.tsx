"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

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

interface Student {
  id: string;
  name: string | null;
  indexNumber: string;
}

interface SearchableStudentSelectProps {
  students: Student[];
  selectedStudentId: string;
  onSelect: (studentId: string) => void;
  disabled?: boolean;
}

export function SearchableStudentSelect({
  students,
  selectedStudentId,
  onSelect,
  disabled,
}: SearchableStudentSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Use a ref to store the button width to match popover width if needed,
  // but simpler to use a fixed reasonable width or rely on Radix if possible.
  // For now, using a fixed min-width for the popover content.

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selectedStudent
            ? `${selectedStudent.indexNumber} - ${selectedStudent.name || "No name"}`
            : "Select student..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search student..." />
          <CommandList>
            <CommandEmpty>No student found.</CommandEmpty>
            <CommandGroup>
              {students.map((student) => (
                <CommandItem
                  key={student.id}
                  value={`${student.indexNumber} ${student.name || ""}`}
                  onSelect={() => {
                    onSelect(student.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedStudentId === student.id
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {student.indexNumber} - {student.name || "No name"}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
