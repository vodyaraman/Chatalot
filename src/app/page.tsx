"use client"
import Image from 'next/image';
import { useState } from 'react';
import "./mainpage.scss";

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
      <Image src="/profile.jpg" alt="Профиль" width={100} height={100} className="account__profile-image" />
      <div className="account__info">
        <p>Имя: Джон Доу</p>
        <p>Email: john.doe@example.com</p>
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
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

  return (
    <div className="chat-window">
      <div className="chat-window__header">
        {participants.length > 1 ? (
          <>
            {isEditingTitle ? (
              <input
                type="text"
                value={chatTitle}
                onChange={handleTitleChange}
                onBlur={toggleEditTitle}
                className="chat-window__title-input"
              />
            ) : (
              <div className='flex-div'>
                <h2 className="chat-window__title" onClick={toggleEditTitle}>
                  {chatTitle || 'Чат с друзьями'}
                </h2>
                <button onClick={toggleEditTitle} className="chat-window__edit-title-button">
                  <Image src="/rename.png" alt="Отправить" width={20} height={20} />
                </button>
              </div>
            )}

            <div className='flex-div'>
              <div className="chat-window__participants">Участников: 
                {participants.length}
              </div>
              <button onClick={toggleManageParticipants} className="chat-window__manage-participants-button">
                <Image src="/burger.png" alt="Отправить" width={15} height={15} />
              </button>
            </div>
          </>
        ) : (
          <h2 className="chat-window__title">Чат с {participants.find((p) => p.id !== 'me')?.name}</h2>
        )}
      </div>
      {isManagingParticipants && (
        <div className="chat-window__manage-participants">
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
      <div className="chat-window__messages">
        {messages.map((message) => (
          <div key={message.id} className={`chat-window__message-line--${message.type}`}>
            <div className="chat-window__message-avatar">
              <Image src={message.avatar} alt={message.senderName} width={30} height={30} />
            </div>
            <div className={`chat-window__message chat-window__message--${message.type}`}>
              {message.content}
            </div>
          </div>
        ))}
      </div>
      <div className="chat-window__input">
        <input
          type="text"
          placeholder="Введите сообщение..."
          className="chat-window__input-field"
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
          onKeyUp={handleKeyPress}
        />
        <button className="chat-window__input-button" onClick={handleSendMessage}>
          <Image src="/sendmessage.svg" alt="Отправить" width={25} height={25} />
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