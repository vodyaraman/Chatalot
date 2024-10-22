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

export interface Participant {
  id: string;
  username: string;
  avatar: string;
}

export interface ExportParticipant {
  id?: string;
  userId: string;
  chatId: string;
}

// Chat Type
export interface Chat {
  id?: string;
  title: string;
  ownerId: string;
  messages: Message[];
}

export interface LocalChat extends Chat{
  participants: Participant[];
}

// Chats Slice - обновленный
export type ChatsState = {
  chats: Chat[];
  currentChatId: string | null;
};

const initialChatsState: ChatsState = {
  chats: [],
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

type CurrentChatState = {
  currentChat: LocalChat | null;
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
    setCurrentChat: (state, action: PayloadAction<LocalChat>) => {
      state.currentChat = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      if (state.currentChat) {
        state.currentChat.messages.push(action.payload);
      }
    },
    addParticipant: (state, action: PayloadAction<Participant>) => {
      if (state.currentChat) {
        state.currentChat.participants.push(action.payload); // добавляем участника в currentChat
      }
    },
    removeParticipant: (state, action: PayloadAction<string>) => {
      if (state.currentChat) {
        state.currentChat.participants = state.currentChat.participants.filter(participant => participant.id !== action.payload); // удаляем участника из currentChat
      }
    },
  },
});

export const { addParticipant, removeParticipant, setCurrentChat, addMessage, setCurrentChatTitle } = currentChatSlice.actions;

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
    getChat: builder.query<LocalChat, string>({
      query: (chatId) => ({
        url: `chats/${chatId}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      }),
      async onQueryStarted(chatId, { dispatch, queryFulfilled }) {
        try {
          const { data: chat } = await queryFulfilled;
    
          // Выполняем запрос на участников
          const participantsResponse = await dispatch(
            apiSlice.endpoints.getParticipants.initiate(chatId)
          );
    
          // Собираем объект LocalChat
          const localChat: LocalChat = {
            ...chat,
            participants: participantsResponse.data || [],
          };
    
          // Обновляем кэш с собранным объектом LocalChat
          dispatch(
            apiSlice.util.updateQueryData('getChat', chatId, () => {
              return localChat;
            })
          );
        } catch (error) {
          console.error('Error fetching chat or participants:', error);
        }
      },
      transformResponse: (response: Chat) => {
        return {
          ...response,
          participants: [],
        } as LocalChat;
      } 
    }),

    getParticipants: builder.query<Participant[], string>({
      query: (chatId) => ({
        url: `participants`, // Убираем chatId из URL
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        params: { // Передаём chatId как query parameter
          chatId: chatId,
        },
      }),
    }),  

    getUserByEmail: builder.query<Account, string>({
      query: (email) => ({
        url: `users`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        params: {
          email,
        },
      }),
      transformResponse: (response: { data: Account[] }) => response.data[0],
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

    addParticipant: builder.mutation<ExportParticipant, Partial<ExportParticipant>>({
      query: (newParticipant) => ({
        url: '/participants',
        method: 'POST',
        body: newParticipant,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      }),
      transformResponse: (response: { data: ExportParticipant }) => {
        return response.data;
      },
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
    getAccountByToken: builder.query<Account, string>({
      query: (token) => ({
        url: 'users',
        method: 'GET',
        headers: {
          Authorization: token,
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
      queryFn: async (newChat, _queryApi, _extraOptions, fetchWithBQ) => {
        // Сначала создаём чат
        const chatResponse = await fetchWithBQ({
          url: 'chats',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: {
            id: newChat.id,
            title: newChat.title,
            owner_id: newChat.ownerId,
          },
        });
    
        if (chatResponse.error) {
          return { error: chatResponse.error };
        }
    
        const createdChat = chatResponse.data as Chat;

        const participantResponse = await fetchWithBQ({
          url: '/participants',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: {
            chatId: createdChat.id,
            userId: newChat.ownerId,
          },
        });
    
        if (participantResponse.error) {
          return { error: participantResponse.error };
        }
    
        // Возвращаем созданный чат
        return { data: createdChat };
      }
    }),
    
    updateChatTitle: builder.mutation<Chat, { chatId: string; newTitle: string }>({
      query: ({ chatId, newTitle }) => ({
        url: `chats/${chatId}`,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: {
          title: newTitle,
        },
      }),
    }),  
  }),
});

export const { useGetUserByEmailQuery, useUpdateChatTitleMutation, useGetParticipantsQuery, useAddParticipantMutation, useSendMessageMutation, useGetMessagesByChatIdQuery, useGetChatQuery, useGetChatListQuery, useCreateUserMutation, useAuthenticateUserMutation, useGetAccountByTokenQuery, useCreateChatMutation } = apiSlice;

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
