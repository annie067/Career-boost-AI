import supabase from './_supabase.js';
import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

// Important for Vercel: disable body parsing so formidable can read the stream
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

    const form = formidable({});
    
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: 'Error parsing form data' });
      
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) return res.status(400).json({ error: 'No file uploaded' });

      try {
        const fileBuffer = fs.readFileSync(file.filepath);
        let extractedText = '';

        if (file.originalFilename?.endsWith('.pdf') || file.mimetype === 'application/pdf') {
          const data = await pdfParse(fileBuffer);
          extractedText = data.text;
        } else if (file.originalFilename?.endsWith('.docx') || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const result = await mammoth.extractRawText({ buffer: fileBuffer });
          extractedText = result.value;
        } else {
          return res.status(400).json({ error: 'Unsupported file type. Please upload PDF or DOCX.' });
        }

        // Clean up temp file
        fs.unlinkSync(file.filepath);

        // Upload to Supabase Storage (optional, but requested in prompt)
        // Ensure you have a 'resumes' bucket created in Supabase
        const fileName = `${user.id}/${Date.now()}_${file.originalFilename}`;
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, fileBuffer, {
            contentType: file.mimetype || 'application/octet-stream',
            upsert: false
          });

        if (uploadError) {
          console.warn('Failed to upload file to storage, but continuing with analysis:', uploadError.message);
        }

        return res.status(200).json({ text: extractedText });

      } catch (parseErr) {
        console.error('Parse error:', parseErr);
        return res.status(500).json({ error: 'Failed to parse file content' });
      }
    });

  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message });
  }
}
