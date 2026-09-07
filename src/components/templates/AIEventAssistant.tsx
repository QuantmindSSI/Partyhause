import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Wand2, 
  Check,
  Edit3,
  ChevronRight,
  ArrowLeft,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { apiPost } from '@/lib/api-client';

const generateId = () => crypto.randomUUID();

/**
 * Server limits, mirrored from server/lib/event-chat.ts.
 *
 * Duplicated deliberately. Importing them would pull a server module into the
 * client bundle, and the alternative, letting the server reject an oversized
 * conversation with a 400, turns a recoverable UI state into a dead end mid
 * planning session.
 */
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 4000;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * The extraction contract, mirroring ExtractedEventData in
 * server/lib/event-extraction.ts.
 */
interface ExtractedEventData {
  templateId?: string;
  eventName?: string;
  description?: string;
  eventDate?: string;
  eventTime?: string;
  location?: string;
  expectedGuests?: number;
  budget?: number;
  theme?: string;
  specialRequests?: string;
  formData?: Record<string, any>;
}

/** The body of a 200 from POST /api/ai/chat (server/routes/ai.ts:60). */
interface ChatTurnResult {
  reply: string;
  extracted: ExtractedEventData;
  /** True once the planner has the core fields; this is what opens the review step. */
  complete: boolean;
  source: 'llm' | 'heuristic';
}

interface AIEventAssistantProps {
  onComplete: (data: ExtractedEventData) => void;
  onBack: () => void;
  initialTemplate?: string;
}

const WELCOME_MESSAGE = `Hi! I'm your AI Event Planner. 

Instead of filling out long forms, just tell me about your event in your own words. For example:

• "I'm planning a 30th birthday party for about 20 friends. I want a rooftop venue with cocktails and a DJ. Budget is around $2000."

• "We need to organize a team offsite for 15 people. Thinking of a day retreat with workshops and team building activities."

• "My daughter is turning 5 and loves unicorns. Need a kids party with games, face painting, and a bounce house."

What kind of event are you planning?`;

export default function AIEventAssistant({ 
  onComplete, 
  onBack,
  initialTemplate 
}: AIEventAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: WELCOME_MESSAGE,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedEventData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * Send the conversation to the planner and append its reply.
   *
   * This used to be `setTimeout(1500)` around a local function that matched
   * keywords with `String.includes` and pulled numbers out with two regexes.
   * It never made a network call. The word "AI" on the button was decoration,
   * and the extraction it produced was wrong often enough to be worse than an
   * empty form: `/\$?(\d+,?\d*)/` matched the "30" in "30th birthday" and
   * called it a $30 budget.
   *
   * `/api/ai/chat` has existed the whole time, complete with an Azure OpenAI
   * layer, a chrono-node date parser, a weighted template lexicon and a
   * deterministic fallback for when no LLM is configured. It had zero callers.
   */
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;

    if (trimmed.length > MAX_MESSAGE_CHARS) {
      setError(`That message is too long. Keep it under ${MAX_MESSAGE_CHARS.toLocaleString()} characters.`);
      return;
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    const history = [...messages, userMessage];

    // The server accepts at most MAX_MESSAGES entries and rejects the whole
    // request otherwise. Trimming the oldest turns here keeps a long planning
    // session working instead of failing it with a 400 at turn 41.
    const wireMessages = history
      .slice(-MAX_MESSAGES)
      .map(({ role, content }) => ({ role, content }));

    setMessages(history);
    setInput('');
    setError(null);
    setIsProcessing(true);

    const { data, error: apiError } = await apiPost<{ success: boolean; data: ChatTurnResult }>(
      '/api/ai/chat',
      { messages: wireMessages },
    );

    setIsProcessing(false);

    if (apiError || !data?.data) {
      // Every failure path is named. A silent catch here would leave the user
      // watching a spinner that already stopped.
      setError(
        apiError?.status === 429
          ? 'The planner is rate limited right now. Wait a few minutes, or skip ahead and fill the form in yourself.'
          : apiError?.message || 'The planner could not be reached. You can skip ahead and fill the form in yourself.',
      );
      return;
    }

    const turn = data.data;

    setMessages((prev) => [
      ...prev,
      { id: generateId(), role: 'assistant', content: turn.reply, timestamp: new Date() },
    ]);

    if (turn.complete && turn.extracted) {
      // initialTemplate is an explicit choice the user already made on the
      // previous step, so it outranks whatever the planner inferred.
      setExtractedData({
        ...turn.extracted,
        templateId: initialTemplate || turn.extracted.templateId,
      });
      setShowPreview(true);
    }
  };

  const handleEditData = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
  };

  const handleConfirm = () => {
    if (extractedData) {
      onComplete(extractedData);
    }
  };

  const updateExtractedField = (field: keyof ExtractedEventData, value: any) => {
    if (extractedData) {
      setExtractedData({ ...extractedData, [field]: value });
    }
  };

  if (showPreview && extractedData) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card className="border-2 border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-pink-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">AI-Generated Event Details</CardTitle>
                <p className="text-sm text-gray-600">Review and edit before continuing</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Event Name</Label>
                  <Input
                    value={extractedData.eventName || ''}
                    onChange={(e) => updateExtractedField('eventName', e.target.value)}
                    placeholder="Event name"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <Textarea
                    value={extractedData.description || ''}
                    onChange={(e) => updateExtractedField('description', e.target.value)}
                    placeholder="Event description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Expected Guests</Label>
                    <Input
                      type="number"
                      value={extractedData.expectedGuests || ''}
                      onChange={(e) => updateExtractedField('expectedGuests', parseInt(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Budget ($)</Label>
                    <Input
                      type="number"
                      value={extractedData.budget || ''}
                      onChange={(e) => updateExtractedField('budget', parseInt(e.target.value) || undefined)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Template</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={extractedData.templateId}
                    onChange={(e) => updateExtractedField('templateId', e.target.value)}
                  >
                    <option value="birthday">Birthday Party (Adult)</option>
                    <option value="kids-birthday">Kids Birthday</option>
                    <option value="wedding">Wedding</option>
                    <option value="conference">Conference</option>
                    <option value="product-launch">Product Launch</option>
                    <option value="fundraiser">Fundraiser</option>
                    <option value="festival">Festival</option>
                    <option value="travel">Group Travel</option>
                    <option value="block-party">Block Party</option>
                    <option value="workshop">Workshop/Class</option>
                    <option value="hackathon">Hackathon</option>
                  </select>
                </div>
                <Button onClick={handleSaveEdit} className="w-full">
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Template Type</span>
                    <span className="font-medium capitalize">{extractedData.templateId?.replace(/-/g, ' ')}</span>
                  </div>
                  {extractedData.eventName && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Event Name</span>
                      <span className="font-medium">{extractedData.eventName}</span>
                    </div>
                  )}
                  {extractedData.expectedGuests && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Expected Guests</span>
                      <span className="font-medium">{extractedData.expectedGuests}</span>
                    </div>
                  )}
                  {extractedData.budget && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Budget</span>
                      <span className="font-medium">${extractedData.budget.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="py-2">
                    <span className="text-gray-600 block mb-1">Description</span>
                    <p className="text-sm bg-gray-50 p-3 rounded">{extractedData.description}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleEditData} className="flex-1">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Details
                  </Button>
                  <Button onClick={handleConfirm} className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500">
                    <Check className="w-4 h-4 mr-2" />
                    Looks Good!
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Button variant="ghost" onClick={onBack} className="w-full">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chat
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI Event Planner</h2>
            <p className="text-sm text-gray-500">Just chat naturally about your event</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Messages */}
      <Card className="flex-1 mb-4 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'assistant' 
                      ? 'bg-gradient-to-br from-orange-500 to-pink-500' 
                      : 'bg-gray-200'
                  }`}>
                    {message.role === 'assistant' ? (
                      <Bot className="w-4 h-4 text-white" />
                    ) : (
                      <User className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 whitespace-pre-line ${
                    message.role === 'assistant'
                      ? 'bg-gray-100 text-gray-800 rounded-tl-none'
                      : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-tr-none'
                  }`}>
                    {message.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* A failed turn has to be visible. Without this the spinner simply stops
          and the user retypes the same message into the same failure. */}
      {error && (
        <div
          role="alert"
          className="mb-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Describe your event..."
          className="flex-1"
          disabled={isProcessing}
        />
        <Button 
          onClick={handleSend} 
          disabled={!input.trim() || isProcessing}
          className="bg-gradient-to-r from-orange-500 to-pink-500"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
      
      <p className="text-xs text-center text-gray-500 mt-2">
        Press Enter to send • The AI will gather details and fill out forms for you
      </p>
    </div>
  );
}

// Simple Label component since we need it
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`block text-sm font-medium text-gray-700 mb-1 ${className || ''}`}>{children}</label>;
}
