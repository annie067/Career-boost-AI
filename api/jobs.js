import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

    if (req.method === 'GET') {
      let query = supabase.from('jobs').select('*');
      
      const { skills, location, type } = req.query;
      
      const { data, error } = await query;
      if (error) {
        const missingTable =
          error.code === 'PGRST205' ||
          /Could not find the table ['"]?public\.jobs['"]?/i.test(error.message || '');

        if (missingTable) {
          return res.status(200).json([]);
        }

        throw error;
      }
      
      let filtered = data;

      if (type) {
        filtered = filtered.filter(j => j.type.toLowerCase().includes(type.toLowerCase()));
      }
      if (location) {
        filtered = filtered.filter(j => j.location.toLowerCase().includes(location.toLowerCase()));
      }

      if (skills) {
        const skillArray = skills.split(',').map(s => s.trim().toLowerCase());
        filtered = filtered.map(job => {
          const jobSkills = job.skills_required.map(s => s.toLowerCase());
          const matches = skillArray.filter(s => jobSkills.some(js => js.includes(s) || s.includes(js)));
          const match_percentage = Math.round((matches.length / Math.max(jobSkills.length, 1)) * 100);
          return { ...job, match_percentage: Math.min(match_percentage + 20, 100) }; // Boost slightly for UX
        }).filter(j => j.match_percentage > 20).sort((a, b) => b.match_percentage - a.match_percentage);
        
        return res.status(200).json(filtered);
      }

      // Add dummy match percentages if no skills provided
      const withRandomMatch = filtered.map(j => ({...j, match_percentage: Math.floor(Math.random() * 40) + 40})).slice(0, 10);
      return res.status(200).json(withRandomMatch);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
