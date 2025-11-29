import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface RightPanelProps {
  visitReasons: string[];
  keywordHistory: string[];
  finalSummary: string;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  visitReasons,
  keywordHistory,
  finalSummary,
}) => {
  const uniqueKeywords = Array.from(new Set(keywordHistory)).slice(0, 20);

  const [isCopying, setIsCopying] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const emrTargets = useMemo(
    () => [
      'Best Practice – Progress notes',
      'MedicalDirector – Consultation notes',
      'Genie – Clinical notes',
      'Zedmed – Progress notes',
      'Epic – Visit note / Progress note',
      'Cerner – Clinical note',
      'TrakCare – Clinical documentation',
    ],
    []
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const recognitionConstructor =
      (window as unknown as { webkitSpeechRecognition?: unknown })
        .webkitSpeechRecognition ||
      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;

    if (recognitionConstructor) {
      setVoiceSupported(true);
    }
  }, []);

  const handleCopySummary = useCallback(async () => {
    if (!finalSummary.trim()) {
      setCopyError('No summary available yet. Ask Heidi to generate a note.');
      return;
    }

    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      setCopyError(
        'Clipboard access is not available in this browser. Please copy manually.'
      );
      return;
    }

    try {
      setCopyError(null);
      setIsCopying(true);
      await navigator.clipboard.writeText(finalSummary);
      setTimeout(() => setIsCopying(false), 1500);
    } catch (error) {
      console.error('Failed to copy summary to clipboard', error);
      setCopyError('Unable to copy to clipboard. Please try again.');
      setIsCopying(false);
    }
  }, [finalSummary]);

  const handleToggleVoice = useCallback(() => {
    if (!voiceSupported || typeof window === 'undefined') {
      return;
    }

    const recognitionConstructor =
      (window as unknown as { webkitSpeechRecognition?: any })
        .webkitSpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition;

    if (!recognitionConstructor) {
      return;
    }

    const recognition = new recognitionConstructor();
    recognition.lang = 'en-AU';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .toLowerCase();

      if (transcript.includes('send to emr') || transcript.includes('send note')) {
        void handleCopySummary();
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event?.error);
      setCopyError('Voice trigger error. Please try again or click the button.');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      setIsListening(true);
      recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition', error);
      setCopyError('Unable to start voice trigger on this device.');
      setIsListening(false);
    }
  }, [handleCopySummary, voiceSupported]);

  return (
    <aside className="w-80 border-l border-gray-200 bg-gray-50 h-full flex-shrink-0 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section className="border border-indigo-100 bg-white rounded-lg p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Send to EMR
              </h2>
              <p className="text-[11px] text-gray-500">
                Copies the latest Heidi summary so you can paste directly into
                your EMR note field.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {voiceSupported && (
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`h-8 w-8 rounded-full border text-[11px] flex items-center justify-center ${
                    isListening
                      ? 'bg-red-50 border-red-400 text-red-600'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-400 hover:text-indigo-600'
                  }`}
                  aria-label="Voice trigger: say 'send to EMR'"
                >
                  🎙
                </button>
              )}
              <button
                type="button"
                onClick={handleCopySummary}
                className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!finalSummary.trim() || isCopying}
              >
                {isCopying ? 'Copied' : 'Send to EMR'}
              </button>
            </div>
          </div>

          {copyError && (
            <p className="text-[11px] text-red-500 mt-1">{copyError}</p>
          )}

          <div className="mt-2">
            <label
              htmlFor="emr-destination"
              className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1"
            >
              EMR destination
            </label>
            <select
              id="emr-destination"
              className="w-full text-[11px] text-gray-700 border border-gray-200 rounded-md bg-gray-50 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              defaultValue={emrTargets[0]}
            >
              {emrTargets.map((target) => (
                <option key={target} value={target}>
                  {target}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Recent reasons to see doctor
          </h2>
          <div className="space-y-1">
            {visitReasons.length === 0 ? (
              <p className="text-xs text-gray-400">
                No recent reasons recorded yet.
              </p>
            ) : (
              visitReasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-md bg-white text-sm text-gray-800 border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                >
                  {reason}
                </button>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Keywords Heidi found in EMR
          </h2>
          {uniqueKeywords.length === 0 ? (
            <p className="text-xs text-gray-400">
              Keywords from My Health Record searches will appear here, to help
              focus the discussion and prescriptions.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {uniqueKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center px-2 py-1 rounded-full bg-white text-xs text-gray-800 border border-gray-200"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <p className="text-[10px] text-gray-400">
          Selecting a reason or keyword can help Heidi generate a focused note
          and prescription, reducing time spent reviewing long records.
        </p>
      </div>
    </aside>
  );
};


