import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log("[Debug][test-auth] Testing credentials", { email });
    
    // Test database connection
    const userCount = await prisma.user.count();
    console.log("[Debug][test-auth] Total users in DB:", userCount);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        patient: true,
        nurse: true,
        doctor: true,
        admin: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found",
        userCount 
      });
    }
    
    console.log("[Debug][test-auth] User found", {
      id: user.id,
      email: user.email,
      userType: user.userType,
      hasPassword: !!user.password
    });
    
    if (!user.password) {
      return NextResponse.json({ 
        success: false, 
        error: "User has no password",
        user: { id: user.id, email: user.email, userType: user.userType }
      });
    }
    
    // Test password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    console.log("[Debug][test-auth] Password test result", { isPasswordValid });
    
    return NextResponse.json({
      success: isPasswordValid,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        hasPassword: !!user.password,
        passwordValid: isPasswordValid
      }
    });
    
  } catch (error) {
    console.error("[Debug][test-auth] Error", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
