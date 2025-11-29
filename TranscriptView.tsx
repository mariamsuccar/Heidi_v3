import React, { useState, useEffect } from 'react';

interface TranscriptViewProps {
  onTranscriptChange: (content: string) => void;
}

const MAX_TRANSCRIPT_LENGTH = 10000;

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  onTranscriptChange,
}) => {
  const [transcriptText, setTranscriptText] = useState('');

  useEffect(() => {
    onTranscriptChange(transcriptText);
  }, [transcriptText, onTranscriptChange]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    if (nextValue.length > MAX_TRANSCRIPT_LENGTH) {
      return;
    }
    setTranscriptText(nextValue);
  };

  const remainingCharacters = MAX_TRANSCRIPT_LENGTH - transcriptText.length;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="h-full border border-dashed border-gray-200 rounded-xl bg-gray-50 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Paste transcript from audio AI
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Paste the raw consultation transcript here. Heidi will use this
                to enrich the note and visit context.
              </p>
            </div>
          </div>

          <textarea
            value={transcriptText}
            onChange={handleChange}
            placeholder="e.g. Patient reports three days of fever, dry cough, and sore throat. Denies shortness of breath or chest pain..."
            className="flex-1 w-full resize-none border-0 bg-transparent px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
          />
        </div>
      </div>

      <div className="px-6 pb-4 text-xs text-gray-400 flex items-center justify-between">
        <span>
          Review and redact before saving. Do not paste identifiers that are
          not needed for care.
        </span>
        <span>{remainingCharacters} characters remaining</span>
      </div>
    </div>
  );
};


