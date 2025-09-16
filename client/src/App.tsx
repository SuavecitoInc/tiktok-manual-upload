import { useState } from 'react';
import FileInput from './components/FileInput';

import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<'orders' | 'fulfillments'>(
    'orders',
  );

  const messages = {
    orders:
      'Export TikTok Orders. Upload the CSV you get from TikTok. This will generate a new CSV that you can later use to generate a fulfillments CSV that you can upload to TikTok.',
    fulfillments:
      'Upload the CSV generated from the Orders step. This will generate a new Excel file that you can upload to TikTok to mark orders as fulfilled.',
  };

  return (
    <div>
      <h1>TikTok Manual Upload</h1>
      <div className="actions">
        <button
          className={`button ${currentView === 'orders' ? 'active' : ''}`}
          onClick={() => setCurrentView('orders')}
        >
          Orders
        </button>
        <button
          className={`button ${currentView === 'fulfillments' ? 'active' : ''}`}
          onClick={() => setCurrentView('fulfillments')}
        >
          Fulfillments
        </button>
      </div>
      {currentView === 'orders' && (
        <FileInput
          title="Orders"
          message={messages.orders}
          endpoint="http://localhost:3001/api/orders"
          fileExtension="csv"
        />
      )}
      {currentView === 'fulfillments' && (
        <FileInput
          title="Fulfillments"
          message={messages.fulfillments}
          endpoint="http://localhost:3001/api/fulfillments"
          fileExtension="xlsx"
        />
      )}
    </div>
  );
}

export default App;
