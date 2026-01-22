"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useScrapedBatches } from "@/hooks/admin.hooks";
import { useStructure } from "@/hooks/structure.hooks";
import { toast } from "sonner";
import { Loader2, BookOpen, Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface Module {
  id: string;
  code: string;
  name: string;
  credits: number;
}

interface Student {
  id: string;
  name: string;
  indexNumber: string;
  existingModuleIds: string[];
}

export default function AssignmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // --- Filtering State ---
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedDegree, setSelectedDegree] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");

  // --- Data State ---
  const { data: batches, isLoading: loadingBatches } = useScrapedBatches();
  const { data: structure, isLoading: loadingStructure } = useStructure(
    selectedBatch || null,
  );

  const [modules, setModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // --- Selection State ---
  const [selectedModuleIds, setSelectedModuleIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set(),
  );

  // --- Search State ---
  const [studentSearch, setStudentSearch] = useState("");
  const debouncedStudentSearch = useDebounce(studentSearch, 300);

  // --- Permissions Check ---
  const user = session?.user as any;
  const canAssign = user?.role === "SUPER_ADMIN" || user?.canAssignModules;

  // --- Derived State for Filters ---
  const degrees = useMemo(() => structure?.degrees || [], [structure]);

  const semesters = useMemo(() => {
    if (!structure || !selectedDegree) return [];
    const degreeData = structure.degrees.find((d) => d.id === selectedDegree);
    if (!degreeData) return [];
    // Flatten years -> semesters with Year info
    return degreeData.years.flatMap((y) =>
      y.semesters.map((s) => ({
        id: s.id,
        name: s.name,
        displayName: `${y.name} - ${s.name}`,
      })),
    );
  }, [structure, selectedDegree]);

  // --- Effects ---

  // 1. Fetch Modules when Semester changes
  useEffect(() => {
    if (selectedBatch && selectedDegree && selectedSemester) {
      fetchModules();
    } else {
      setModules([]);
      setSelectedModuleIds(new Set());
    }
  }, [selectedBatch, selectedDegree, selectedSemester]);

  // 2. Fetch Students
  useEffect(() => {
    if (
      selectedBatch &&
      selectedDegree &&
      selectedSemester &&
      selectedModuleIds.size > 0
    ) {
      fetchStudents();
    } else {
      setStudents([]);
      setSelectedStudentIds(new Set());
    }
  }, [selectedBatch, selectedDegree, selectedSemester, selectedModuleIds]);

  // --- Fetchers ---

  const fetchModules = async () => {
    setLoadingModules(true);
    try {
      const response = await fetch(
        `/api/admin/modules?semesterId=${encodeURIComponent(selectedSemester)}`,
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.modules)) {
          setModules(data.modules);
        } else if (Array.isArray(data)) {
          setModules(data);
        } else if (data.modules && Array.isArray(data.modules)) {
          setModules(data.modules);
        } else {
          setModules([]);
        }
        setSelectedModuleIds(new Set());
      } else {
        console.error("Failed to fetch modules:", await response.text());
        setModules([]);
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
      toast.error("Failed to fetch modules");
    } finally {
      setLoadingModules(false);
    }
  };

  const fetchStudents = async () => {
    if (selectedModuleIds.size === 0) return;

    setLoadingStudents(true);
    try {
      const moduleIdsParam = Array.from(selectedModuleIds).join(",");
      const response = await fetch(
        `/api/admin/assign-modules?semesterId=${selectedSemester}&moduleIds=${moduleIdsParam}`,
      );

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to fetch students");
    } finally {
      setLoadingStudents(false);
    }
  };

  // --- Handlers ---

  const handleToggleModule = (moduleId: string) => {
    const newSet = new Set(selectedModuleIds);
    if (newSet.has(moduleId)) {
      newSet.delete(moduleId);
    } else {
      newSet.add(moduleId);
    }
    setSelectedModuleIds(newSet);
  };

  const handleToggleStudent = (studentId: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setSelectedStudentIds(newSet);
  };

  const handleAssign = async () => {
    if (selectedModuleIds.size === 0 || selectedStudentIds.size === 0) return;

    const toastId = toast.loading("Assigning modules...");

    try {
      const response = await fetch("/api/admin/assign-modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleIds: Array.from(selectedModuleIds),
          studentIds: Array.from(selectedStudentIds),
          semesterId: selectedSemester,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(
          `Successfully assigned modules to ${data.assignedCount ?? selectedStudentIds.size} student(s)`,
          { id: toastId },
        );
        fetchStudents();
        setSelectedStudentIds(new Set());
      } else {
        toast.error(data.error || "Failed to assign", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error evaluating assignment", { id: toastId });
    }
  };

  // --- Filtering & Separation ---
  const { eligibleStudents, enrolledStudents } = useMemo(() => {
    const eligible: Student[] = [];
    const enrolled: Student[] = [];

    let filtered = students;
    if (studentSearch) {
      const lower = studentSearch.toLowerCase();
      filtered = students.filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          s.indexNumber.toLowerCase().includes(lower),
      );
    }

    filtered.forEach((s) => {
      if (selectedModuleIds.size === 0) {
        eligible.push(s);
        return;
      }
      const existingCount = Array.from(selectedModuleIds).filter((mid) =>
        s.existingModuleIds.includes(mid),
      ).length;
      const isFull = existingCount === selectedModuleIds.size;

      if (isFull) {
        enrolled.push(s);
      } else {
        eligible.push(s);
      }
    });

    eligible.sort((a, b) => a.indexNumber.localeCompare(b.indexNumber));
    enrolled.sort((a, b) => a.indexNumber.localeCompare(b.indexNumber));

    return { eligibleStudents: eligible, enrolledStudents: enrolled };
  }, [students, studentSearch, selectedModuleIds]);

  const handleToggleAllEligible = () => {
    if (
      eligibleStudents.length > 0 &&
      selectedStudentIds.size === eligibleStudents.length
    ) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(eligibleStudents.map((s) => s.id)));
    }
  };

  if (session && !canAssign) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>You do not have permission.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Module Assignments
          </h1>
          <p className="text-muted-foreground mt-1">
            Assign modules to students by batch and semester.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 flex-1">
        {/* Left Panel: Configuration */}
        <div className="md:col-span-4 lg:col-span-3 space-y-6 flex flex-col overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Batch</Label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches?.map((b) => (
                      <SelectItem key={b.batch} value={b.batch}>
                        {b.batch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Degree</Label>
                <Select
                  value={selectedDegree}
                  onValueChange={(val) => {
                    setSelectedDegree(val);
                    setSelectedSemester("");
                  }}
                  disabled={!selectedBatch}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Degree" />
                  </SelectTrigger>
                  <SelectContent>
                    {degrees.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Semester</Label>
                <Select
                  value={selectedSemester}
                  onValueChange={setSelectedSemester}
                  disabled={!selectedDegree}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="shrink-0">
              <CardTitle>Modules</CardTitle>
              <CardDescription>Select modules to assign</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 px-4 pb-4">
              {loadingModules ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                </div>
              ) : modules.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground p-4">
                  {!selectedSemester
                    ? "Select a semester first."
                    : "No modules found."}
                </p>
              ) : (
                <ScrollArea className="h-[300px] md:h-full pr-4">
                  <div className="space-y-2">
                    {modules.map((module) => (
                      <label
                        key={module.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedModuleIds.has(module.id)
                            ? "bg-primary/5 border-primary"
                            : "hover:bg-muted border-transparent"
                        }`}
                      >
                        <Checkbox
                          checked={selectedModuleIds.has(module.id)}
                          onCheckedChange={() => handleToggleModule(module.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-primary">
                              {module.code}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {module.credits} Credits
                            </Badge>
                          </div>
                          <p className="text-sm font-medium mt-1 leading-none">
                            {module.name}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Student Selection */}
        <div className="md:col-span-8 lg:col-span-9 flex flex-col min-h-0 h-full space-y-4">
          {selectedModuleIds.size === 0 ? (
            <Card className="h-full flex items-center justify-center border-dashed">
              <div className="text-center space-y-2">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="text-lg font-medium">Select Modules First</h3>
                <p className="text-muted-foreground">
                  Select one or more modules to view eligible students.
                </p>
              </div>
            </Card>
          ) : (
            <Card className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between gap-4 shrink-0">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    className="pl-8"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
              </div>

              <Tabs
                defaultValue="eligible"
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="px-4 pt-2 flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="eligible">
                      Eligible ({eligibleStudents.length})
                    </TabsTrigger>
                    <TabsTrigger value="enrolled">
                      Already Enrolled ({enrolledStudents.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Assign Button (Only visible/active depending on context, effectively global for eligible) */}
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground hidden sm:block">
                      {selectedStudentIds.size} selected
                    </div>
                    <Button
                      onClick={handleAssign}
                      size="sm"
                      disabled={selectedStudentIds.size === 0}
                    >
                      Assign
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden p-0 relative">
                  {loadingStudents && (
                    <div className="absolute inset-0 z-20 bg-background/50 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  <TabsContent
                    value="eligible"
                    className="h-full mt-0 overflow-auto border-t"
                  >
                    {eligibleStudents.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No eligible students found.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader className="bg-background sticky top-0 z-10">
                          <TableRow>
                            <TableHead className="w-[50px]">
                              <Checkbox
                                checked={
                                  eligibleStudents.length > 0 &&
                                  selectedStudentIds.size ===
                                    eligibleStudents.length
                                }
                                onCheckedChange={handleToggleAllEligible}
                              />
                            </TableHead>
                            <TableHead>Index</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {eligibleStudents.map((student) => {
                            const existingCount = Array.from(
                              selectedModuleIds,
                            ).filter((mid) =>
                              student.existingModuleIds.includes(mid),
                            ).length;
                            return (
                              <TableRow key={student.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedStudentIds.has(student.id)}
                                    onCheckedChange={() =>
                                      handleToggleStudent(student.id)
                                    }
                                  />
                                </TableCell>
                                <TableCell className="font-mono">
                                  {student.indexNumber}
                                </TableCell>
                                <TableCell>{student.name}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="text-amber-600 border-amber-200"
                                  >
                                    {existingCount > 0
                                      ? `Partial (${existingCount}/${selectedModuleIds.size})`
                                      : "Not Enrolled"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>

                  <TabsContent
                    value="enrolled"
                    className="h-full mt-0 overflow-auto border-t"
                  >
                    {enrolledStudents.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No enrolled students found.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader className="bg-background sticky top-0 z-10">
                          <TableRow>
                            <TableHead>Index</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {enrolledStudents.map((student) => (
                            <TableRow key={student.id} className="opacity-75">
                              <TableCell className="font-mono">
                                {student.indexNumber}
                              </TableCell>
                              <TableCell>{student.name}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className="text-green-600 bg-green-50 border-green-200"
                                >
                                  Enrolled
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
