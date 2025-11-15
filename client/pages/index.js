import { useEffect, useState } from 'react';
import LogTable from '../components/LogTable';
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

export default function Home({ initialLogs }) {
  const [logs, setLogs] = useState(initialLogs);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const refreshLogs = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/import-logs`);
      if (!res.ok) throw new Error('Failed to load logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(refreshLogs, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main>
      <header>
        <div>
          <h1>Job Import Logs</h1>
          <p>Monitor hourly feed ingestions, deduping, and queue health.</p>
        </div>
        <button type="button" onClick={refreshLogs} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>
      {error && <div className="error-banner">{error}</div>}
      <LogTable logs={logs} />
    </main>
  );
}

export async function getServerSideProps() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/import-logs`);
    if (!res.ok) throw new Error('Failed to load logs');
    const logs = await res.json();
    return { props: { initialLogs: logs } };
  } catch (err) {
    return { props: { initialLogs: [], error: err.message } };
  }
}
