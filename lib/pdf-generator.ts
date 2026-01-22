import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatGPA } from "./gpa-calculator";

interface ModuleGrade {
  moduleCode: string;
  moduleName: string;
  credits: number;
  grade: string;
  year: string;
  semester: string;
}

interface SemesterData {
  year: string;
  semester: string;
  sgpa: number;
  credits: number;
  modules: ModuleGrade[];
}

interface StudentDetails {
  indexNumber: string;
  rank: number;
  name: string | null;
  photoUrl: string | null;
  cgpa: number;
  totalCredits: number;
  semesters: SemesterData[];
  modules: ModuleGrade[];
}

export function generateStudentPDF(student: StudentDetails) {
  const doc = new jsPDF();

  // Professional color palette
  const colors = {
    primary: [37, 99, 235] as [number, number, number],
    secondary: [99, 102, 241] as [number, number, number],
    success: [34, 197, 94] as [number, number, number],
    warning: [245, 158, 11] as [number, number, number],
    danger: [239, 68, 68] as [number, number, number],
    dark: [30, 41, 59] as [number, number, number],
    light: [248, 250, 252] as [number, number, number],
    gray: [100, 116, 139] as [number, number, number],
    border: [203, 213, 225] as [number, number, number],
  };

  let yPos = 20;

  // ==================== HEADER ====================
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, 210, 40, "F");

  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Academic Performance Report", 105, 18, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generated on ${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    105,
    26,
    { align: "center" },
  );

  doc.setDrawColor(
    colors.secondary[0],
    colors.secondary[1],
    colors.secondary[2],
  );
  doc.setLineWidth(1.5);
  doc.line(14, 34, 196, 34);

  yPos = 48;

  // ==================== STUDENT PROFILE SECTION ====================
  const hasPhoto = student.photoUrl && student.photoUrl !== "";

  // Draw profile card background
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(14, yPos, 182, 48, 3, 3, "F");
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, yPos, 182, 48, 3, 3, "S");

  const cardStartY = yPos;
  let contentX = 20;

  // Profile photo
  if (hasPhoto) {
    try {
      const photoSize = 40;
      const photoX = 20;
      const photoY = cardStartY + 4;
      doc.addImage(
        student.photoUrl!,
        "JPEG",
        photoX,
        photoY,
        photoSize,
        photoSize,
      );
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.setLineWidth(0.8);
      doc.rect(photoX, photoY, photoSize, photoSize, "S");
      contentX = 68;
    } catch (error) {
      console.error("Error adding photo:", error);
    }
  }

  // Student info - left side
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  const nameY = cardStartY + 12;

  if (student.name && student.name !== "Top Links") {
    doc.text(student.name, contentX, nameY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
    doc.text(`Index: ${student.indexNumber}`, contentX, nameY + 6);
  } else {
    doc.text(student.indexNumber, contentX, nameY);
  }

  // Additional info below name
  doc.setFontSize(8);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  const infoY = nameY + 14;
  doc.text(`Credits: ${student.totalCredits}/135`, contentX, infoY);
  doc.text(`•`, contentX + 32, infoY);
  doc.text(`Modules: ${student.modules.length}`, contentX + 36, infoY);
  doc.text(`•`, contentX + 62, infoY);

  const predictedClass =
    student.cgpa >= 3.7
      ? "First Class"
      : student.cgpa >= 3.0
        ? "Second Upper"
        : student.cgpa >= 2.0
          ? "Second Lower"
          : "Pass";
  doc.text(`Class: ${predictedClass}`, contentX + 66, infoY);

  // CGPA - top right
  const cgpaColor =
    student.cgpa >= 3.7
      ? colors.success
      : student.cgpa >= 3.0
        ? colors.primary
        : student.cgpa >= 2.0
          ? colors.warning
          : colors.danger;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
  doc.text("CGPA", 145, cardStartY + 10, { align: "center" });

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(cgpaColor[0], cgpaColor[1], cgpaColor[2]);
  doc.text(formatGPA(student.cgpa), 145, cardStartY + 22, { align: "center" });

  // Rank - top right
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
  doc.text("Rank", 178, cardStartY + 10, { align: "center" });

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(
    colors.secondary[0],
    colors.secondary[1],
    colors.secondary[2],
  );
  doc.text(`#${student.rank}`, 178, cardStartY + 22, { align: "center" });

  yPos = cardStartY + 56;

  // ==================== GRADE DISTRIBUTION ====================
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.text("Performance Summary", 14, yPos);
  yPos += 8;

  const gradeDistribution = student.modules.reduce(
    (acc: Record<string, number>, module: ModuleGrade) => {
      acc[module.grade] = (acc[module.grade] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const gradeColors: Record<string, [number, number, number]> = {
    "A+": colors.success,
    A: colors.success,
    "A-": colors.success,
    "B+": colors.primary,
    B: colors.primary,
    "B-": colors.primary,
    "C+": colors.warning,
    C: colors.warning,
    "C-": colors.warning,
    D: colors.danger,
    F: colors.danger,
    I: colors.danger,
    P: colors.success,
    N: colors.gray,
    W: colors.gray,
  };

  // Draw grade distribution in a compact table format
  const gradeOrder = [
    "A+",
    "A",
    "A-",
    "B+",
    "B",
    "B-",
    "C+",
    "C",
    "C-",
    "D",
    "I",
    "F",
    "P",
    "N",
    "W",
  ];
  const gradesToShow = gradeOrder.filter((g: string) => gradeDistribution[g]);

  doc.setFontSize(9);
  let gradeX = 14;
  let gradeY = yPos;

  gradesToShow.forEach((grade: string, index: number) => {
    const count = gradeDistribution[grade];
    const color = gradeColors[grade] || colors.gray;

    // Grade badge
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(gradeX, gradeY - 4, 12, 6, 1, 1, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(grade, gradeX + 6, gradeY, { align: "center" });

    // Count
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont("helvetica", "normal");
    doc.text(`(${count})`, gradeX + 14, gradeY);

    gradeX += 30;
    if ((index + 1) % 6 === 0) {
      gradeX = 14;
      gradeY += 8;
    }
  });

  yPos = gradeY + 10;

  // ==================== SEMESTER PERFORMANCE TABLE ====================
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.text("Semester Performance", 14, yPos);
  yPos += 5;

  const semesterTableData = student.semesters.map((sem: SemesterData) => [
    sem.year,
    `Semester ${sem.semester}`,
    formatGPA(sem.sgpa),
    sem.credits.toString(),
    sem.modules.length.toString(),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Year", "Semester", "SGPA", "Credits", "Modules"]],
    body: semesterTableData,
    theme: "striped",
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: colors.light,
    },
    styles: {
      fontSize: 8,
      halign: "center",
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 45 },
      2: { fontStyle: "bold", cellWidth: 35 },
      3: { cellWidth: 35 },
      4: { cellWidth: 32 },
    },
    margin: { left: 14, right: 14 },
  });

  // ==================== MODULE DETAILS - NEW PAGE ====================
  doc.addPage();

  // Header on new page
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, 210, 28, "F");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Detailed Module Grades", 105, 16, { align: "center" });

  yPos = 38;

  // Group modules by semester
  const modulesBySemester: Record<string, ModuleGrade[]> = {};
  student.modules.forEach((module: ModuleGrade) => {
    const key = `${module.year}|${module.semester}`;
    if (!modulesBySemester[key]) {
      modulesBySemester[key] = [];
    }
    modulesBySemester[key].push(module);
  });

  const sortedSemesterKeys = Object.keys(modulesBySemester).sort();

  // Print modules by semester
  sortedSemesterKeys.forEach((key) => {
    const [year, semester] = key.split("|");
    const modules = modulesBySemester[key];

    if (yPos > 245) {
      doc.addPage();
      yPos = 20;
    }

    // Semester header
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.roundedRect(14, yPos - 3, 182, 9, 2, 2, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.text(`${year} - Semester ${semester}`, 18, yPos + 2);

    const semGPA =
      student.semesters.find(
        (s: SemesterData) => s.year === year && s.semester === semester,
      )?.sgpa || 0;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
    doc.text(`SGPA: ${formatGPA(semGPA)}`, 170, yPos + 2);

    yPos += 8;

    const moduleTableData = modules.map((mod: ModuleGrade) => [
      mod.moduleCode,
      mod.moduleName,
      mod.credits.toString(),
      mod.grade,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Code", "Module Name", "Credits", "Grade"]],
      body: moduleTableData,
      theme: "plain",
      headStyles: {
        fillColor: colors.dark,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 2,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: "bold" },
        1: { cellWidth: 112 },
        2: { cellWidth: 18, halign: "center" },
        3: {
          cellWidth: 18,
          halign: "center",
          fontStyle: "bold",
        },
      },
      margin: { left: 14, right: 14 },
      didParseCell: function (data) {
        if (data.column.index === 3 && data.section === "body") {
          const grade = data.cell.raw as string;
          const color = gradeColors[grade] || colors.gray;
          data.cell.styles.textColor = color;
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;
  });

  // ==================== FOOTER ON ALL PAGES ====================
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.3);
    doc.line(14, 282, 196, 282);

    doc.setFontSize(7);
    doc.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
    doc.setFont("helvetica", "normal");
    doc.text("Academic Performance Report", 14, 286);
    doc.text(`Page ${i} of ${pageCount}`, 105, 286, { align: "center" });
    doc.text(student.indexNumber, 196, 286, { align: "right" });
  }

  // Save the PDF
  const fileName =
    student.name && student.name !== "Top Links"
      ? `${student.name.replace(/\s+/g, "_")}_Academic_Report.pdf`
      : `${student.indexNumber}_Academic_Report.pdf`;

  doc.save(fileName);
}
