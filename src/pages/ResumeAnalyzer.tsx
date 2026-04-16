import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Trash2, Code, FileUp, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResumeAnalyzer() {
  const { token } = useAuth();
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [textInput, setTextInput] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchResumes = async () => {
    try {
      const res = await fetch('/api/resumes', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setResumes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchResumes();
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.docx')) setFile(droppedFile);
      else alert('Please upload a PDF or DOCX file.');
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      let content = '';
      let title = `Resume ${new Date().toLocaleDateString()}`;

      if (activeTab === 'paste') {
        if (!textInput.trim()) return;
        content = textInput;
      } else if (activeTab === 'upload' && file) {
        title = file.name;
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch('/api/parse-resume', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
        if (!uploadRes.ok) throw new Error('Failed to parse file');
        const uploadData = await uploadRes.json();
        content = uploadData.text;
      } else return;

      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content, title, jobDescription })
      });
      
      if (res.ok) {
        setTextInput('');
        setFile(null);
        fetchResumes();
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
      alert('Error analyzing resume. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch('/api/resumes', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id }) });
      fetchResumes();
    } catch (err) { console.error(err); }
  };

  const isSubmitDisabled = analyzing || (activeTab === 'paste' && !textInput.trim()) || (activeTab === 'upload' && !file);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Resume Analyzer Pro</h1>
        <p className="text-muted-foreground mt-2">Compare your resume against real job descriptions for actionable feedback.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Col: Resume Input */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Your Resume</h3>
          
          <div className="flex gap-2 mb-4 p-1 bg-muted rounded-xl">
            <button onClick={() => setActiveTab('upload')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'upload' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Upload File</button>
            <button onClick={() => setActiveTab('paste')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'paste' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Paste Text</button>
          </div>

          <div className="flex-1 flex flex-col">
            {activeTab === 'upload' ? (
              <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className="flex-1 border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/10 min-h-[200px]">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.docx" className="hidden" />
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4"><Upload className="w-8 h-8 text-primary" /></div>
                <h4 className="text-base font-semibold mb-1">Drop PDF/DOCX here</h4>
                <p className="text-xs text-muted-foreground mb-4">Max 5MB</p>
                {file && <div className="px-4 py-2 bg-primary/10 rounded-lg text-sm font-medium text-primary flex items-center gap-2"><FileText className="w-4 h-4" /> {file.name}</div>}
              </div>
            ) : (
              <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Paste your resume text here..." className="flex-1 w-full min-h-[200px] p-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none resize-none" />
            )}
          </div>
        </div>

        {/* Right Col: Job Description */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Briefcase className="w-5 h-5 text-purple-500" /> Target Job (Optional)</h3>
            <span className="text-xs bg-purple-500/10 text-purple-500 px-2 py-1 rounded-md font-medium">Boosts Accuracy</span>
          </div>
          <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the job description here to see how well you match..." className="flex-1 w-full min-h-[200px] p-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none" />
        </div>
      </div>

      <button onClick={handleAnalyze} disabled={isSubmitDisabled} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
        {analyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Analyze & Score Resume'}
      </button>

      <div className="space-y-6 pt-4 border-t border-border">
        <h3 className="text-2xl font-bold">Analysis History</h3>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : resumes.length === 0 ? (
          <div className="text-center p-12 glass-panel rounded-2xl border-dashed">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No resumes analyzed yet. Upload one to get started.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence>
              {resumes.map(resume => (
                <motion.div key={resume.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                  <button onClick={() => handleDelete(resume.id)} className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-6 pr-10">
                    <div>
                      <h4 className="font-bold text-xl flex items-center gap-2"><FileText className="w-5 h-5 text-primary shrink-0" /> {resume.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{new Date(resume.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-6">
                      <div className="text-center">
                        <div className={`text-4xl font-black ${resume.ats_score >= 80 ? 'text-green-500' : resume.ats_score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>{resume.ats_score}</div>
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">ATS Score</span>
                      </div>
                      {/* Detailed feedback is stored in suggestions array in this structure */}
                      {resume.suggestions?.length > 3 && (
                        <div className="text-center">
                          <div className="text-4xl font-black text-purple-500">{(resume.ats_score - 5 > 0) ? resume.ats_score - 5 : 0}%</div>
                          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Job Match</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-4">
                    <div className="bg-destructive/5 rounded-xl p-5 border border-destructive/10">
                      <h5 className="font-bold text-destructive flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4" /> Missing Keywords</h5>
                      <div className="flex flex-wrap gap-2">
                        {resume.missing_skills?.map((skill: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 bg-background rounded-md text-xs font-medium border border-border shadow-sm">{skill}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
                      <h5 className="font-bold text-primary flex items-center gap-2 mb-3"><CheckCircle className="w-4 h-4" /> AI Feedback</h5>
                      <ul className="space-y-3">
                        {resume.suggestions?.slice(0,3).map((sugg: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2 leading-relaxed">
                            <span className="text-primary mt-1 shrink-0">•</span> {sugg}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
