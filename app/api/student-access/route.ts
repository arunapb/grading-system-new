import { NextRequest, NextResponse } from "next/server";
import {
  validateInvitation,
  incrementInvitationUse,
} from "@/lib/db/invitation.service";
import { getStudentDetails } from "@/lib/db/student.service";

/**
 * Parse user agent string to extract device, OS, and browser info
 */
function parseUserAgent(userAgent: string): {
  device: string;
  os: string;
  browser: string;
} {
  let device = "Desktop";
  let os = "Unknown";
  let browser = "Unknown";

  // Detect device type
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
    device = /iPad|Tablet/i.test(userAgent) ? "Tablet" : "Mobile";
  }

  // Detect OS
  if (/Windows NT/i.test(userAgent)) {
    os = "Windows";
  } else if (/Macintosh|Mac OS X/i.test(userAgent)) {
    os = "macOS";
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    os = "iOS";
  } else if (/Android/i.test(userAgent)) {
    os = "Android";
  } else if (/Linux/i.test(userAgent)) {
    os = "Linux";
  }

  // Detect browser
  if (/Edg\//i.test(userAgent)) {
    browser = "Edge";
  } else if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) {
    browser = "Chrome";
  } else if (/Firefox/i.test(userAgent)) {
    browser = "Firefox";
  } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
    browser = "Safari";
  } else if (/Opera|OPR/i.test(userAgent)) {
    browser = "Opera";
  }

  return { device, os, browser };
}

// POST - Validate invitation code and return student data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Invitation code is required" },
        { status: 400 },
      );
    }

    const result = await validateInvitation(code.toUpperCase());

    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const invitation = result.invitation!;
    const student = invitation.student;

    // Get IP address and user agent from headers
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : request.headers.get("x-real-ip") || "Unknown";
    const userAgent = request.headers.get("user-agent") || "Unknown";
    const { device, os, browser } = parseUserAgent(userAgent);

    // Increment use count with tracking data
    await incrementInvitationUse(invitation.id, {
      ipAddress,
      userAgent,
      device,
      os,
      browser,
    });

    // Get full student details with grades
    const studentDetails = await getStudentDetails(
      student.indexNumber,
      student.degree.batch.name,
      student.degree.name,
    );

    return NextResponse.json({
      success: true,
      student: studentDetails,
      remainingTime: result.remainingTime,
      expiresAt: invitation.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Error validating invitation:", error);
    return NextResponse.json(
      { error: "Failed to validate invitation" },
      { status: 500 },
    );
  }
}
