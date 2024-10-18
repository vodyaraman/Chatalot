"use client"
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import * as runtime from 'react/jsx-runtime';
import { evaluate } from '@mdx-js/mdx';
import { MDXProvider } from '@mdx-js/react';
import TextareaAutosize from 'react-textarea-autosize';
import ReduxProvider from './api';
import { useAppSelector, useAppDispatch } from './api';
import { setCurrentChatId, setCurrentChat, addMessage, addParticipant, removeParticipant, setCurrentChatTitle, addChat, toggleSidebar, toggleProfile } from './api';
import { useGetChatQuery } from './api';
import "./mainpage.scss";

type CompiledMessagesType = {
  [key: string]: React.ComponentType;
};

const Header = () => {
  const dispatch = useAppDispatch();
  const account = useAppSelector((state) => state.account.account);

  const handleAccountClick = () => {
    dispatch(toggleProfile());
  };

  const handleSidebarToggle = () => {
    dispatch(toggleSidebar());
  };

  return (
    <header className="header">
      <div className="header__title">
        <Image src="/logo.png" alt="Профиль" width={35} height={45} objectFit='contain' className="header__title-logo" />
        CHATALOT
        <button onClick={handleSidebarToggle} className="header__sidebar-toggle-button">
          <Image src="/burger.png" alt="Чаты" width={15} height={15} />
        </button>
      </div>
      <div className="header__account" onClick={handleAccountClick}>
        <span className="header__username">{account?.username || 'Гость'}</span>
        <Image src={account?.avatar || "/unknown.png"} alt="Профиль" width={45} height={45} className="header__profile-image" />
      </div>
    </header>
  );
};

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const chats = useAppSelector((state) => state.chats.chats);
  const currentChatId = useAppSelector((state) => state.chats.currentChatId);
  const isSidebarOpen = useAppSelector((state) => state.control.isSidebarOpen);
  const { data: chatData, isSuccess } = useGetChatQuery(currentChatId || '', {
    skip: !currentChatId,
  });

  useEffect(() => {
    if (isSuccess && chatData) {
      dispatch(setCurrentChat(chatData));
    }
  }, [isSuccess, chatData, dispatch]);

  const handleChatSelect = (chatId = "") => {
    dispatch(setCurrentChatId(chatId));
    localStorage.setItem('currentChatId', chatId);
  };

  const handleAddChat = () => {
    const newChat = {
      id: `chat_${chats.length + 1}`,
      title: `Новый чат ${chats.length + 1}`
    };
    dispatch(addChat(newChat));
  };

  if (!isSidebarOpen) {
    return null; // Возвращаем null, если сайдбар закрыт
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__title">
        <h1>Список чатов</h1>
        <button onClick={handleAddChat} className="sidebar__add-chat-button">
          <Image src="/add.png" alt="Чаты" width={25} height={25} />
        </button>
      </div>
      <ul className="sidebar__contacts">
        {chats.map((chat) => (
          <li key={chat.id} className="sidebar__contact" onClick={() => handleChatSelect(chat.id)}>
            {chat.title}
          </li>
        ))}
      </ul>
    </aside>
  );
};


const Account = () => {
  const account = useAppSelector((state) => state.account.account);
  const isProfileVisible = useAppSelector((state) => state.control.isProfileVisible);

  if (!isProfileVisible) {
    return null;
  }

  return (
    <div className="account">
      <h2 className="account__title">Мой Аккаунт</h2>
      <div className="account__details">
        <Image src={account?.avatar || "/unknown.png"} alt="Профиль" width={50} height={50} className="account__profile-image" />
        <div className="account__info">
          <span><h4>Логин:</h4> <p>{account?.username}</p></span>
          <span><h4>Email:</h4> <p>{account?.email}</p></span>
          <button className="account__edit-button">Редактировать</button>
        </div>
      </div>
    </div>
  );
};


const ChatWindow = () => {
  const dispatch = useAppDispatch();
  const chat = useAppSelector((state) => state.currentChat.currentChat);
  const accountId = useAppSelector((state) => state.account.account?.id ?? '');

  // Проверяем, является ли текущий пользователь администратором
  const isAdmin = chat?.ownerId === accountId;

  // Обновляем логику сообщений с корректной проверкой пользователя
  const messages = (chat?.messages || []).map((message) => ({
    ...message,
    type: message.userId == accountId ? 'sent' : 'received',
    avatar: chat?.participants[message.userId]?.avatar || '/unknown.png'
  }));

  const participants = chat?.participants ? Object.values(chat.participants) : [];
  const chatTitle = chat?.title || '';
  const [inputValue, setInputValue] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isManagingParticipants, setIsManagingParticipants] = useState(false);
  const manageParticipantsRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [compiledMessages, setCompiledMessages] = useState<CompiledMessagesType>({});

  useEffect(() => {
    async function compileMDX(content = "", messageId = "") {
      try {
        const formattedContent = content.replace(/\n/g, "\n");
        const compiledMDX = await evaluate(formattedContent, {
          ...runtime,
        });
        setCompiledMessages((prevMessages) => ({
          ...prevMessages,
          [messageId]: compiledMDX.default,
        }));
      } catch (err) {
        console.error('Ошибка компиляции MDX:', err);
      }
    }

    messages.forEach((message) => {
      if (!compiledMessages[message.id.toString()]) {
        compileMDX(message.content, message.id.toString());
      }
    });
  }, [messages, compiledMessages]);

  const handleSendMessage = () => {
    if (inputValue.trim() !== '') {
      const newMessage = {
        id: (messages.length + 1).toString(),
        userId: accountId,
        content: inputValue,
        images: [],
      };
      dispatch(addMessage(newMessage));
      setInputValue('');
    }
  };

  const toggleEditTitle = () => {
    setIsEditingTitle(!isEditingTitle);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setCurrentChatTitle(e.target.value));
  };

  const toggleManageParticipants = () => {
    setIsManagingParticipants(!isManagingParticipants);
  };

  const handleAddParticipant = () => {
    const newParticipant = {
      id: `participant_${participants.length + 1}`,
      username: `Участник ${participants.length + 1}`,
      email: 'no.email@example.com',
      avatar: '/unknown.png',
      isAdmin: false,
    };
    dispatch(addParticipant(newParticipant));
  };

  const handleRemoveParticipant = (id: string) => {
    dispatch(removeParticipant(id));
  };

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        manageParticipantsRef.current &&
        !manageParticipantsRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.chat-window__manage-participants-button')
      ) {
        setIsManagingParticipants(false);
      }
    };

    if (isManagingParticipants) {
      document.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousedown', handleClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isManagingParticipants]);

  return (
    <div className="chat-window">
      <div className="chat-window__header">
        {isEditingTitle ? (
          <div className="flex-div">
            <input
              type="text"
              value={chatTitle}
              onChange={handleTitleChange}
              onBlur={toggleEditTitle}
              className="chat-window__title-input"
              ref={inputRef}
            />
          </div>
        ) : (
          <div className="flex-div">
            <h2 className="chat-window__title" onClick={toggleEditTitle}>
              {participants.length > 2 ? chatTitle || 'Чат с друзьями' : `Чат с ${participants.find((p) => p.id !== 'me')?.username}`}
            </h2>
            {participants.length > 2 && (
              <button onClick={toggleEditTitle} className="chat-window__edit-title-button">
                <Image src="/rename.png" alt="Редактировать" width={20} height={20} />
              </button>
            )}
          </div>
        )}
        <div className="flex-div">
          <div className="chat-window__participants">Участников: {participants.length}</div>
          <button onClick={toggleManageParticipants} className="chat-window__manage-participants-button">
            <Image src="/burger.png" alt="Управление участниками" width={15} height={15} />
          </button>
        </div>
      </div>

      {isManagingParticipants && (
        <div className="chat-window__manage-participants" ref={manageParticipantsRef}>
          Управление участниками
          <button onClick={handleAddParticipant} className="add-participant-button">
            Пригласить
          </button>
          <button onClick={toggleManageParticipants} className="close-manage-participants-button">
            Закрыть
          </button>
          <ul className="participants-list">
            {participants.map((participant) => (
              <li key={participant.id} className="participant-item">
                <Image src={participant.avatar} alt={participant.username} width={30} height={30} />
                <span>
                  {participant.username}
                </span>
                {isAdmin && (
                  <button onClick={() => handleRemoveParticipant(participant.id)} className="remove-participant-button">
                    Удалить
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/*Окно чата*/}

      <div className="chat-window__messages">
        {messages.map((message) => {
          const CompiledContent = compiledMessages[message.id.toString()];
          return (
            <div key={message.id} className={`chat-window__message-line--${message.type}`}>
              {message.type === 'received' ? (
                <>
                  <div className="chat-window__message-avatar">
                    <Image src={message.avatar} alt={""} width={30} height={30} />
                  </div>
                  <div className={`chat-window__message chat-window__message--${message.type}`}>
                    <MDXProvider>
                      {CompiledContent ? <CompiledContent /> : <div>Загрузка...</div>}
                    </MDXProvider>
                  </div>
                </>
              ) : (
                <>
                  <div className={`chat-window__message chat-window__message--${message.type}`}>
                    <MDXProvider>
                      {CompiledContent ? <CompiledContent /> : <div>Загрузка...</div>}
                    </MDXProvider>
                  </div>
                  <div className="chat-window__message-avatar">
                    <Image src={message.avatar} alt={""} width={30} height={30} />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>


      <div className="chat-window__input">
        <TextareaAutosize
          minRows={1}
          maxRows={6}
          placeholder="Введите сообщение..."
          className="chat-window__input-field"
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          style={{ resize: 'none' }}
        />
        <button className="chat-window__input-button" onClick={handleSendMessage}>
          <Image src="/sendmessage.svg" alt="Отправить" width={21} height={21} />
        </button>
      </div>
    </div>
  );
};

export default function ChatApp() {
  return (
    <ReduxProvider>
      <div className="chat-app">
        <Header />
        <div className="chat-app__body">
          <Sidebar />
          <ChatWindow />
          <Account />
        </div>
      </div>
    </ReduxProvider>
  );
}
