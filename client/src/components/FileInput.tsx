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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const now = new Date();

  // format parts
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const dayName = days[now.getDay()];
  const monthName = months[now.getMonth()];
  const day = now.getDate();
  const year = now.getFullYear();

  // build string
  const loginString = `Last login: ${dayName} ${monthName} ${day} ${year} on ttys000`;

  useEffect(() => {
    const host = window.location.hostname;
    // ws://localhost:3001
    const ws = new WebSocket(`ws://${host}:3001`);

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
      <div className="file-input-wrapper">
        <input
          ref={fileInputRef}
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
        <button className="btn" onClick={handleUpload} disabled={!file}>
          Process CSV
        </button>
      </div>
      <div
        style={{
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          // padding: '1rem',
        }}
      >
        <div
          className="terminal"
          role="application"
          aria-label="macOS-like terminal"
          ref={terminalRef}
        >
          <div className="term-header">
            <div className="traffic" aria-hidden>
              <div className="light r"></div>
              <div className="light y"></div>
              <div className="light g"></div>
            </div>
            <div className="term-title">
              <b>bash</b> — local •{' '}
              <span style={{ opacity: 0.7, marginLeft: 6 }}>~</span>
            </div>
            {/* <div className="toolbar">⌘K to clear</div> */}
          </div>

          <div className="term-body" id="termBody">
            <div className="line">
              <span className="output">{loginString}</span>
            </div>

            {/* the command area where JS will append lines */}
            <div id="outputArea">
              {logs.map((line, i) => (
                <div key={i} className="line">
                  <span className="output">{line}</span>
                </div>
              ))}
            </div>

            <div id="inputRow" className="line input-row" aria-live="polite">
              <span className="prompt">$</span>
              <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>
                <input
                  id="cmdInput"
                  className="cmd-input"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  aria-label="Command input"
                />
              </div>
              <div className="cursor" id="staticCursor"></div>
            </div>

            <div className="glow" aria-hidden></div>
          </div>
        </div>
        <button className="btn" onClick={clearLogs} style={{ marginTop: 4 }}>
          Clear Logs
        </button>
      </div>
    </div>
  );
}
