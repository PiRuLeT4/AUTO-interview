import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../../core/i18n';

interface CVUploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onFileRemove: () => void;
  maxSizeMB?: number;
}

export const CVUploadZone: React.FC<CVUploadZoneProps> = ({
  onFileSelect,
  selectedFile,
  onFileRemove,
  maxSizeMB = 5,
}) => {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = ['.pdf', '.docx'];
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const validateAndSelectFile = (file: File) => {
    setErrorMessage(null);

    const isExtensionValid = allowedExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
    const isMimeValid = allowedMimeTypes.includes(file.type);

    if (!isExtensionValid && !isMimeValid) {
      setErrorMessage(t.cvErrorFormat);
      return;
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMessage(t.cvErrorSize);
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleNativeChange}
      />

      {selectedFile ? (
        <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl shadow-sm">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-slate-200 truncate">{selectedFile.name}</p>
              <p className="text-xs text-slate-400 font-mono">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFileRemove}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            title={t.cvRemoveFile}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={handleZoneClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-colors duration-150 flex flex-col items-center justify-center gap-2.5 ${
            isDragging
              ? 'border-blue-500 bg-blue-500/5'
              : 'border-slate-700/70 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/70'
          }`}
        >
          <div className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-300">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-300">
              {t.cvDropzoneTitle}{' '}
              <span className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2">
                {t.cvDropzoneOr}
              </span>
            </p>
            <p className="text-xs text-slate-500 font-normal">{t.cvDropzoneFormats}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 text-rose-400 text-xs px-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
