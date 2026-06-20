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
  Loader2
} from 'lucide-react';

const generateId = () => crypto.randomUUID();

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

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
  const [extractedData, setExtractedData] = useState<ExtractedEventData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // Simulate AI processing
    setTimeout(() => {
      const aiResponse = generateAIResponse(input, messages.length);
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: aiResponse.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (aiResponse.extractedData) {
        setExtractedData(aiResponse.extractedData);
        setShowPreview(true);
      }
      
      setIsProcessing(false);
    }, 1500);
  };

  const generateAIResponse = (userInput: string, messageCount: number): { message: string; extractedData?: ExtractedEventData } => {
    const lowerInput = userInput.toLowerCase();
    
    // Simple extraction logic (in production, this would call an AI API)
    let extractedData: ExtractedEventData | undefined;
    
    if (messageCount >= 2 || (lowerInput.includes('budget') && lowerInput.includes('guest'))) {
      // Try to extract event details
      let templateId = 'birthday';
      if (lowerInput.includes('wedding')) templateId = 'wedding';
      else if (lowerInput.includes('conference') || lowerInput.includes('meeting')) templateId = 'conference';
      else if (lowerInput.includes('product') || lowerInput.includes('launch')) templateId = 'product-launch';
      else if (lowerInput.includes('fundraiser') || lowerInput.includes('charity')) templateId = 'fundraiser';
      else if (lowerInput.includes('festival') || lowerInput.includes('concert')) templateId = 'festival';
      else if (lowerInput.includes('travel') || lowerInput.includes('trip')) templateId = 'travel';
      else if (lowerInput.includes('block party') || lowerInput.includes('neighborhood')) templateId = 'block-party';
      else if (lowerInput.includes('workshop') || lowerInput.includes('class')) templateId = 'workshop';
      else if (lowerInput.includes('hackathon')) templateId = 'hackathon';
      else if (lowerInput.includes('kid') || lowerInput.includes('child')) templateId = 'kids-birthday';
      
      // Extract guest count
      const guestMatch = userInput.match(/(\d+)\s*(people|guests|attendees|friends|family)/i);
      const expectedGuests = guestMatch ? parseInt(guestMatch[1]) : undefined;
      
      // Extract budget
      const budgetMatch = userInput.match(/\$?(\d+,?\d*)\s*(budget|dollars)?/i);
      const budget = budgetMatch ? parseInt(budgetMatch[1].replace(',', '')) : undefined;
      
      // Extract event name if provided
      const namePatterns = [
        /planning\s+(?:a|an)\s+(.+?)\s+(?:party|event|celebration|gathering)/i,
        /(.+?)\s+(?:party|event|celebration|gathering)/i,
        /for\s+(.+?)(?:'s|'s\s+birthday)/i,
      ];
      let eventName;
      for (const pattern of namePatterns) {
        const match = userInput.match(pattern);
        if (match) {
          eventName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
          break;
        }
      }
      
      extractedData = {
        templateId: initialTemplate || templateId,
        eventName,
        description: userInput,
        expectedGuests,
        budget,
        specialRequests: userInput,
        formData: {
          expected_guest_count: expectedGuests,
          budget_estimate: budget,
        }
      };
      
      return {
        message: `Perfect! I've gathered the key details. Let me show you what I understood, and you can review and adjust before we continue.`,
        extractedData
      };
    }
    
    // Continue conversation
    if (lowerInput.includes('birthday')) {
      return {
        message: `Great! A birthday celebration! 🎉\n\nTell me more:\n• Who is the celebration for and what age?\n• How many guests are you expecting?\n• Any specific venue preference (home, restaurant, outdoor)?\n• What's your approximate budget?`
      };
    }
    
    if (lowerInput.includes('wedding')) {
      return {
        message: `Congratulations! 💍 Planning a wedding is exciting!\n\nHelp me understand:\n• What's the wedding style you're envisioning?\n• Roughly how many guests?\n• Any specific date or season in mind?\n• Indoor, outdoor, or destination?`
      };
    }
    
    if (lowerInput.includes('corporate') || lowerInput.includes('team') || lowerInput.includes('work')) {
      return {
        message: `Sounds like a professional event! 📊\n\nA few questions:\n• Is this a meeting, conference, team building, or celebration?\n• How many people from your team?\n• Half-day, full-day, or multi-day?\n• Any specific goals for this event?`
      };
    }
    
    return {
      message: `Interesting! Tell me more about this event:\n\n• What's the occasion?\n• How many people are coming?\n• Any specific date or time of year?\n• Do you have a budget in mind?\n• Any special requirements or themes?`
    };
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
