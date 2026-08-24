import { create } from 'zustand';
import { ChatMessage } from '../types/lead';
import { agencyConfig } from '../config/agencyConfig';

interface ChatStore {
  isOpen: boolean;
  messages: ChatMessage[];
  isTyping: boolean;
  
  // Actions
  setIsOpen: (isOpen: boolean) => void;
  toggleChat: () => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setIsTyping: (isTyping: boolean) => void;
  resetChat: () => void;
}

const initialMessages: ChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'bot',
    text: `¡Hola! Soy ${agencyConfig.aiAgent.botName}. Estoy aquí para ayudarte a encontrar la propiedad ideal en Santiago o gestionar la venta/arriendo de tu inmueble. 

¿Qué tipo de propiedad estás buscando hoy o en qué comuna te gustaría residir?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
];

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  messages: initialMessages,
  isTyping: false,

  setIsOpen: (isOpen) => set({ isOpen }),
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

  addMessage: (msgData) => {
    const newMsg: ChatMessage = {
      ...msgData,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    set((state) => ({
      messages: [...state.messages, newMsg],
    }));
  },

  setIsTyping: (isTyping) => set({ isTyping }),

  resetChat: () => set({ messages: initialMessages }),
}));
