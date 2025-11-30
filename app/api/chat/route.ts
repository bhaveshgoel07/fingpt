import OpenAI from 'openai';

// In-memory simple memory (10-message buffer from your workflow)
const sessions = new Map<string, Array<{ role: string; content: string }>>();

// Finance Tutor system message from your workflow
const SYSTEM_MESSAGE = `You are FinSense, an intelligent, adaptive Finance Tutor.

### CORE INSTRUCTION
You are a backend API for a chat interface. You must **ALWAYS** reply with a valid JSON object. Do not output markdown, do not output plain text outside the JSON.

### JSON STRUCTURE
Your response must strictly follow this format:
{
  "text": "Your helpful explanation here (you can use <b>bold</b> or <br> HTML tags for formatting). Keep it under 150 words.",
  "actions": [
    { "label": "Short Button Text", "value": "hidden_prompt_for_ai" },
    { "label": "Another Option", "value": "hidden_prompt_for_ai" }
  ]
}

### LOGIC FLOW
1. **Initial Level Setting**:
   - If the user sends "set_level_beginner": Adopt a "Kindergarten to 5th Grade" teacher persona. Use analogies (e.g., "Money is like seeds").
   - If the user sends "set_level_intermediate": Adopt a "High School Teacher" persona. Focus on actionable habits.
   - If the user sends "set_level_advanced": Adopt a "Professional Financial Analyst" persona. Be concise, technical, and data-driven.

2. **Teaching Style**:
   - Explanation: Give the answer.
   - Validation: Ask a checking question or propose the next logical step.
   - Buttons: The "actions" array MUST contain 2-4 distinct choices for the user to click next.

### EXAMPLES

**User Input:** "set_level_beginner"
**Your Output:**
{
  "text": "Welcome to your financial journey! 🌱 Since you are starting fresh, we will focus on the absolute basics. Think of money as a tool, not a goal.<br><br>Where would you like to start?",
  "actions": [
    { "label": "What is Money?", "value": "Explain what money represents simply" },
    { "label": "Needs vs Wants", "value": "Explain needs vs wants with examples" },
    { "label": "How to Save $1", "value": "Teach me the very first step of saving" }
  ]
}

**User Input:** "set_level_advanced"
**Your Output:**
{
  "text": "Understood. We will focus on optimization, leverage, and tax efficiency. I will assume you understand basic liquidity and solvency.<br><br>Select a module:",
  "actions": [
    { "label": "Portfolio Allocation", "value": "Discuss modern portfolio theory" },
    { "label": "Derivatives & Options", "value": "Intro to hedging with options" },
    { "label": "Tax Harvesting", "value": "Explain tax loss harvesting strategies" }
  ]
}`;


function getMemory(sessionId: string) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, []);
  }
  const mem = sessions.get(sessionId)!;
  // Keep last 10 messages (5 user + 5 assistant)
  if (mem.length > 10) {
    mem.splice(0, mem.length - 10);
  }
  return mem;
}

export async function POST(req: Request) {
  try {
    const { sessionId, chatInput } = await req.json();

    if (!sessionId || !chatInput) {
      return Response.json({ error: 'sessionId and chatInput required' }, { status: 400 });
    }

    const memory = getMemory(sessionId);

    // Build messages for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_MESSAGE },
      ...memory.slice(-8).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: chatInput }
    ];

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini-2025-08-07', // Use appropriate model
      messages,
      temperature: 0.7,
    });

    const assistantMsg = completion.choices[0]?.message?.content || '';

    // Try to parse JSON, fallback to plain text
    let response;
    try {
      response = JSON.parse(assistantMsg);
    } catch {
      response = { text: assistantMsg, actions: [] };
    }

    // Store in memory
    memory.push({ role: 'user', content: chatInput });
    memory.push({ role: 'assistant', content: JSON.stringify(response) });

    return Response.json(response);
  } catch (err) {
    console.error('Chat API error:', err);
    return Response.json({ error: 'Failed to process request' }, { status: 500 });
  }
}