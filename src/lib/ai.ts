import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ""
});

export async function getChatResponse(message: string, userType: string) {
  try {
    const systemPrompt = userType === "PATIENT" 
      ? `You are a helpful medical assistant for CareBridge healthcare platform. Help patients with:
- General health queries
- Understanding symptoms
- When to seek medical help
- Medication information
- Health tips
Always remind users to consult healthcare professionals for serious concerns.`
      : `You are a professional assistant for nurses on CareBridge platform. Help with:
- Patient care best practices
- Medical procedures
- Safety protocols
- Documentation tips
- Professional guidance
Provide accurate, professional healthcare information.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const text = chatCompletion.choices[0]?.message?.content || "I couldn't generate a response.";
    
    return { success: true, message: text };
  } catch (error: any) {
    console.error("Groq API error:", error);
    return { 
      success: true, 
      message: "I apologize, but I'm having trouble processing your request right now. Please try asking your question in a different way, or contact our support team for immediate assistance." 
    };
  }
}
