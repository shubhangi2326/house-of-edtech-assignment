import { NextResponse } from 'next/server';
import { Groq } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, docContent, history, image } = body;

    const STABLE_MODEL = "llama-3.3-70b-versatile";

    const systemPrompt = `You are a helpful EdTech Assistant. 
    Current Document Context: "${docContent || 'Empty Document'}". 
    If an image was sent, acknowledge that you are currently processing it as a text-based context.
    Always be professional and academic.`;

    const chatMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
      { 
        role: "user", 
        content: image 
          ? `[User sent an image] ${message || "Please analyze this context."}` 
          : (message || "Help me with this document.") 
      }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: chatMessages,
      model: STABLE_MODEL, 
      temperature: 0.6,
      max_tokens: 1024,
    });

    const reply = chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    return NextResponse.json({ reply });

  } catch (err: any) {
    console.error("GROQ BACKEND ERROR:", err.message);
    
    return NextResponse.json({ 
      reply: "The AI engine is currently busy. Please try again in a few seconds." 
    }, { status: 500 });
  }
}