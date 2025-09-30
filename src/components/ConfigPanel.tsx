import React from 'react';
import { CampaignConfig, CampaignStatus } from '../types';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { AttachmentIcon } from './icons/AttachmentIcon';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import { PauseIcon } from './icons/PauseIcon';

interface ConfigPanelProps {
  config: CampaignConfig;
  setConfig: React.Dispatch<React.SetStateAction<CampaignConfig>>;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  campaignStatus: CampaignStatus;
  errors: Record<string, string>;
}

const InputGroup: React.FC<{
  label: string;
  children: React.ReactNode;
  htmlFor?: string;
  error?: string;
}> = ({ label, children, htmlFor, error }) => (
  <div>
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    {children}
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

const FileInput: React.FC<{
  id: string;
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}> = ({ id, file, onChange, disabled }) => (
  <div className="mt-1 flex items-center">
    <label
      htmlFor={id}
      className={`relative cursor-pointer rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
        <AttachmentIcon className="w-5 h-5" />
        <span>{file ? 'Change file' : 'Attach file'}</span>
      </div>
      <input
        id={id}
        name={id}
        type="file"
        className="sr-only"
        onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
        disabled={disabled}
      />
    </label>
    {file && (
      <div className="ml-3 text-sm text-gray-500 dark:text-gray-400 flex items-center">
        <span>{file.name}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-2 text-red-500 hover:text-red-700"
          aria-label="Remove file"
          disabled={disabled}
        >
          &times;
        </button>
      </div>
    )}
  </div>
);

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  setConfig,
  onStart,
  onStop,
  onPause,
  onResume,
  campaignStatus,
  errors,
}) => {
  const isRunning = campaignStatus === 'running' || campaignStatus === 'paused';
  const handleConfigChange = <K extends keyof CampaignConfig>(key: K, value: CampaignConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };
  const handleNumbersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const numbersArray = e.target.value.split(/[\n,]+/).map(n => n.trim()).filter(Boolean);
    handleConfigChange('numbers', numbersArray);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
      <div className="flex items-center space-x-3">
        <WhatsAppIcon className="w-8 h-8 text-emerald-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Campaign Setup</h2>
      </div>

      {/* Message Templates */}
      <div className="space-y-4">
        <InputGroup label="Message Template 1" htmlFor="message1" error={errors.messages}>
          <textarea
            id="message1"
            rows={4}
            className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.messages ? 'border-red-500' : 'border-gray-300'}`}
            value={config.message1}
            onChange={(e) => handleConfigChange('message1', e.target.value)}
            disabled={isRunning}
          />
          <FileInput id="file1" file={config.file1} onChange={(f) => handleConfigChange('file1', f)} disabled={isRunning}/>
        </InputGroup>
        <InputGroup label="Message Template 2" htmlFor="message2">
          <textarea
            id="message2"
            rows={4}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
            value={config.message2}
            onChange={(e) => handleConfigChange('message2', e.target.value)}
            disabled={isRunning}
          />
          <FileInput id="file2" file={config.file2} onChange={(f) => handleConfigChange('file2', f)} disabled={isRunning}/>
        </InputGroup>
      </div>

      {/* Numbers List */}
      <InputGroup label="Phone Numbers (one per line or comma-separated)" htmlFor="numbers" error={errors.numbers}>
        <textarea
          id="numbers"
          rows={6}
          className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.numbers ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="e.g., +15551234567"
          value={config.numbers.join('\n')}
          onChange={handleNumbersChange}
          disabled={isRunning}
        />
      </InputGroup>

      {/* Settings */}
      <div className="grid grid-cols-2 gap-4">
        <InputGroup label="Delay Between (s)" htmlFor="delayBetween" error={errors.delayBetween}>
          <input
            type="number"
            id="delayBetween"
            className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.delayBetween ? 'border-red-500' : 'border-gray-300'}`}
            value={config.delayBetween}
            onChange={(e) => handleConfigChange('delayBetween', Number(e.target.value))}
            min="1"
            disabled={isRunning}
          />
        </InputGroup>
        <InputGroup label="Action Delay (s)" htmlFor="sendActionDelay" error={errors.sendActionDelay}>
          <input
            type="number"
            id="sendActionDelay"
            className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.sendActionDelay ? 'border-red-500' : 'border-gray-300'}`}
            value={config.sendActionDelay}
            onChange={(e) => handleConfigChange('sendActionDelay', Number(e.target.value))}
            min="1"
            disabled={isRunning}
          />
        </InputGroup>
      </div>

      {/* Monitor Number */}
       <InputGroup label="Monitor Number (Optional)" htmlFor="monitorNumber" error={errors.monitorNumber}>
        <input
            type="text"
            id="monitorNumber"
            className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.monitorNumber ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Your number to get updates"
            value={config.monitorNumber}
            onChange={(e) => handleConfigChange('monitorNumber', e.target.value)}
            disabled={isRunning}
          />
      </InputGroup>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {campaignStatus === 'stopped' || campaignStatus === 'finished' ? (
            <button
            onClick={onStart}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
            >
            <PlayIcon className="w-5 h-5" />
            <span>Start Campaign</span>
            </button>
        ) : campaignStatus === 'running' ? (
            <>
                <button onClick={onPause} className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600">
                    <PauseIcon className="w-5 h-5" />
                    <span>Pause Campaign</span>
                </button>
                <button onClick={onStop} className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                    <StopIcon className="w-5 h-5" />
                    <span>Stop Campaign</span>
                </button>
            </>
        ) : ( // Paused
            <>
                <button onClick={onResume} className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
                    <PlayIcon className="w-5 h-5" />
                    <span>Resume Campaign</span>
                </button>
                <button onClick={onStop} className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                    <StopIcon className="w-5 h-5" />
                    <span>Stop Campaign</span>
                </button>
            </>
        )}
      </div>
    </div>
  );
};