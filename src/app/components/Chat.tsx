import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
}

interface ChatHeaderProps {
  participants: Participant[];
  chatTitle: string;
  isEditingTitle: boolean;
  toggleEditTitle: () => void;
  handleTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleManageParticipants: () => void;
  isManagingParticipants: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  participants,
  chatTitle,
  isEditingTitle,
  toggleEditTitle,
  handleTitleChange,
  toggleManageParticipants,
  isManagingParticipants,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingTitle]);

  return (
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
  );
};

interface ChatMessagesProps {
  messages: {
    id: number;
    userId: string;
    senderName: string;
    avatar: string;
    content: string;
    type: 'received' | 'sent';
  }[];
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  return (
    <div className="chat-window__messages">
      {messages.map((message) => (
        <div key={message.id} className={`chat-window__message-line--${message.type}`}>
          {message.type === 'received' ? (
            <>
              <div className="chat-window__message-avatar">
                <Image src={message.avatar} alt={message.senderName} width={30} height={30} />
              </div>
              <div className={`chat-window__message chat-window__message--${message.type}`}>
                {message.content}
              </div>
            </>
          ) : (
            <>
              <div className={`chat-window__message chat-window__message--${message.type}`}>
                {message.content}
              </div>
              <div className="chat-window__message-avatar">
                <Image src={message.avatar} alt={message.senderName} width={30} height={30} />
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

interface ChatInputProps {
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ inputValue, setInputValue, handleSendMessage }) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
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
  );
};

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<{
    id: number;
    userId: string;
    senderName: string;
    avatar: string;
    content: string;
    type: 'received' | 'sent';
  }[]>([
    { id: 1, userId: 'friend', senderName: 'Друг', avatar: '/unknown.png', content: 'Привет! Как дела?', type: 'received' },
    { id: 2, userId: 'me', senderName: 'Вы', avatar: '/unknown.png', content: 'Хорошо, спасибо!', type: 'sent' },
  ]);

  const [inputValue, setInputValue] = useState<string>('');
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 'me', name: 'Вы', avatar: '/unknown.png', isAdmin: true },
    { id: 'friend', name: 'Друг', avatar: '/unknown.png', isAdmin: false },
  ]);
  const [chatTitle, setChatTitle] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [isManagingParticipants, setIsManagingParticipants] = useState<boolean>(false);

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

  return (
    <div className="chat-window">
      <ChatHeader
        participants={participants}
        chatTitle={chatTitle}
        isEditingTitle={isEditingTitle}
        toggleEditTitle={toggleEditTitle}
        handleTitleChange={handleTitleChange}
        toggleManageParticipants={toggleManageParticipants}
        isManagingParticipants={isManagingParticipants}
      />
      <ChatMessages messages={messages} />
      <ChatInput inputValue={inputValue} setInputValue={setInputValue} handleSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;
