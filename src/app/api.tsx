/* eslint-disable @typescript-eslint/no-explicit-any */
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
  p_id?: string;
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
  owner_id: string;
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
    removeChat: (state, action: PayloadAction<string>) => {
      state.chats = state.chats.filter(chat => chat.id !== action.payload);
    },
  },
});

export const { addChat, setCurrentChatId, setChats, removeChat } = chatsSlice.actions;

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
    clearCurrentChat: (state) => {
      state.currentChat = null;
    },
  },
});

export const { clearCurrentChat, addParticipant, removeParticipant, setCurrentChat, addMessage, setCurrentChatTitle } = currentChatSlice.actions;

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
    updateAccount: (state, action: PayloadAction<Partial<Account>>) => {
      if (state.account) {
        state.account = {
          ...state.account,
          ...action.payload,
        };
      }
    },
  },
});

export const { setAccount, clearAccount, updateAccount } = accountSlice.actions;

// API Slice - Managing API requests with RTK Query
const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3030/' }),
  endpoints: (builder) => ({
    getChatList: builder.query<Chat[], string>({
      query: (participantId) => ({
        url: `chats`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        params: {
          userId: participantId
        }
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
    
          const exportParticipants = participantsResponse.data || [];
    
          // Получаем информацию о каждом участнике по userId
          const participants = await Promise.all(
            exportParticipants.map(async (exportParticipant : any) => {
              const userResponse = await dispatch(
                apiSlice.endpoints.getUserById.initiate(exportParticipant.userId)
              );
              const user = userResponse.data;
              return {
                id: exportParticipant.userId,
                p_id: exportParticipant.id,
                username: user?.username,
                avatar: user?.avatar,
              } as Participant;
            })
          );
    
          // Обновляем объект LocalChat с участниками
          const localChat: LocalChat = {
            ...chat,
            participants,
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
          participants: [], // Пока участники не загружены, оставляем пустой массив
        } as LocalChat;
      }
    }),
    
    

    getParticipants: builder.query<Participant[], string>({
      query: (chatId) => ({
        url: `participants`, 
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        params: {
          chatId: chatId,
        },
      }),
      transformResponse: (response: { data: Participant[] }) => response.data,
    }),
    
    getUserById: builder.query<Account, string>({
      query: (userId) => ({
        url: `users/${userId}`,
        keepUnusedDataFor: 0,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
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
        keepUnusedDataFor: 0,
        body: {
          strategy: 'local',
          ...credentials,
        },
      }),
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
            title: newChat.title,
            owner_id: newChat.owner_id,
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
            userId: newChat.owner_id,
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
    
    deleteChat: builder.mutation<void, string>({
      query: (chatId) => ({
        url: `chats/${chatId}`,
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      }),
    }),
    
    deleteParticipant: builder.mutation<void, string>({
      query: (id) => ({
        url: `participants/${id}`, // Конечная точка для удаления участника
        method: 'DELETE', // Используем метод DELETE
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`, // Токен для авторизации
        },
      }),
    }),

    updateAccount: builder.mutation<Account, Partial<Account>>({
      query: (account) => ({
        url: `users/${account.id}`,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: account,
      }),
    }),

  }),
});

export const { useUpdateAccountMutation, useDeleteChatMutation, useDeleteParticipantMutation, useGetUserByEmailQuery, useUpdateChatTitleMutation, useGetParticipantsQuery, useAddParticipantMutation, useSendMessageMutation, useGetMessagesByChatIdQuery, useGetChatQuery, useGetChatListQuery, useCreateUserMutation, useAuthenticateUserMutation, useCreateChatMutation } = apiSlice;

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
