import { useEffect, useState, useRef } from 'react';

type Props = {
  title: 'Orders' | 'Fulfillments';
  message: string;
  endpoint: string;
  fileExtension: 'csv' | 'xlsx';
};

export default function FileInput({
  title,
  message,
  endpoint,
  fileExtension,
}: Props) {
  const [logs, setLogs] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const terminalRef = useRef<HTMLDivElement>(null);

  const handleUpload = async () => {
    const formData = new FormData();
    if (file) {
      formData.append('csv', file);
    } else {
      return;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      console.error('Upload failed', res.statusText);
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed-${title.toLowerCase()}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    // clear the file input
    setFile(null);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');

    ws.onmessage = (event) => {
      setLogs((prev) => [...prev, event.data]);
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div>
      <h2>{title}</h2>
      <p>{message}</p>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
          } else {
            setFile(null);
          }
        }}
      />
      <button className="button" onClick={handleUpload} disabled={!file}>
        Process CSV
      </button>
      <div
        style={{
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          // padding: '1rem',
        }}
      >
        <h2>Live Server Logs</h2>
        <button className="button" onClick={clearLogs}>
          Clear Logs
        </button>
        <div className="terminal" ref={terminalRef}>
          {logs.map((line, i) => (
            <div key={i} className="terminal-line">
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
