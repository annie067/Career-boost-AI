import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('interviews').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { role, difficulty = 'Medium' } = req.body;
      
      const qBank = {
        Easy: [
          `Tell me about yourself and your interest in ${role}.`,
          `What are your biggest strengths related to this role?`,
          `Describe a time you worked well in a team.`
        ],
        Medium: [
          `Describe a challenging project you worked on related to ${role}. How did you handle it?`,
          `How do you prioritize tasks when you have multiple deadlines?`,
          `Tell me about a time you had a conflict with a coworker and how you resolved it.`
        ],
        Hard: [
          `Explain a complex technical concept related to ${role} to someone without a technical background.`,
          `Describe a time you failed. What did you learn and how did you recover?`,
          `How would you design a scalable system for a high-traffic feature in this domain?`
        ]
      };

      const questions = qBank[difficulty] || qBank.Medium;

      const { data, error } = await supabase.from('interviews').insert({
        user_id: user.id,
        role: `${role} (${difficulty})`,
        questions,
        answers: [],
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, answers, isFinished } = req.body;
      let updateData = { answers };
      
      if (isFinished) {
        const lengths = answers.map(a => a?.length || 0);
        const avgLength = lengths.reduce((a,b)=>a+b,0) / answers.length;
        
        const confidence = Math.min(Math.floor((avgLength / 100) * 100) + 30, 95);
        const clarity = Math.min(Math.floor((avgLength / 120) * 100) + 40, 98);
        const technical = Math.min(Math.floor((avgLength / 150) * 100) + 20, 90);
        const score = Math.floor((confidence + clarity + technical) / 3);
        
        updateData.score = score;
        updateData.feedback = JSON.stringify({
          confidence: { score: confidence, text: confidence > 80 ? "You sounded very sure of yourself." : "Try to use more definitive language." },
          clarity: { score: clarity, text: clarity > 80 ? "Your points were well-structured." : "Use the STAR method to structure answers better." },
          technical: { score: technical, text: technical > 80 ? "Great domain knowledge demonstrated." : "Provide more specific technical details and metrics." }
        });

        // Add XP
        supabase.from('user_stats').select('*').eq('user_id', user.id).single().then(({data: stat}) => {
          if (stat) supabase.from('user_stats').update({ xp: stat.xp + 100 }).eq('user_id', user.id).then();
          else supabase.from('user_stats').insert({ user_id: user.id, xp: 100, level: 1 }).then();
        });
      }

      const { data, error } = await supabase.from('interviews').update(updateData).eq('id', id).eq('user_id', user.id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
