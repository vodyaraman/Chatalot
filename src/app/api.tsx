// Redux Slice Setup for State Management with RTK Query

import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Provider } from 'react-redux';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import React from 'react';

// Message Type
export interface Message {
  id: string;
  userId: string;
  content: string;
  images: string[];
}

// Participant Type
export interface Account {
  id: string;
  username: string;
  email: string;
  avatar: string;
}

// Chat Type
export interface Chat {
  id: string;
  title: string;
  participants: { [key: string]: Account };
  ownerId: string;
  messages: Message[];
}

// Chats Slice - обновленный
export type ChatsState = {
  chats: { id: string, title: string }[];
  currentChatId: string | null;
};

const initialChatsState: ChatsState = {
  chats: [
    { id: 'chat1', title: 'Чат с друзьями' },
    { id: 'chat2', title: 'Рабочая группа' },
    { id: 'chat3', title: 'Семейный чат' },
  ],
  currentChatId: null,
};

const chatsSlice = createSlice({
  name: 'chats',
  initialState: initialChatsState,
  reducers: {
    addChat: (state, action: PayloadAction<{ id: string, title: string }>) => {
      state.chats.push(action.payload);
    },
    setCurrentChatId: (state, action: PayloadAction<string>) => {
      state.currentChatId = action.payload;
    },
  },
});

export const { addChat, setCurrentChatId } = chatsSlice.actions;

// Current Chat Slice - Managing current chat data
type CurrentChatState = {
  currentChat: Chat | null;
};

const initialCurrentChatState: CurrentChatState = {
  currentChat: {
    id: 'chat1',
    title: 'Чат с друзьями',
    participants: {
      user123: {
        id: 'user123',
        username: 'Unknown User',
        email: 'no.email@example.com',
        avatar: '/unknown.png',
      },
      friend1: {
        id: 'friend1',
        username: 'Друг 1',
        email: 'friend1@example.com',
        avatar: '/unknown.png',
      },
      friend2: {
        id: 'friend2',
        username: 'Друг 2',
        email: 'friend2@example.com',
        avatar: '/unknown.png',
      },
    },
    ownerId: 'user123',
    messages: [
      {
        id: 'message1',
        userId: 'friend1',
        content: 'Привет! Как дела?',
        images: [],
      },
      {
        id: 'message2',
        userId: 'user123',
        content: 'Хорошо, спасибо!',
        images: [],
      },
    ],
  },
};


const currentChatSlice = createSlice({
  name: 'currentChat',
  initialState: initialCurrentChatState,
  reducers: {
    setCurrentChatTitle: (state, action: PayloadAction<string>) => {
      if (state.currentChat) {
        state.currentChat.title = action.payload;
      }
    },
            setCurrentChat: (state, action: PayloadAction<Chat>) => {
      state.currentChat = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      if (state.currentChat) {
        state.currentChat.messages.push(action.payload);
      }
    },
    addParticipant: (state, action: PayloadAction<Account>) => {
      if (state.currentChat) {
        state.currentChat.participants[action.payload.id] = action.payload;
      }
    },
    removeParticipant: (state, action: PayloadAction<string>) => {
      if (state.currentChat) {
        delete state.currentChat.participants[action.payload];
      }
    },
  },
});

export const { setCurrentChat, addMessage, addParticipant, removeParticipant, setCurrentChatTitle } = currentChatSlice.actions;

// Participants Slice - Managing participants data
type AccountState = {
  account: Account | null;
};

const initialAccountState: AccountState = {
  account: {
    id: 'user123',
    username: 'Unknown User',
    email: 'no.email@example.com',
    avatar: '/unknown.png',
  },
};

const accountSlice = createSlice({
  name: 'account',
  initialState: initialAccountState,
  reducers: {
    setAccount: (state, action: PayloadAction<Account>) => {
      state.account = action.payload;
    },
    clearAccount: (state) => {
      state.account = null;
    },
  },
});

export const { setAccount, clearAccount } = accountSlice.actions;

// API Slice - Managing API requests with RTK Query
const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getChatList: builder.query<{ id: string; title: string }[], void>({
      query: () => 'chats/list',
    }),
    getChat: builder.query<Chat, string>({
      query: (chatId) => `chats/${chatId}`,
    }),
  }),
});

export const { useGetChatQuery, useGetChatListQuery } = apiSlice;

const controlSlice = createSlice({
  name: 'control',
  initialState: {
    isSidebarOpen: true,
    isProfileVisible: false,
  },
  reducers: {
    toggleProfile: (state) => {
      state.isProfileVisible = !state.isProfileVisible;
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
      },
});

export const { toggleSidebar, toggleProfile } = controlSlice.actions;

// Store Setup
const store = configureStore({
  reducer: {
    chats: chatsSlice.reducer,
    currentChat: currentChatSlice.reducer,
    account: accountSlice.reducer,
    control: controlSlice.reducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Redux Provider Wrapper
const ReduxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={store}>{children}</Provider>
);

export default ReduxProvider;
