"use client"
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import * as runtime from 'react/jsx-runtime';
import { evaluate } from '@mdx-js/mdx';
import { MDXProvider } from '@mdx-js/react';
import TextareaAutosize from 'react-textarea-autosize';
import "./mainpage.scss";

type CompiledMessagesType = {
  [key: string]: React.ComponentType;
};

const Header = () => (
  <header className="header">
    <div className="header__title">
      <Image src="/logo.png" alt="Профиль" width={35} height={45} objectFit='contain' className="header__title-logo" />
      CHATALOT
    </div>
    <div className="header__account">
      <span className="header__username">Джон Доу</span>
      <Image src="/unknown.png" alt="Профиль" width={45} height={45} className="header__profile-image" />
    </div>
  </header>
);

const Sidebar = () => (
  <aside className="sidebar">
    <div className="sidebar__search">
      <input type="text" placeholder="Поиск" className="sidebar__search-input" />
    </div>
    <ul className="sidebar__contacts">
      <li className="sidebar__contact">Алиса</li>
      <li className="sidebar__contact">Боб</li>
      <li className="sidebar__contact">Чарли</li>
    </ul>
  </aside>
);

const Account = () => (
  <div className="account">
    <h2 className="account__title">Мой Аккаунт</h2>
    <div className="account__details">
      <Image src="/unknown.png" alt="Профиль" width={50} height={50} className="account__profile-image" />
      <div className="account__info">
        <span><h4>Логин:</h4> <p>JohnDoe</p></span>
        <span><h4>Email: </h4> <p>john.doe@example.com</p></span>
        <button className="account__edit-button">Редактировать</button>
      </div>
    </div>
  </div>
);

const ChatWindow = () => {
  const [messages, setMessages] = useState([
    { id: 1, userId: 'friend', senderName: 'Друг', avatar: '/unknown.png', content: 'Привет! Как дела?', type: 'received' },
    { id: 2, userId: 'me', senderName: 'Вы', avatar: '/unknown.png', content: 'Хорошо, спасибо!', type: 'sent' },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [participants, setParticipants] = useState([
    { id: 'me', name: 'Вы', avatar: '/unknown.png', isAdmin: true },
    { id: 'friend', name: 'Друг', avatar: '/unknown.png', isAdmin: false },
  ]);
  const [chatTitle, setChatTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isManagingParticipants, setIsManagingParticipants] = useState(false);
  const manageParticipantsRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [compiledMessages, setCompiledMessages] = useState<CompiledMessagesType>({});

  useEffect(() => {
    async function compileMDX(content = "", messageId = "") {
      try {
        const formattedContent = content.replace(/\n/g, "\n"); // Замена пробелов на неразрывные пробелы
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
        id: messages.length + 1,
        userId: 'me',
        senderName: 'Вы',
        avatar: '/unknown.png',
        content: inputValue,
        type: 'sent',
      };
      setMessages([...messages, newMessage]);
      setInputValue('');
    }
  };

  const toggleEditTitle = () => {
    setIsEditingTitle(!isEditingTitle);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatTitle(e.target.value);
  };

  const toggleManageParticipants = () => {
    setIsManagingParticipants(!isManagingParticipants);
  };

  const addParticipant = () => {
    const newParticipant = {
      id: `participant_${participants.length + 1}`,
      name: `Участник ${participants.length + 1}`,
      avatar: '/unknown.png',
      isAdmin: false,
    };
    setParticipants([...participants, newParticipant]);
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter((participant) => participant.id !== id));
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
              {participants.length > 2 ? chatTitle || 'Чат с друзьями' : `Чат с ${participants.find((p) => p.id !== 'me')?.name}`}
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
          <button onClick={addParticipant} className="add-participant-button">
            Пригласить
          </button>
          <button onClick={toggleManageParticipants} className="close-manage-participants-button">
            Закрыть
          </button>
          <ul className="participants-list">
            {participants.map((participant) => (
              <li key={participant.id} className="participant-item">
                <Image src={participant.avatar} alt={participant.name} width={30} height={30} />
                <span>
                  {participant.name}
                </span>
                {!participant.isAdmin && participant.id !== 'me' && (
                  <button onClick={() => removeParticipant(participant.id)} className="remove-participant-button">
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
                    <Image src={message.avatar} alt={message.senderName} width={30} height={30} />
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
                    <Image src={message.avatar} alt={message.senderName} width={30} height={30} />
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
    <div className="chat-app">
      <Header />
      <div className="chat-app__body">
        <Sidebar />
        <ChatWindow />
        <Account />
      </div>
    </div>
  );
}
