import React, { useMemo, useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatArea } from './components/ChatArea';
import { InputArea } from './components/InputArea';
import { TranscriptView } from './components/TranscriptView';
import { RightPanel } from './components/RightPanel';
import { Tab, Message } from './types';
import { sendMessageToHeidi } from './services/geminiService';

const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.NOTE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [transcriptContent, setTranscriptContent] = useState('');

  const [visitReasons] = useState<string[]>([
    'Fever',
    'Physio follow-up',
    'Medication review',
    'Post-op wound check',
  ]);

  const keywordHistory = useMemo(() => {
    const keywordsFromMessages = messages
      .filter((message) => message.role === 'user')
      .flatMap((message) => extractClinicalKeywords(message.content));
    const keywordsFromTranscript = extractClinicalKeywords(transcriptContent);

    return [...keywordsFromMessages, ...keywordsFromTranscript];
  }, [messages, transcriptContent]);

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const responseText = await sendMessageToHeidi(messages, text);
      
      const aiMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Failed to get response", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscriptChange = useCallback((content: string) => {
    setTranscriptContent(content);
  }, []);

  const finalSummary = useMemo(() => {
    const assistantMessages = messages.filter(
      (message) => message.role === 'assistant'
    );

    if (assistantMessages.length === 0) {
      return '';
    }

    return assistantMessages[assistantMessages.length - 1]?.content ?? '';
  }, [messages]);

  return (
    <div className="flex h-screen w-screen bg-gray-100 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <Header />

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex gap-6">
            {Object.values(Tab).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex min-h-0 relative">
          <main className="flex-1 flex flex-col min-w-0">
            {activeTab === Tab.NOTE && (
              <>
                <ChatArea messages={messages} isLoading={isLoading} />
                <InputArea
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                />
              </>
            )}

            {activeTab === Tab.TRANSCRIPT && (
              <TranscriptView onTranscriptChange={handleTranscriptChange} />
            )}

            {activeTab === Tab.CONTEXT && (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Context view will summarise EMR, transcript, and Heidi&apos;s
                findings.
              </div>
            )}
          </main>

          <RightPanel
            visitReasons={visitReasons}
            keywordHistory={keywordHistory}
            finalSummary={finalSummary}
          />
        </div>
      </div>
    </div>
  );
};

const CLINICAL_KEYWORD_CANDIDATES: string[] = [
  'fever',
  'cough',
  'physio',
  'physiotherapy',
  'pain',
  'back pain',
  'chest pain',
  'shortness of breath',
  'sob',
  'hypertension',
  'diabetes',
  'pathology',
  'blood test',
  'x-ray',
  'ct',
  'mri',
  'medication',
  'allergy',
  'allergies',
  'rash',
  'infection',
  'antibiotic',
];

const extractClinicalKeywords = (text: string): string[] => {
  if (!text.trim()) {
    return [];
  }

  const lowerCased = text.toLowerCase();

  const matchedKeywords = CLINICAL_KEYWORD_CANDIDATES.filter((keyword) =>
    lowerCased.includes(keyword.toLowerCase())
  );

  return matchedKeywords;
};

export default App;
