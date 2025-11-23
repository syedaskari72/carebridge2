import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ""
});

export async function getChatResponse(message: string, userType: string, userId?: string) {
  try {
    // Fetch patient medical data if user is a patient
    let patientContext = "";
    let patientData: any = null;
    
    if (userType === "PATIENT" && userId) {
      try {
        const { prisma } = await import('@/lib/prisma');
        patientData = await prisma.patient.findFirst({
          where: { userId },
          include: {
            prescriptions: {
              where: { isActive: true },
              include: { doctor: { include: { user: true } } },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
            treatmentLogs: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
            bookings: {
              where: { status: { in: ['COMPLETED', 'IN_PROGRESS'] } },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        });
        
        if (patientData) {
          patientContext = `\n\nPatient Medical Profile:\n`;
          patientContext += `- Blood Type: ${patientData.bloodType || 'Not specified'}\n`;
          patientContext += `- Allergies: ${patientData.allergies?.join(', ') || 'None recorded'}\n`;
          patientContext += `- Current Medications: ${patientData.medications?.join(', ') || 'None'}\n`;
          patientContext += `- Medical Conditions: ${patientData.medicalConditions?.join(', ') || 'None recorded'}\n`;
          
          if (patientData.prescriptions?.length > 0) {
            patientContext += `\nActive Prescriptions:\n`;
            patientData.prescriptions.forEach((p: any) => {
              patientContext += `- ${p.diagnosis} (prescribed by Dr. ${p.doctor.user.name})\n`;
            });
          }
          
          if (patientData.treatmentLogs?.length > 0) {
            patientContext += `\nRecent Treatments: ${patientData.treatmentLogs.length} treatments recorded\n`;
          }
        }
      } catch (e) {
        console.error('Error fetching patient data:', e);
      }
    }
    
    // Get available nurses if user is asking about booking
    let nursesContext = "";
    let nursesData: any[] = [];
    if (message.toLowerCase().includes('book') || message.toLowerCase().includes('nurse') || message.toLowerCase().includes('recommend')) {
      try {
        const { prisma } = await import('@/lib/prisma');
        const nurses = await prisma.nurse.findMany({
          where: { 
            isVerified: true,
            isAvailable: true,
          },
          include: {
            user: { select: { name: true, gender: true } },
          },
          orderBy: { rating: 'desc' },
        });
        
        nursesData = nurses;
        if (nurses.length > 0) {
          nursesContext = `\n\nAvailable Nurses on CareBridge:\n${nurses.map(n => 
            `- ${n.user.name} (${n.specialties.join(', ')}) - ${n.experience} experience - Rating: ${n.rating}/5 - Rate: PKR ${n.hourlyRate}/hr - Department: ${n.department}`
          ).join('\n')}`;
        }
      } catch (e) {
        console.error('Error fetching nurses:', e);
      }
    }

    const systemPrompt = `You are CareBridge Medical AI Assistant, a specialized healthcare support system integrated with the CareBridge healthcare platform.

Your Role:
- Provide accurate, evidence-based medical information
- Help users understand health conditions and symptoms
- Guide on when to seek professional medical care
- Recommend nurses from our platform based on user needs and medical history
- Offer medication information and health tips
- Assist with booking healthcare services

Important Guidelines:
1. ONLY answer medical and healthcare-related questions
2. For non-medical queries, politely redirect to health topics
3. When recommending nurses, consider:
   - Patient's medical conditions and allergies
   - Current medications and prescriptions
   - Required specialties based on patient needs
   - Nurse experience level matching condition complexity
   - Department expertise (e.g., CARDIOLOGY for heart issues)
4. Use natural, conversational language - NO markdown symbols like ** or *
5. Format with clear paragraphs and bullet points
6. Be empathetic and supportive
7. Never provide definitive diagnoses - only general information
8. Always suggest consulting healthcare professionals for serious concerns
9. When patient has specific conditions, prioritize nurses with relevant specialties

User Type: ${userType === "PATIENT" ? "Patient seeking health information" : "Healthcare professional (Nurse/Doctor)"}${patientContext}${nursesContext}

Provide helpful, natural responses without any markdown formatting.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      max_tokens: 1000,
    });

    let text = chatCompletion.choices[0]?.message?.content || "I couldn't generate a response.";
    
    // Clean and format the response
    text = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .split('\n\n') // Split paragraphs
      .map(para => {
        // Handle bullet points
        if (para.includes('\n- ') || para.includes('\n* ')) {
          const items = para.split(/\n[\-\*] /).filter(i => i.trim());
          return '<ul>' + items.map(item => `<li>${item.trim()}</li>`).join('') + '</ul>';
        }
        // Handle numbered lists
        if (/\n\d+\./.test(para)) {
          const items = para.split(/\n\d+\.\s/).filter(i => i.trim());
          return '<ol>' + items.map(item => `<li>${item.trim()}</li>`).join('') + '</ol>';
        }
        return `<p>${para.trim()}</p>`;
      })
      .join('')
      .trim();
    
    // If asking for nurse recommendation and we have nurses, find best match
    if (nursesData.length > 0 && (message.toLowerCase().includes('recommend') || message.toLowerCase().includes('suggest'))) {
      let bestNurse = nursesData[0];
      
      // Smart matching based on patient data
      if (patientData) {
        const conditions = patientData.medicalConditions || [];
        const messageLower = message.toLowerCase();
        
        // Match by specialty/department
        for (const nurse of nursesData) {
          let score = nurse.rating * 10; // Base score from rating
          
          // Boost score for experience (parse years)
          const expMatch = nurse.experience.match(/(\d+)/);
          if (expMatch) score += parseInt(expMatch[1]) * 2;
          
          // Boost for specialty match
          const specialtiesLower = nurse.specialties.map((s: string) => s.toLowerCase());
          const deptLower = nurse.department.toLowerCase();
          
          // Check if patient conditions match nurse specialties
          conditions.forEach((condition: string) => {
            const condLower = condition.toLowerCase();
            if (specialtiesLower.some((s: string) => condLower.includes(s) || s.includes(condLower))) {
              score += 20;
            }
            if (deptLower.includes(condLower) || condLower.includes(deptLower)) {
              score += 15;
            }
          });
          
          // Check message keywords
          if (messageLower.includes('heart') || messageLower.includes('cardiac')) {
            if (deptLower === 'cardiology' || specialtiesLower.includes('cardiology')) score += 25;
          }
          if (messageLower.includes('child') || messageLower.includes('baby')) {
            if (deptLower === 'pediatrics' || specialtiesLower.includes('pediatrics')) score += 25;
          }
          if (messageLower.includes('emergency') || messageLower.includes('urgent')) {
            if (deptLower === 'emergency' || specialtiesLower.includes('emergency')) score += 25;
          }
          if (messageLower.includes('elderly') || messageLower.includes('senior')) {
            if (specialtiesLower.includes('geriatric') || specialtiesLower.includes('elderly')) score += 25;
          }
          
          // Update best nurse if score is higher
          if (score > (bestNurse as any).matchScore || !(bestNurse as any).matchScore) {
            (nurse as any).matchScore = score;
            bestNurse = nurse;
          }
        }
      }
      
      return { 
        success: true, 
        message: text,
        nurseRecommendation: {
          id: bestNurse.id,
          name: bestNurse.user.name,
          gender: bestNurse.user.gender,
          department: bestNurse.department,
          specialties: bestNurse.specialties,
          rating: bestNurse.rating,
          hourlyRate: bestNurse.hourlyRate,
          location: bestNurse.location,
          isAvailable: bestNurse.isAvailable,
        }
      };
    }
    
    return { success: true, message: text };
  } catch (error: any) {
    console.error("Groq API error:", error);
    return { 
      success: true, 
      message: "I apologize, but I'm having trouble processing your request right now. Please try asking your question in a different way, or contact our support team for immediate assistance." 
    };
  }
}
