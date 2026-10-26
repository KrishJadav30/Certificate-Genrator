import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [msg, setMsg] = useState('Ready');
  const [loading, setLoading] = useState(false);

  const startTask = async (mode) => {
    setLoading(true);
    setMsg(mode === 'zip' ? 'Creating ZIP...' : 'Sending Emails...');
    try {
      if (mode === 'zip') {
        const res = await axios.get('http://localhost:5000/api/download-zip', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Certificates.zip');
        document.body.appendChild(link); // Better browser compatibility
        link.click();
        link.remove();
        setMsg('Download Started!');
      } else {
        const res = await axios.post('http://localhost:5000/api/send-emails');
        setMsg(res.data);
      }
    } catch (err) {
      // Capture the server error message if available
      const errorDetail = err.response?.data || 'Check console or backend files.';
      setMsg(`Error: ${errorDetail}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'Arial' }}>
      <h2>Certificate Automation Pro</h2>
      <div style={{ border: '2px solid #ddd', padding: '30px', display: 'inline-block', borderRadius: '15px' }}>
        <button onClick={() => startTask('zip')} disabled={loading} style={btnStyle}>Download ZIP</button>
        <button onClick={() => startTask('email')} disabled={loading} style={{...btnStyle, backgroundColor: '#28a745'}}>Send Emails</button>
        <p><strong>Status:</strong> {msg}</p>
      </div>
    </div>
  );
}

const btnStyle = { 
  margin: '10px', 
  padding: '15px 30px', 
  color: 'white', 
  backgroundColor: '#007bff', 
  border: 'none', 
  borderRadius: '8px', 
  cursor: 'pointer' 
};

export default App;