// Redux Slice Setup for State Management with RTK Query

import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Provider } from 'react-redux';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import React from 'react';

// Message Type
export interface Message {
  id?: string;
  chatId: string;
  userId: string;
  content: string;
  images?: string;
  createdAt?: Date;
}

// Participant Type
export interface Account {
  id: string;
  username: string;
  password?: string;
  email: string;
  avatar: string;
}

// Chat Type
export interface Chat {
  id?: string;
  title: string;
  participants: { [key: string]: Account };
  ownerId: string;
  messages: Message[];
}

// Chats Slice - обновленный
export type ChatsState = {
  chats: Chat[];
  currentChatId: string | null;
};

const initialChatsState: ChatsState = {
  chats: [
  ],
  currentChatId: null,
};

const chatsSlice = createSlice({
  name: 'chats',
  initialState: initialChatsState,
  reducers: {
    addChat: (state, action: PayloadAction<Chat>) => {
      state.chats.push(action.payload);
    },
    setCurrentChatId: (state, action: PayloadAction<string>) => {
      state.currentChatId = action.payload;
    },
    setChats: (state, action: PayloadAction<Chat[]>) => {
      state.chats = action.payload;
    },
  },
});

export const { addChat, setCurrentChatId, setChats } = chatsSlice.actions;

// Current Chat Slice - Managing current chat data
type CurrentChatState = {
  currentChat: Chat | null;
};

const initialCurrentChatState: CurrentChatState = {
  currentChat: null
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
  account: null
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
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3030/' }),
  endpoints: (builder) => ({
    getChatList: builder.query<Chat[], void>({
      query: () => ({
        url: 'chats',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      }),
      transformResponse: (response: { data: Chat[] }) => response.data,
    }),
    getChat: builder.query<Chat, string>({
      query: (chatId) => ({
        url: `chats/${chatId}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      }),
      transformResponse: (response: Chat) => {
        return {
          ...response,
          participants: typeof response.participants === 'string'
            ? JSON.parse(response.participants)
            : response.participants,
        } as Chat;
      },
    }),
    getMessagesByChatId: builder.query<Message[], string>({
      query: (chatId) => ({
        url: `messages`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        params: {
          chatId,
        },
      }),
      transformResponse: (response: { data: Message[] }) => response.data,
    }),
    createUser: builder.mutation<Account, Partial<Account>>({
      query: (newUser) => ({
        url: 'users',
        method: 'POST',
        body: newUser,
      }),
    }),
    authenticateUser: builder.mutation<{ accessToken: string; user: Account }, { email: string; password: string }>({
      query: (credentials) => ({
        url: 'authentication',
        method: 'POST',
        body: {
          strategy: 'local',
          ...credentials,
        },
      }),
    }),
    getAccountByToken: builder.query<Account, void>({
      query: () => ({
        url: 'users',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        params: {
          $limit: 10,
        },
      }),
      transformResponse: (response: { data: Account[] }) => {
        return response.data[0];
      },
    }),
    sendMessage: builder.mutation<Message, Partial<Message>>({
      query: (newMessage) => {
        return {
          url: 'messages',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: {
            chatId: newMessage.chatId,
            userId: newMessage.userId,
            content: newMessage.content,
            images: newMessage.images,
          },
        };
      },
    }),
    createChat: builder.mutation<Chat, Partial<Chat>>({
      query: (newChat) => {
        const participants = Object.keys(newChat.participants || {}).reduce((acc, userId, index) => {
          const participant = newChat.participants?.[userId];
          if (participant) {
            acc[`user${index + 1}`] = participant;
          }
          return acc;
        }, {} as { [key: string]: Account });

        return {
          url: 'chats',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: {
            id: newChat.id,
            title: newChat.title,
            owner_id: newChat.ownerId,
            participants,
          },
        };
      },
    }),
  }),
});

export const { useSendMessageMutation, useGetMessagesByChatIdQuery, useGetChatQuery, useGetChatListQuery, useCreateUserMutation, useAuthenticateUserMutation, useGetAccountByTokenQuery, useCreateChatMutation } = apiSlice;

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
