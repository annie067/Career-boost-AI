import fs from 'node:fs';
import formidable from 'formidable';
import supabase from '../server/api/_supabase.js';
import { applyCors, readJsonBody } from '../server/api/_http.js';
import { createOtpCode, createSignedToken, hashOtp, verifySignedToken } from '../server/api/_tokens.js';
import { sendMail, getAppUrl } from '../server/api/_mailer.js';
import { buildSignupVerificationEmail, buildPasswordResetEmail } from '../server/api/_templates.js';

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Mail-API-Key');
}

function getRouteName(req) {
    const url = new URL(req.url || '/', 'http://localhost');
    return url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
}

async function readRawBody(req) {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

async function parseRequestBody(req) {
    const url = new URL(req.url || '/', 'http://localhost');
    req.query = Object.fromEntries(url.searchParams.entries());

    const contentType = String(req.headers['content-type'] || '');
    if (!req.method || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        req.body = {};
        return;
    }

    if (contentType.includes('multipart/form-data')) {
        req.body = {};
        return;
    }

    const rawBody = await readRawBody(req);
    if (!rawBody.length) {
        req.body = {};
        return;
    }

    if (contentType.includes('application/json')) {
        req.body = JSON.parse(rawBody.toString('utf8'));
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
        req.body = Object.fromEntries(new URLSearchParams(rawBody.toString('utf8')));
    } else {
        req.body = rawBody;
    }
}

async function getAuthenticatedUser(req) {
    const token = req.headers.authorization ?.replace('Bearer ', '');
    if (!token) {
        throw new Error('Unauthorized');
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
        throw new Error('Invalid token');
    }

    return user;
}

async function parseResumeHandler(req, res) {
    const form = formidable({});

    const data = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) return reject(err);
            resolve({ fields, files });
        });
    });

    const file = Array.isArray(data.files.file) ? data.files.file[0] : data.files.file;

    if (!file || !file.filepath) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const token = req.headers.authorization ?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const fileBuffer = fs.readFileSync(file.filepath);
    const originalFilename = file.originalFilename || 'resume';
    const fileName = `${user.id}/${Date.now()}_${originalFilename}`;

    if (originalFilename.endsWith('.pdf') || file.mimetype === 'application/pdf') {
        const pdfParse = await
        import ('pdf-parse');
        const { text } = await pdfParse.default(fileBuffer);
        await supabase.storage.from('resumes').upload(fileName, fileBuffer, {
            contentType: file.mimetype || 'application/pdf',
            upsert: false,
        });
        return res.status(200).json({ text });
    }

    if (originalFilename.endsWith('.docx') || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const mammoth = await
        import ('mammoth');
        const result = await mammoth.extractRawText({ buffer: fileBuffer });

        await supabase.storage.from('resumes').upload(fileName, fileBuffer, {
            contentType: file.mimetype || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            upsert: false,
        });

        return res.status(200).json({ text: result.value });
    }

    return res.status(400).json({ error: 'Unsupported file type. Please upload PDF or DOCX.' });
}

async function signupRequest(req, res) {
    applyCors(res);
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { email } = await readJsonBody(req);
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const code = createOtpCode();
    const verificationToken = createSignedToken({
            purpose: 'signup-verification',
            email: normalizedEmail,
            codeHash: hashOtp(normalizedEmail, code),
        },
        15
    );

    const appUrl = getAppUrl(req);
    const verifyUrl = `${appUrl}/auth?mode=verify`;

    const { subject, html, text } = buildSignupVerificationEmail({
        code,
        expiresInMinutes: 15,
        verifyUrl,
    });

    await sendMail({ to: normalizedEmail, subject, html, text });

    return res.status(200).json({
        verificationToken,
        expiresInMinutes: 15,
        message: 'Verification code sent.',
    });
}

async function signupVerify(req, res) {
    applyCors(res);
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { verificationToken, code, password } = await readJsonBody(req);
    if (!verificationToken || !code || !password) {
        return res.status(400).json({ error: 'Verification token, code, and password are required' });
    }

    const payload = verifySignedToken(verificationToken);
    if (payload.purpose !== 'signup-verification') {
        return res.status(400).json({ error: 'Invalid verification token' });
    }

    const expectedCodeHash = hashOtp(payload.email, String(code).trim());
    if (expectedCodeHash !== payload.codeHash) {
        return res.status(400).json({ error: 'Incorrect verification code' });
    }

    const { data, error } = await supabase.auth.admin.createUser({
        email: payload.email,
        password,
        email_confirm: true,
    });

    if (error || !data ?.user) {
        return res.status(400).json({ error: error ?.message || 'Unable to create user' });
    }

    await supabase.from('profiles').upsert({ id: data.user.id, full_name: payload.email.split('@')[0] });

    return res.status(200).json({ message: 'Email verified successfully.', userId: data.user.id });
}

async function passwordResetRequest(req, res) {
    applyCors(res);
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email } = await readJsonBody(req);
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const pageSize = 100;
    let page = 1;
    let user = null;

    while (!user) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: pageSize });
        if (error) throw error;

        user = data.users.find((entry) => entry.email ?.toLowerCase() === normalizedEmail);
        if (user || data.users.length < pageSize) break;
        page += 1;
    }

    if (!user) {
        return res.status(200).json({ message: 'If the email exists, a password reset link has been sent.' });
    }

    const resetToken = createSignedToken({ purpose: 'password-reset', email: normalizedEmail, userId: user.id }, 30);
    const appUrl = getAppUrl(req);
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const { subject, html, text } = buildPasswordResetEmail({ resetUrl, expiresInMinutes: 30 });

    await sendMail({ to: normalizedEmail, subject, html, text });
    return res.status(200).json({ message: 'If the email exists, a password reset link has been sent.' });
}

async function passwordResetComplete(req, res) {
    applyCors(res);
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { token, password } = await readJsonBody(req);
    if (!token || !password) return res.status(400).json({ error: 'Reset token and password are required' });

    const payload = verifySignedToken(token);
    if (payload.purpose !== 'password-reset') {
        return res.status(400).json({ error: 'Invalid reset token' });
    }

    const { data, error } = await supabase.auth.admin.updateUserById(payload.userId, { password });
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ message: 'Password updated successfully.', userId: data.user.id });
}

async function sendMailRoute(req, res) {
    applyCors(res);
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const mailApiKey = process.env.MAIL_API_KEY;
    if (mailApiKey && req.headers['x-mail-api-key'] !== mailApiKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { to, subject, html, text, replyTo } = await readJsonBody(req);
    if (!to || !subject || !html) return res.status(400).json({ error: 'to, subject, and html are required' });

    await sendMail({ to, subject, html, text, replyTo });
    return res.status(200).json({ message: 'Email sent.' });
}

async function profileRoute(req, res) {
    const user = await getAuthenticatedUser(req);
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    let { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile) {
        const { data: newProfile } = await supabase.from('profiles').insert({ id: user.id, full_name: user.email.split('@')[0] }).select().single();
        profile = newProfile;
    }

    let { data: stats } = await supabase.from('user_stats').select('*').eq('user_id', user.id).single();
    if (!stats) {
        const { data: newStats } = await supabase.from('user_stats').insert({ user_id: user.id, xp: 0, level: 1 }).select().single();
        stats = newStats;
    }

    const { data: resumes } = await supabase.from('resumes').select('id, ats_score, created_at, title').eq('user_id', user.id).order('created_at', { ascending: false });
    const { data: interviews } = await supabase.from('interviews').select('id, score, created_at, role').eq('user_id', user.id).not('score', 'is', null).order('created_at', { ascending: false });

    const avgScore = resumes ?.length ? Math.round(resumes.reduce((sum, item) => sum + item.ats_score, 0) / resumes.length) : 0;
    const avgInterviewScore = interviews ?.length ? Math.round(interviews.reduce((sum, item) => sum + item.score, 0) / interviews.length) : 0;

    const timeline = [
            ...(resumes || []).map((r) => ({ type: 'resume', title: r.title, date: r.created_at, score: r.ats_score })),
            ...(interviews || []).map((i) => ({ type: 'interview', title: i.role, date: i.created_at, score: i.score })),
        ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    const trendData = (resumes || []).slice(0, 10).reverse().map((r, index) => ({ name: `R${index + 1}`, score: r.ats_score }));

    return res.status(200).json({
        ...profile,
        xp: stats ?.xp || 0,
        level: Math.floor((stats ?.xp || 0) / 100) + 1,
        stats: {
            resumes: resumes ?.length || 0,
            avgScore,
            interviews: interviews ?.length || 0,
            avgInterviewScore,
        },
        timeline,
        trendData,
    });
}

async function jobsRoute(req, res) {
    const user = await getAuthenticatedUser(req);
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { skills, location, type } = req.query;
    const { data, error } = await supabase.from('jobs').select('*');
    if (error) {
        const missingTable = error.code === 'PGRST205' || /Could not find the table ['"]?public\.jobs['"]?/i.test(error.message || '');
        if (missingTable) return res.status(200).json([]);
        throw error;
    }

    let filtered = data;
    if (type) filtered = filtered.filter((job) => job.type.toLowerCase().includes(String(type).toLowerCase()));
    if (location) filtered = filtered.filter((job) => job.location.toLowerCase().includes(String(location).toLowerCase()));

    if (skills) {
        const skillArray = String(skills).split(',').map((s) => s.trim().toLowerCase());
        filtered = filtered
            .map((job) => {
                const jobSkills = (job.skills_required || []).map((skill) => String(skill).toLowerCase());
                const matches = skillArray.filter((skill) => jobSkills.some((js) => js.includes(skill) || skill.includes(js)));
                const match_percentage = Math.round((matches.length / Math.max(jobSkills.length, 1)) * 100);
                return {...job, match_percentage: Math.min(match_percentage + 20, 100) };
            })
            .filter((job) => job.match_percentage > 20)
            .sort((a, b) => b.match_percentage - a.match_percentage);

        return res.status(200).json(filtered);
    }

    const withRandomMatch = filtered.map((job) => ({...job, match_percentage: Math.floor(Math.random() * 40) + 40 })).slice(0, 10);
    return res.status(200).json(withRandomMatch);
}

async function savedJobsRoute(req, res) {
    const user = await getAuthenticatedUser(req);

    if (req.method === 'GET') {
        const { data, error } = await supabase.from('saved_jobs').select('job_id').eq('user_id', user.id);
        if (error) throw error;
        return res.status(200).json(data.map((item) => item.job_id));
    }

    if (req.method === 'POST') {
        const { job_id } = await readJsonBody(req);
        const { data, error } = await supabase.from('saved_jobs').insert({ user_id: user.id, job_id }).select();
        if (error) throw error;
        return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
        const { job_id } = await readJsonBody(req);
        const { error } = await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('job_id', job_id);
        if (error) throw error;
        return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

async function interviewsRoute(req, res) {
    const user = await getAuthenticatedUser(req);

    if (req.method === 'GET') {
        const { data, error } = await supabase.from('interviews').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json(data);
    }

    if (req.method === 'POST') {
        const { role, difficulty = 'Medium' } = await readJsonBody(req);
        const qBank = {
            Easy: [
                `Tell me about yourself and your interest in ${role}.`,
                `What are your biggest strengths related to this role?`,
                `Describe a time you worked well in a team.`,
            ],
            Medium: [
                `Describe a challenging project you worked on related to ${role}. How did you handle it?`,
                `How do you prioritize tasks when you have multiple deadlines?`,
                `Tell me about a time you had a conflict with a coworker and how you resolved it.`,
            ],
            Hard: [
                `Explain a complex technical concept related to ${role} to someone without a technical background.`,
                `Describe a time you failed. What did you learn and how did you recover?`,
                `How would you design a scalable system for a high-traffic feature in this domain?`,
            ],
        };
        const questions = qBank[difficulty] || qBank.Medium;
        const { data, error } = await supabase.from('interviews').insert({ user_id: user.id, role: `${role} (${difficulty})`, questions, answers: [] }).select().single();
        if (error) throw error;
        const statResponse = await supabase.from('user_stats').select('*').eq('user_id', user.id).single();
        if (statResponse.data) {
            await supabase.from('user_stats').update({ xp: statResponse.data.xp + 100 }).eq('user_id', user.id);
        } else {
            await supabase.from('user_stats').insert({ user_id: user.id, xp: 100, level: 1 });
        }
        return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
        const { id, answers, isFinished } = await readJsonBody(req);
        const updateData = { answers };

        if (isFinished) {
            const lengths = answers.map((a) => a ?.length || 0);
            const avgLength = lengths.reduce((sum, value) => sum + value, 0) / lengths.length;
            const confidence = Math.min(Math.floor((avgLength / 100) * 100) + 30, 95);
            const clarity = Math.min(Math.floor((avgLength / 120) * 100) + 40, 98);
            const technical = Math.min(Math.floor((avgLength / 150) * 100) + 20, 90);
            updateData.score = Math.floor((confidence + clarity + technical) / 3);
            updateData.feedback = JSON.stringify({
                confidence: { score: confidence, text: confidence > 80 ? 'You sounded very sure of yourself.' : 'Try to use more definitive language.' },
                clarity: { score: clarity, text: clarity > 80 ? 'Your points were well-structured.' : 'Use the STAR method to structure answers better.' },
                technical: { score: technical, text: technical > 80 ? 'Great domain knowledge demonstrated.' : 'Provide more specific technical details and metrics.' },
            });
            const statResponse = await supabase.from('user_stats').select('*').eq('user_id', user.id).single();
            if (statResponse.data) {
                await supabase.from('user_stats').update({ xp: statResponse.data.xp + 100 }).eq('user_id', user.id);
            } else {
                await supabase.from('user_stats').insert({ user_id: user.id, xp: 100, level: 1 });
            }
        }

        const { data, error } = await supabase.from('interviews').update(updateData).eq('id', id).eq('user_id', user.id).select().single();
        if (error) throw error;
        return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

async function resumesRoute(req, res) {
    const user = await getAuthenticatedUser(req);

    if (req.method === 'GET') {
        const { data, error } = await supabase.from('resumes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json(data);
    }

    if (req.method === 'POST') {
        const { content, title, jobDescription } = await readJsonBody(req);
        const wordCount = String(content || '').split(' ').length;
        const baseScore = Math.min(Math.max(wordCount / 5, 40), 95);
        const matchPercentage = jobDescription ? Math.floor(Math.random() * 40) + 50 : null;
        const ats_score = Math.floor(baseScore + (Math.random() * 10 - 5));
        const missing_skills = ['Docker', 'AWS', 'GraphQL', 'System Design', 'Agile'].sort(() => 0.5 - Math.random()).slice(0, 3);

        const detailedFeedback = {
            skills_gap: `Missing key terms often found in similar roles: ${missing_skills.join(', ')}.`,
            experience_quality: 'Good use of action verbs, but could quantify results more clearly.',
            formatting: 'Clean and readable, but ensure standard section headers are used for ATS parsing.',
            impact: 'Impact is somewhat visible. Try adding metrics like "Increased efficiency by X%."',
        };

        const { data, error } = await supabase.from('resumes').insert({
            user_id: user.id,
            title,
            content,
            ats_score,
            missing_skills,
            suggestions: Object.values(detailedFeedback),
        }).select().single();
        if (error) throw error;

        await supabase.rpc('increment_xp', { user_id: user.id, amount: 50 }).catch(async() => {
            const statResponse = await supabase.from('user_stats').select('*').eq('user_id', user.id).single();
            if (statResponse.data) {
                await supabase.from('user_stats').update({ xp: statResponse.data.xp + 50 }).eq('user_id', user.id);
            } else {
                await supabase.from('user_stats').insert({ user_id: user.id, xp: 50, level: 1 });
            }
        });

        return res.status(201).json({...data, matchPercentage, detailedFeedback });
    }

    if (req.method === 'DELETE') {
        const { id } = await readJsonBody(req);
        const { error } = await supabase.from('resumes').delete().eq('id', id).eq('user_id', user.id);
        if (error) throw error;
        return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

async function roadmapsRoute(req, res) {
    const user = await getAuthenticatedUser(req);

    if (req.method === 'GET') {
        const { data, error } = await supabase.from('roadmaps').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json(data);
    }

    if (req.method === 'POST') {
        const { goal, currentSkills } = await readJsonBody(req);
        const steps = [
            { title: 'Foundation', desc: `Master the basics of ${goal?.split(' ')[0] || 'the domain'}.`, completed: false },
            { title: 'Core Projects', desc: 'Build 2-3 portfolio projects demonstrating core competencies.', completed: false },
            { title: 'Advanced Concepts', desc: 'Deep dive into system design and advanced patterns.', completed: false },
            { title: 'Interview Prep', desc: 'Practice mock interviews and LeetCode style questions.', completed: false },
        ];

        const { data, error } = await supabase.from('roadmaps').insert({ user_id: user.id, goal, steps }).select().single();
        if (error) throw error;

        const statResponse = await supabase.from('user_stats').select('*').eq('user_id', user.id).single();
        if (statResponse.data) {
            await supabase.from('user_stats').update({ xp: statResponse.data.xp + 20 }).eq('user_id', user.id);
        } else {
            await supabase.from('user_stats').insert({ user_id: user.id, xp: 20, level: 1 });
        }

        return res.status(201).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

async function portfoliosRoute(req, res) {
    if (req.method === 'GET' && req.query.slug) {
        const { data, error } = await supabase.from('portfolios').select('*').eq('slug', req.query.slug).single();
        if (error || !data) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(data);
    }

    const user = await getAuthenticatedUser(req);

    if (req.method === 'GET') {
        const { data, error } = await supabase.from('portfolios').select('*').eq('user_id', user.id).single();
        if (error) throw error;
        return res.status(200).json(data || {});
    }

    if (req.method === 'POST') {
        const { name, bio, skills, education, projects, slug } = await readJsonBody(req);
        const { data, error } = await supabase.from('portfolios').insert({ user_id: user.id, slug, name, bio, skills, education, projects }).select().single();
        if (error) throw error;
        return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
        const { id, name, bio, skills, education, projects } = await readJsonBody(req);
        const { data, error } = await supabase.from('portfolios').update({ name, bio, skills, education, projects }).eq('id', id).eq('user_id', user.id).select().single();
        if (error) throw error;
        return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

const routeMap = {
    'signup-request': signupRequest,
    'signup-verify': signupVerify,
    'password-reset-request': passwordResetRequest,
    'password-reset-complete': passwordResetComplete,
    'send-mail': sendMailRoute,
    profile: profileRoute,
    jobs: jobsRoute,
    saved_jobs: savedJobsRoute,
    interviews: interviewsRoute,
    resumes: resumesRoute,
    roadmaps: roadmapsRoute,
    portfolios: portfoliosRoute,
    'parse-resume': parseResumeHandler,
};

export default async function handler(req, res) {
    setCorsHeaders(res);
    const routeName = getRouteName(req);
    if (!routeName || routeName.includes('..')) {
        return res.status(404).json({ error: 'Not found' });
    }

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    try {
        if (routeName !== 'parse-resume') {
            await parseRequestBody(req);
        }

        const routeHandler = routeMap[routeName];
        if (!routeHandler) {
            return res.status(404).json({ error: 'Not found' });
        }

        await routeHandler(req, res);
    } catch (error) {
        console.error(`API error for /api/${routeName}:`, error);
        if (!res.headersSent) {
            const message = error ?.message || 'Internal server error';
            if (message === 'Unauthorized' || message === 'Invalid token') {
                return res.status(401).json({ error: message });
            }
            if (message === 'Token expired') {
                return res.status(400).json({ error: message });
            }
            return res.status(500).json({ error: message });
        }
    }
}