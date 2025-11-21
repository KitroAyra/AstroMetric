
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ModelSettings } from '../types';
import { chatWithFlightData } from '../services/geminiService';
import { MessageCircle, Send, Image as ImageIcon, X, Minimize, Loader2 } from 'lucide-react';

interface Props {
  contextSummary: string;
  modelSettings: ModelSettings;
}

export const AIChat: React.FC<Props> = ({ contextSummary, modelSettings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
      { id: '0', role: 'model', text: '你好！我是 AstroAI。我已经分析了您的遥测数据。请问您对异常情况有什么疑问，或者需要上传火箭部件的照片进行分析吗？', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: input,
        timestamp: Date.now(),
        image: selectedImage || undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    const currentImage = selectedImage; 
    setSelectedImage(null); 

    try {
        const history = messages.map(m => ({ role: m.role, text: m.text }));
        const responseText = await chatWithFlightData(history, userMsg.text, contextSummary, modelSettings, currentImage || undefined);
        
        const botMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, botMsg]);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            setSelectedImage(base64Data); 
        };
        reader.readAsDataURL(file);
    }
  };

  if (!isOpen) {
    return (
        <button 
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg shadow-blue-900/50 transition-all hover:scale-105 z-50 flex items-center gap-2"
        >
            <MessageCircle size={24} />
            <span className="font-semibold hidden md:inline">AI 助手</span>
        </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800 p-3 flex justify-between items-center border-b border-slate-700">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-semibold text-slate-100">AstroAI 指令台</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <Minimize size={18} />
            </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/90">
            {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl p-3 text-sm ${
                        msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                    }`}>
                        {msg.image && (
                            <div className="mb-2 rounded overflow-hidden">
                                <span className="text-xs italic opacity-70">[图片已附]</span>
                            </div>
                        )}
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-slate-800 p-3 rounded-xl rounded-bl-none border border-slate-700">
                        <Loader2 size={16} className="animate-spin text-blue-400" />
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-slate-800 border-t border-slate-700">
            {selectedImage && (
                <div className="flex items-center gap-2 mb-2 bg-slate-700 p-2 rounded text-xs text-slate-300">
                    <ImageIcon size={12} /> 图片已准备好分析
                    <button onClick={() => setSelectedImage(null)} className="ml-auto text-slate-400 hover:text-white">
                        <X size={14} />
                    </button>
                </div>
            )}
            <div className="flex gap-2">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-slate-400 hover:text-blue-400 p-2 rounded-full hover:bg-slate-700 transition-colors"
                    title="上传图片进行分析"
                >
                    <ImageIcon size={20} />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                />
                <input 
                    type="text"
                    className="flex-1 bg-slate-900 border border-slate-600 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="向我询问有关异常的问题..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                    onClick={handleSend}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    </div>
  );
};
