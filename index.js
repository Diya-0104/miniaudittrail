import { useEffect, useState } from 'react';

export default function Home() {
  const [content, setContent] = useState('');
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchVersions();
  }, []);

  async function fetchVersions() {
    const res = await fetch('/api/versions');
    if (res.ok) {
      const data = await res.json();
      setVersions(data);
      if (data.length > 0) {
        // Optionally pre-fill editor with last saved content
        setContent(data[data.length - 1].fullContent || '');
      }
    }
  }

  async function handleSave() {
    setLoading(true);
    setMessage('Saving...');
    const res = await fetch('/api/save-version', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newContent: content })
    });
    setLoading(false);
    if (res.ok) {
      const entry = await res.json();
      setMessage('Saved ✅');
      setVersions(prev => [...prev, entry]);
    } else {
      setMessage('Save failed');
    }
    setTimeout(()=>setMessage(''), 1200);
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Mini Audit Trail Generator</h1>
      </div>

      <div className="editor">
        <div className="card">
          <h3>Content Editor</h3>
          <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Type anything here..." />
          <div style={{marginTop:12, display:'flex', gap:8, alignItems:'center'}}>
            <button className="button" onClick={handleSave} disabled={loading}>Save Version</button>
            <span style={{marginLeft:8}}>{message}</span>
          </div>
        </div>

        <div className="card">
          <h3>Version History</h3>
          <div style={{marginTop:8}}>
            {versions.length === 0 && <small>No versions yet. Save to create history.</small>}
            {versions.map(v=> (
              <div key={v.id} className="version-item">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div>
                    <div><span className="badge">{v.timestamp}</span></div>
                    <div style={{marginTop:6}}><small>Added: {v.addedWords.join(', ') || '—'}</small></div>
                    <div><small>Removed: {v.removedWords.join(', ') || '—'}</small></div>
                    <div><small>oldLength: {v.oldLength}, newLength: {v.newLength}</small></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}