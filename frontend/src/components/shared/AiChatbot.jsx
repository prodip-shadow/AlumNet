'use client';

import React, { useState, useRef, useEffect } from 'react';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Sparkles,
  Bot,
  X,
  Send,
  Loader2,
  MapPin,
  Briefcase,
  GraduationCap,
  Zap,
  ArrowRight,
  User,
  FolderGit2,
} from 'lucide-react';
import Link from 'next/link';

const SUGGESTIONS = [
  'Alumni in Dhaka',
  'Software engineers with React',
  'Alumni from 2018-19 session',
  'Alumni working on Machine Learning',
];

export default function AiChatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hi there! I am your AI search assistant. Ask me to discover alumni by location, skill, session, or company.',
      suggestions: SUGGESTIONS,
    },
  ]);

  const chatbotRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Click outside to close chatbot
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatbotRef.current && !chatbotRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend) => {
    const queryText = (textToSend || prompt).trim();
    if (!queryText || loading) return;

    if (!user) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: 'user', text: queryText },
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: 'Please log in to your account to search alumni using the AI Assistant.',
          isAuthPrompt: true,
        },
      ]);
      setPrompt('');
      return;
    }

    const userMessageId = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, sender: 'user', text: queryText },
    ]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await api.post('/api/ai-assistant/query', {
        prompt: queryText,
      });

      if (res.data?.success) {
        const filters = res.data.filters || {};
        const alumniList = res.data.alumni || [];

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'assistant',
            text:
              alumniList.length > 0
                ? `Found ${alumniList.length} matching alumni:`
                : 'No alumni currently match those criteria. Try a broader search.',
            filters,
            alumni: alumniList,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'assistant',
            text:
              res.data?.message ||
              'Please specify a location, skill, session, or company in your query.',
          },
        ]);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        'Could not connect to the AI Assistant. Please try again.';

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: errorMsg,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={chatbotRef}>
      {/* Circular Floating Launcher Button (Clean & Perfectly Round Robot Face) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="AI Alumni Assistant"
          className="group relative flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer ring-4 ring-primary/20"
        >
          <Bot className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
        </button>
      )}

      {/* Minimalist Smooth Chat Window */}
      {isOpen && (
        <div className="w-[90vw] sm:w-[380px] h-[500px] max-h-[80vh] bg-card border border-border/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header (Minimal & Sleek) */}
          <div className="px-4 py-3 border-b border-border/80 bg-background/50 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-xs text-foreground">
                  AI Alumni Assistant
                </h3>
               
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs scrollbar-none">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                    AI
                  </div>
                )}

                <div
                  className={`max-w-[85%] space-y-2 rounded-xl p-3 leading-relaxed text-xs transition-all ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'bg-muted/40 text-foreground border border-border/50'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Filter Badges with Lucide Icons */}
                  {msg.filters && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {msg.filters.skill && (
                        <Badge variant="outline" className="text-[10px] gap-1 py-0 px-1.5 font-normal bg-background/60">
                          <Zap className="h-2.5 w-2.5 text-amber-500" />
                          <span>{msg.filters.skill}</span>
                        </Badge>
                      )}
                      {msg.filters.location && (
                        <Badge variant="outline" className="text-[10px] gap-1 py-0 px-1.5 font-normal bg-background/60">
                          <MapPin className="h-2.5 w-2.5 text-primary" />
                          <span>{msg.filters.location}</span>
                        </Badge>
                      )}
                      {msg.filters.session && (
                        <Badge variant="outline" className="text-[10px] gap-1 py-0 px-1.5 font-normal bg-background/60">
                          <GraduationCap className="h-2.5 w-2.5 text-emerald-600" />
                          <span>Session: {msg.filters.session}</span>
                        </Badge>
                      )}
                      {msg.filters.project && (
                        <Badge variant="outline" className="text-[10px] gap-1 py-0 px-1.5 font-normal bg-background/60">
                          <FolderGit2 className="h-2.5 w-2.5 text-blue-500" />
                          <span>{msg.filters.project}</span>
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Matching Alumni Mini Cards */}
                  {msg.alumni && msg.alumni.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {msg.alumni.map((alum) => (
                        <Link
                          key={alum.id}
                          href={`/alumni/${alum.id}`}
                          onClick={() => setIsOpen(false)}
                          className="block bg-card p-2 rounded-xl border border-border/70 shadow-2xs space-y-1 text-foreground hover:border-primary/50 hover:bg-muted/30 transition-all group cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 border border-border shrink-0">
                              {alum.profileImageUrl && (
                                <AvatarImage src={alum.profileImageUrl} alt={alum.name} />
                              )}
                              <AvatarFallback className="bg-primary text-primary-foreground text-[9px] font-bold">
                                {alum.name ? alum.name.slice(0, 2).toUpperCase() : 'AL'}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                                {alum.name}
                              </h4>
                              {(alum.currentPosition || alum.currentCompany) && (
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {alum.currentPosition} {alum.currentCompany ? `@ ${alum.currentCompany}` : ''}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px]">
                            <span className="text-muted-foreground truncate max-w-[150px]">
                              {alum.currentLocation || alum.session || 'PSTU Alumni'}
                            </span>
                            <span className="text-primary font-medium group-hover:underline flex items-center gap-0.5">
                              <span>View Profile</span>
                              <ArrowRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5" />
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Suggested Query Chips */}
                  {msg.suggestions && (
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {msg.suggestions.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(sug)}
                          className="text-[10px] bg-background hover:bg-primary hover:text-primary-foreground border border-border px-2 py-0.5 rounded-md transition-all text-muted-foreground text-left cursor-pointer"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Auth prompt */}
                  {msg.isAuthPrompt && (
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button size="sm" className="h-6.5 text-[11px] font-medium mt-1">
                        Log In
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-center text-muted-foreground text-xs p-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>Searching database...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Minimalist Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 border-t border-border/80 bg-background/50 backdrop-blur-md flex items-center gap-1.5"
          >
            <Input
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Search alumni by skill or city..."
              disabled={loading}
              className="h-8.5 text-xs rounded-lg flex-1 bg-card border-border/80 shadow-none focus-visible:ring-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !prompt.trim()}
              className="h-8.5 w-8.5 rounded-lg shrink-0 cursor-pointer shadow-2xs"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
