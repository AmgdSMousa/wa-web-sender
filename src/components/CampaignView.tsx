
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { LogEntry, AppState, CampaignStatus, DeliveryStatus } from '../types';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface CampaignViewProps {
  appState: AppState;
  campaignStatus: CampaignStatus;
  log: LogEntry[];
  currentNumberIndex: number;
  totalNumbers: number;
  currentActionInfo: {
    number: string;
    message: string;
    file: File | null;
    actionDelay: number;
  };
  onUpdateDeliveryStatus: (logIndex: number, newStatus: DeliveryStatus) => void;
  onSkipNumber: () => void;
  delayBetween: number;
}

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-base font-medium text-emerald-700 dark:text-white">Progress</span>
        <span className="text-sm font-medium text-emerald-700 dark:text-white">{current} / {total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

const CountdownTimer: React.FC<{ duration: number }> = ({ duration }) => {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const intervalId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(intervalId);
    }, [timeLeft]);

    useEffect(() => {
        setTimeLeft(duration);
    }, [duration]);

    return (
        <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Auto-advancing in...</p>
            <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{timeLeft}</p>
        </div>
    );
};


const AutoSendCard: React.FC<{
  info: CampaignViewProps['currentActionInfo'];
  onSkip: () => void;
}> = ({ info, onSkip }) => {
  const { number, message, file, actionDelay } = info;
  const whatsappUrl = `https://web.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(message)}`;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-emerald-500">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Action: Send Message</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 space-y-3">
          <p>
            <span className="font-semibold">To:</span>
            <span className="ml-2 font-mono text-emerald-600 dark:text-emerald-400">{number}</span>
          </p>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <p className="text-sm whitespace-pre-wrap">{message}</p>
            {file && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Attachment: {file.name}</p>}
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center space-x-2 w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            <WhatsAppIcon className="w-5 h-5" />
            <span>Open in WhatsApp & Send</span>
          </a>
        </div>
        <div className="flex flex-col items-center justify-center space-y-4">
          <CountdownTimer duration={actionDelay} />
           <button 
              onClick={onSkip}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Skip Number
            </button>
        </div>
      </div>
    </div>
  );
};

const StatusPill: React.FC<{ status: 'SUCCESS' | 'ERROR' | 'INFO' | 'SKIPPED' }> = ({ status }) => {
  const baseClasses = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
  const styles = {
    SUCCESS: "bg-emerald-100 text-emerald-800",
    ERROR: "bg-red-100 text-red-800",
    INFO: "bg-blue-100 text-blue-800",
    SKIPPED: "bg-amber-100 text-amber-800",
  };
  return <span className={`${baseClasses} ${styles[status]}`}>{status}</span>;
};

const DeliveryStatusControl: React.FC<{
    status: DeliveryStatus;
    onChange: (newStatus: DeliveryStatus) => void;
}> = ({ status, onChange }) => {
    const baseClasses = "px-2 py-0.5 text-xs rounded-full cursor-pointer";
    const statusMap: Record<DeliveryStatus, { text: string, bg: string, text_color: string, next: DeliveryStatus }> = {
        Pending: { text: "Pending", bg: "bg-gray-200 dark:bg-gray-600", text_color: "text-gray-800 dark:text-gray-200", next: 'Delivered' },
        Delivered: { text: "Delivered", bg: "bg-blue-200 dark:bg-blue-600", text_color: "text-blue-800 dark:text-blue-100", next: 'Read' },
        Read: { text: "Read", bg: "bg-emerald-200 dark:bg-emerald-600", text_color: "text-emerald-800 dark:text-emerald-100", next: 'Pending' }
    };

    const current = statusMap[status];

    return (
        <button onClick={() => onChange(current.next)} className={`${baseClasses} ${current.bg} ${current.text_color}`}>
            {current.text}
        </button>
    )
}

export const CampaignView: React.FC<CampaignViewProps> = ({
  appState,
  campaignStatus,
  log,
  currentNumberIndex,
  totalNumbers,
  currentActionInfo,
  onUpdateDeliveryStatus,
  onSkipNumber,
  delayBetween,
}) => {
  const exportToExcel = () => {
    const dataToExport = log
      .filter(entry => entry.data?.number)
      .map(entry => ({
        Number: entry.data!.number,
        Status: entry.data!.status,
        "Delivery Status": entry.data!.deliveryStatus || 'N/A',
        Message: entry.data!.message,
        File: entry.data!.file || 'None',
      }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Campaign Results");
    XLSX.writeFile(workbook, "campaign_report.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        {campaignStatus !== 'stopped' && campaignStatus !== 'finished' && (
          <div className='mb-6'>
            <ProgressBar current={currentNumberIndex} total={totalNumbers} />
          </div>
        )}
        {appState === 'WaitingForSend' && campaignStatus === 'running' && (
            <AutoSendCard info={currentActionInfo} onSkip={onSkipNumber} />
        )}
        {appState === 'WaitingForNext' && campaignStatus === 'running' && (
          <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="font-semibold text-gray-700 dark:text-gray-300">Waiting for next number... ({delayBetween}s delay)</p>
          </div>
        )}
        {campaignStatus === 'paused' && (
            <div className="text-center p-6 bg-amber-50 dark:bg-amber-900/50 rounded-lg border-l-4 border-amber-500">
                <p className="font-semibold text-amber-800 dark:text-amber-200">Campaign Paused</p>
                <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">Click "Resume Campaign" to continue.</p>
            </div>
        )}
        {appState === 'Idle' && <div className="text-center text-gray-500 dark:text-gray-400 py-6">Setup your campaign and click Start.</div>}
        {appState === 'Finished' && <div className="text-center text-emerald-600 dark:text-emerald-400 font-semibold py-6">Campaign Finished!</div>}
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Campaign Log</h3>
            <button
                onClick={exportToExcel}
                disabled={log.length === 0 || campaignStatus === 'running'}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
                <DownloadIcon className="w-4 h-4" />
                <span>Export Results</span>
            </button>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Delivery</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {log.map((entry, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{entry.timestamp}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><StatusPill status={entry.status} /></td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{entry.message}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {entry.data?.status === 'SENT' && entry.data.deliveryStatus && (
                        <DeliveryStatusControl
                            status={entry.data.deliveryStatus}
                            onChange={(newStatus) => onUpdateDeliveryStatus(index, newStatus)}
                        />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};