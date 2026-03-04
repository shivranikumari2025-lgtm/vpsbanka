import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { subject_name, chapter_name, class_name, num_questions, difficulty, question_type } = body;

    if (!subject_name || !chapter_name || !num_questions) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), { status: 500, headers: corsHeaders });
    }

    const difficultyDesc = difficulty === 'easy' ? 'basic conceptual questions' :
                           difficulty === 'hard' ? 'advanced analytical and application-based questions' :
                           'moderate difficulty questions mixing conceptual and application';

    const prompt = `Generate exactly ${num_questions} multiple choice questions for an exam.

Subject: ${subject_name}
Chapter: ${chapter_name}
Class: ${class_name || 'General'}
Difficulty: ${difficulty || 'medium'} (${difficultyDesc})
Question Type: ${question_type || 'MCQ with 4 options'}

IMPORTANT: Return ONLY valid JSON array. No markdown, no code blocks, no extra text.
Each question must have this exact structure:
[
  {
    "question_text": "Clear question text here?",
    "option_a": "First option",
    "option_b": "Second option",
    "option_c": "Third option",
    "option_d": "Fourth option",
    "correct_answer": "A",
    "marks": 1,
    "difficulty": "${difficulty || 'medium'}"
  }
]

Rules:
- correct_answer must be exactly one of: "A", "B", "C", "D"
- Questions should be factually accurate and grade-appropriate
- Options should be plausible but only one correct
- Distribute correct answers across A, B, C, D
- Each question gets ${difficulty === 'hard' ? '2' : '1'} mark(s)
- Make questions progressively harder within the set`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are an expert educational content creator. Generate high-quality exam questions. Always return ONLY valid JSON arrays.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', errorText);
      return new Response(JSON.stringify({ error: 'AI service error' }), { status: 500, headers: corsHeaders });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    let questions;
    try {
      questions = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse AI response:', content);
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), { status: 500, headers: corsHeaders });
    }

    // Validate and sanitize
    const validated = questions.map((q: any, i: number) => ({
      question_text: q.question_text || `Question ${i + 1}`,
      option_a: q.option_a || 'Option A',
      option_b: q.option_b || 'Option B',
      option_c: q.option_c || 'Option C',
      option_d: q.option_d || 'Option D',
      correct_answer: ['A', 'B', 'C', 'D'].includes(q.correct_answer) ? q.correct_answer : 'A',
      marks: q.marks || 1,
      difficulty: q.difficulty || difficulty || 'medium',
    }));

    return new Response(JSON.stringify({ questions: validated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error:', message);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders });
  }
});
