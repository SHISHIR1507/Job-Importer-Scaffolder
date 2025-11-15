import PropTypes from 'prop-types';

const statusColor = (failedJobs) => {
  if (failedJobs > 0) return 'bg-red-50 text-red-700';
  return 'bg-white text-slate-900';
};

export default function LogTable({ logs }) {
  if (!logs.length) {
    return (
      <div className="empty-state">
        No imports have been recorded yet. Confirm that the backend cron job is running.
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Feed</th>
            <th>Imported At</th>
            <th>Total</th>
            <th>New</th>
            <th>Updated</th>
            <th>Failed</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log._id || log.id} className={statusColor(log.failedJobs)}>
              <td>{log.fileName}</td>
              <td>{new Date(log.importDateTime).toLocaleString()}</td>
              <td>{log.total}</td>
              <td>{log.newJobs}</td>
              <td>{log.updatedJobs}</td>
              <td>{log.failedJobs}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

LogTable.propTypes = {
  logs: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      fileName: PropTypes.string,
      importDateTime: PropTypes.string,
      total: PropTypes.number,
      newJobs: PropTypes.number,
      updatedJobs: PropTypes.number,
      failedJobs: PropTypes.number,
    })
  ),
};

LogTable.defaultProps = {
  logs: [],
};
