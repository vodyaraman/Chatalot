/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client"
//import feathersClient from './feathersClient';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import * as runtime from 'react/jsx-runtime';
import { evaluate } from '@mdx-js/mdx';
import { MDXProvider } from '@mdx-js/react';
import TextareaAutosize from 'react-textarea-autosize';
import ReduxProvider, { clearAccount, clearCurrentChat, Message, Participant, removeChat, setChats, updateAccount, useAddParticipantMutation, useCreateChatMutation, useDeleteChatMutation, useDeleteParticipantMutation, useGetMessagesByChatIdQuery, useGetUserByEmailQuery, useSendMessageMutation, useUpdateAccountMutation, useUpdateChatTitleMutation } from './api';
import { useAppSelector, useAppDispatch } from './api';
import { setCurrentChatId, addParticipant, removeParticipant, setCurrentChat, setCurrentChatTitle, addChat, toggleSidebar, toggleProfile, useCreateUserMutation, useAuthenticateUserMutation, setAccount } from './api';
import { useGetChatQuery, useGetChatListQuery } from './api';
import "./mainpage.scss";

type CompiledMessagesType = {
  [key: string]: React.ComponentType;
};

interface LocalMessage extends Message {
  type: 'sent' | 'received';
  avatar: string;
}

// Register Component
const Register = () => {
  const [createUser] = useCreateUserMutation();
  const [authenticateUser] = useAuthenticateUserMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !username) {
      setError('Все поля должны быть заполнены');
      return;
    }
    if (username.length < 3 || username.length > 15) {
      setError('Имя пользователя должно содержать от 3 до 15 символов');
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (password.length < 3 || password.length > 15) {
      setError('Пароль должен содержать от 3 до 15 символов');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Введите корректный адрес электронной почты');
      return;
    }
    try {
      await createUser({ email, password, username });
      const { data } = await authenticateUser({ email, password });
      if (data?.accessToken) {
        localStorage.setItem('email', email);
        localStorage.setItem('authToken', data.accessToken);
        window.location.reload();
      }
    } catch (error) {
      setError('Ошибка регистрации, попробуйте снова');
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="register">
      <h2 className="register__title">Регистрация</h2>
      {error && <div className="register__error">{error}</div>}
      <input
        className="register__input"
        name="text"
        placeholder="Имя пользователя (от 3 до 15 символов)"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        className="register__input"
        name="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="register__input"
        name="password"
        autoComplete='true'
        type={showPassword ? 'text' : 'password'}
        placeholder="Пароль (от 3 до 15 символов)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        className="register__input"
        name='password'
        autoComplete='true'
        type={showPassword ? 'text' : 'password'}
        placeholder="Повторите пароль"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <label className="register__show-password">
        <input
          type="checkbox"
          checked={showPassword}
          onChange={() => setShowPassword(!showPassword)}
        />
        Показать пароль
      </label>
      <button className="register__button" onClick={handleRegister}>Продолжить</button>
    </div>
  );
};

// Login Component
const Login = () => {
  const [authenticateUser] = useAuthenticateUserMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Все поля должны быть заполнены');
      return;
    }
    try {
      const { data } = await authenticateUser({ email, password });
      if (data?.accessToken) {
        localStorage.setItem('email', email);
        localStorage.setItem('authToken', data.accessToken);
        window.location.reload();
      }
    } catch (error) {
      setError('Ошибка входа, попробуйте снова');
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="login">
      <h2 className="login__title">Вход</h2>
      {error && <div className="login__error">{error}</div>}
      <input
        className="login__input"
        name="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="login__input"
        name="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="login__button" onClick={handleLogin}>Продолжить</button>
    </div>
  );
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
        <span className="header__username" draggable="false">{account?.username || 'Гость'}</span>
        <Image src={account?.avatar || "/unknown.png"} alt="Профиль" width={45} height={45} className="header__profile-image" />
      </div>
    </header>
  );
};

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const [createChat] = useCreateChatMutation();
  const chats = useAppSelector((state) => state.chats.chats);
  const account = useAppSelector((state) => state.account.account);

  const isSidebarOpen = useAppSelector((state) => state.control.isSidebarOpen);

  const handleChatSelect = (chatId = "") => {
    dispatch(setCurrentChatId(chatId));
    localStorage.setItem('currentChatId', chatId);
  };

  const handleAddChat = () => {
    if (account) {
      const newChat = {
        title: 'Новый чат',
        owner_id: account?.id,
      };
      createChat(newChat)
        .unwrap()
        .then((createdChat) => {
          dispatch(addChat(createdChat));
        })
        .catch((error) => {
          console.error('Failed to create chat:', error);
        });
    }
  };

  if (!isSidebarOpen) {
    return null;
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


const Profile = () => {
  const account = useAppSelector((state) => state.account.account);
  const isProfileVisible = useAppSelector((state) => state.control.isProfileVisible);
  const dispatch = useAppDispatch();

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(account?.username || '');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(account?.avatar || null);
  const [updateAccountMutation] = useUpdateAccountMutation();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    dispatch(clearAccount());
    window.location.reload();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file)); // Устанавливаем предварительный просмотр
      console.log(file);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarPreview(account?.avatar || null); // Возвращаем исходное изображение при отмене
  };

  const handleConfirm = async () => {
    try {
      let avatarData = account?.avatar;

      if (avatar) {
        // Сохраняем изображение в формате base64 для хранения в MySQL
        const reader = new FileReader();
        reader.readAsDataURL(avatar);
        await new Promise<void>((resolve, reject) => {
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              avatarData = reader.result;
              resolve();
            } else {
              reject(new Error('Ошибка при чтении файла аватара'));
            }
          };
          reader.onerror = () => reject(new Error('Ошибка при чтении файла аватара'));
        });
      }

      const updatedAccount = {
        id: account?.id,
        username: username || account?.username,
        password: password || account?.password,
        avatar: avatarData,
      }; // Обновляемые данные

      await updateAccountMutation(updatedAccount).unwrap(); // Отправляем запрос на сервер
      
      // Обновляем состояние Redux вручную через экшен
      dispatch(updateAccount({ username: updatedAccount.username, password: updatedAccount.password, avatar: updatedAccount.avatar }));

      setIsEditing(false);
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
    }
  };

  if (!isProfileVisible) {
    return null;
  }

  return (
    <div className="account">
      <h2 className="account__title">Мой Аккаунт</h2>
      <div className="account__details">
        <Image
          src={avatarPreview || '/unknown.png'}
          alt="Профиль"
          width={50}
          height={50}
          className="account__profile-image"
        />
        <div className="account__upload-photo">
          <input
            type="file"
            id="upload-photo-input"
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />
          <label htmlFor="upload-photo-input" className="account__upload-button">
            Загрузить фотографию
          </label>
        </div>
        <div className="account__info">
          {isEditing ? (
            <>
              <div className="account__field">
                <label htmlFor="username">Логин:</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="account__field">
                <label htmlFor="password">Пароль:</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button className="account__confirm-button" onClick={handleConfirm}>
                Подтвердить
              </button>
              <button className="account__cancel-button" onClick={handleCancel}>
                Отменить
              </button>
            </>
          ) : (
            <>
              <span>
                <h4>Логин:</h4> <p>{account?.username}</p>
              </span>
              <span>
                <h4>Email:</h4> <p>{account?.email}</p>
              </span>
              <button className="account__edit-button" onClick={handleEdit}>
                Редактировать
              </button>
            </>
          )}
          <button className="account__logout-button" onClick={handleLogout}>
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  );
};


const ChatWindow = () => {
  const dispatch = useAppDispatch();
  const [sendMessage] = useSendMessageMutation();
  // const [addChatParticipant] = useAddChatParticipantMutation();
  const [changeTitle] = useUpdateChatTitleMutation();
  const [messages, setMessages] = useState<LocalMessage[]>([]);

  const currentChatId = useAppSelector((state) => state.chats.currentChatId);

  const { data: chatData, isSuccess: chatSuccess } = useGetChatQuery(currentChatId || '', {
    skip: !currentChatId,
  });

  useEffect(() => {
    if (chatSuccess && chatData) {
      dispatch(setCurrentChat(chatData));
    }
  }, [chatSuccess, chatData, dispatch]);

  const chat = useAppSelector((state) => state.currentChat.currentChat);
  const accountId = useAppSelector((state) => state.account.account?.id ?? '');

  // Запрашиваем сообщения для текущего чата
  const { data: messagesData, isSuccess } = useGetMessagesByChatIdQuery(chat?.id || '', {
    skip: !chat?.id,
  });

  useEffect(() => {
    if (isSuccess && messagesData) {
      setMessages(
        messagesData.map((message) => ({
          ...message,
          type: message.userId === accountId ? 'sent' : 'received',
          avatar: chat?.participants.find(p => p.id === message.userId)?.avatar || '/unknown.png', // находим участника по userId
        }))
      );
    } else if (chat?.messages) {
      setMessages(
        chat.messages.map((message) => ({
          ...message,
          type: message.userId === accountId ? 'sent' : 'received',
          avatar: chat?.participants.find(p => p.id === message.userId)?.avatar || '/unknown.png', // находим участника по userId
        }))
      );
    }
  }, [isSuccess, messagesData, chat, accountId]);



  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    if (chat?.participants) {
      setParticipants(Object.values(chat.participants));
    }
  }, [chat?.participants]);

  const chatTitle = chat?.title || '';
  const [inputValue, setInputValue] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isManagingParticipants, setIsManagingParticipants] = useState(false);
  const manageParticipantsRef = useRef<HTMLDivElement | null>(null);
  const [email, setEmail] = useState('');
  const [emailToQuery, setEmailToQuery] = useState<string | null>(null);
  const [showEmailInput, setShowEmailInput] = useState(false);
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
      if (!compiledMessages[message.id?.toString() || 0]) {
        compileMDX(message.content, message.id?.toString());
      }
    });
  }, [messages, compiledMessages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() !== '' && currentChatId) {
      const newMessage = {
        chatId: currentChatId,
        userId: accountId,
        content: inputValue,
      };

      try {
        const savedMessage = await sendMessage(newMessage).unwrap();

        const updatedMessage: LocalMessage = {
          ...savedMessage,
          type: savedMessage.userId === accountId ? 'sent' : 'received',
          avatar: chat?.participants.find(p => p.id === savedMessage.userId)?.avatar || '/unknown.png',
        };

        setMessages((prevMessages) => [...prevMessages, updatedMessage]);
        setInputValue('');
      } catch (error) {
        console.error('Ошибка при отправке сообщения:', error);
        // Здесь можно добавить отображение уведомления об ошибке
      }
    }
  };


  const toggleEditTitle = () => {
    setIsEditingTitle(!isEditingTitle);  // Переключаем режим редактирования
  };

  const saveTitle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (chat?.id) {
      console.log(e.target.value)
      await changeTitle({ chatId: chat.id, newTitle: e.target.value });  // Сохраняем новый заголовок на сервере
    }
    setIsEditingTitle(false);  // Выключаем режим редактирования после сохранения
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setCurrentChatTitle(e.target.value));  // Обновляем заголовок в состоянии
  };

  const toggleManageParticipants = () => {
    setIsManagingParticipants(!isManagingParticipants);
  };

  const { data: userData } = useGetUserByEmailQuery(emailToQuery || '', {
    skip: !emailToQuery, // Пропускаем запрос, если emailToQuery не установлен
  });

  const [addParticipantMutation] = useAddParticipantMutation(); // Мутация для добавления участника

  const handleAddParticipant = async () => {
    setEmailToQuery(email);

    // Следим за изменениями userData, чтобы выполнить мутацию
    if (userData && chat) {
      try {
        // Добавляем участника
        const data = await addParticipantMutation({
          userId: userData.id,
          chatId: chat.id,
        }).unwrap();

        if (data) {
          const newParticipant = {
            id: data.id,
            username: userData.username,
            avatar: userData.avatar,
          } as Participant;

          dispatch(addParticipant(newParticipant)); // Добавляем участника в состояние
        }
      } catch (error) {
        console.error('Ошибка при добавлении участника:', error);
      }
    }
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

  const [deleteChat] = useDeleteChatMutation();

  const handleDeleteChat = async (chatId: string) => {
    const go = confirm(`Удалить ${chat?.title}?`);
    if (go) {
      try {
        await deleteChat(chatId).unwrap();
        dispatch(removeChat(chatId));
        localStorage.setItem('currentChatId', "");
        dispatch(clearCurrentChat());
        setIsManagingParticipants(!isManagingParticipants)
        console.log('Chat deleted successfully');
      } catch (error) {
        console.error('Failed to delete chat:', error);
      }
    }
  };

  const [deleteParticipant] = useDeleteParticipantMutation();

  const handleDeleteParticipant = async (id: string, username: string) => {
    const go = confirm(`Выгнать ${username}?`);
    if (go) {
      try {
        await deleteParticipant(id).unwrap();
        setParticipants(participants.filter((participant) => participant.id !== id));
        console.log('Participant deleted successfully');
        dispatch(removeParticipant(id));
      } catch (error) {
        console.error('Failed to delete participant:', error);
      }
    }
  };
  const isAdmin = chat?.owner_id === accountId;

  return (
    <div className="chat-window">
      <div className="chat-window__header">
        {isEditingTitle ? (
          <div className="flex-div">
            <input
              type="text"
              value={chatTitle}
              onBlur={saveTitle}
              onChange={handleTitleChange}
              className="chat-window__title-input"
              ref={inputRef}
            />
          </div>
        ) : (
          <div className="flex-div">
            <h2 className="chat-window__title" onClick={toggleEditTitle}>
              {(participants || []).length > 0 ? chatTitle : "Выберите чат, чтобы начать работу"}
            </h2>
            <button onClick={toggleEditTitle} className="chat-window__edit-title-button">
              <Image src="/rename.png" alt="Редактировать" width={20} height={20} />
            </button>
          </div>
        )}
        {(participants || []).length > 0 && (
          <div className="flex-div">
            <div className="chat-window__participants">Участников: {(participants || []).length}</div>
            <button onClick={toggleManageParticipants} className="chat-window__manage-participants-button">
              <Image src="/burger.png" alt="Управление участниками" width={15} height={15} />
            </button>
          </div>
        )}
      </div>

      {isManagingParticipants && (
        <div className="chat-window__manage-participants" ref={manageParticipantsRef}>
          {!showEmailInput ? (
            <button onClick={() => setShowEmailInput(true)} className="add-participant-button">
              Пригласить участника по email
            </button>
          ) : (
            <div className="invite-participant">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                ref={inputRef}
                onBlur={()=>{setShowEmailInput(!showEmailInput)}}
                placeholder="Введите email участника"
                className="invite-participant-input"
              />
              <button onClick={handleAddParticipant} className="confirm-add-participant-button">
                ✅
              </button>
            </div>
          )}
          <button onClick={toggleManageParticipants} className="close-manage-participants-button">
            Закрыть
          </button>
          <button className="delete-chat-button" onClick={() => handleDeleteChat(chat?.id as any)}>
            Удалить чат
          </button>
          <ul className="participants-list">
            {chat?.participants.map((participant) => (
              <li key={participant.id} className="participant-item">
                <Image src={participant.avatar} alt={participant.username} width={30} height={30} />
                <span>
                  {participant.username}
                </span>
                {isAdmin && (
                  <button onClick={() => handleDeleteParticipant(participant.p_id as any, participant.username)} className="remove-participant-button">
                    Выгнать
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
          const CompiledContent = compiledMessages[message.id?.toString() || 0];
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

      {chat &&
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
      }
    </div>
  );
};

export default function ChatApp() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [showRegister, setShowRegister] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleShowLogin = () => {
    setShowLogin(true);
    setShowRegister(false);
  };

  const handleShowRegister = () => {
    setShowRegister(true);
    setShowLogin(false);
  };

  return (
    <ReduxProvider>
      <div className="chat-app">
        {isAuthenticated ? (
          <AuthenticatedApp />
        ) : (
          <div className='chat-app__auth-window'>
            <AuthOptions
              showLogin={showLogin}
              showRegister={showRegister}
              handleShowLogin={handleShowLogin}
              handleShowRegister={handleShowRegister}
            />
            <img src="https://st4.depositphotos.com/2673929/27392/i/450/depositphotos_273926318-stock-photo-white-office-interior-with-meeting.jpg" alt="" className='chat-app__auth-image' />
          </div>
        )}
      </div>
    </ReduxProvider>
  );
}

function AuthenticatedApp() {
  const dispatch = useAppDispatch();
  const email = localStorage.getItem('email') as any;

  const { data: accountData } = useGetUserByEmailQuery(email);

  useEffect(() => {
    if (accountData) {
      dispatch(setAccount(accountData));
    }
  }, [accountData, dispatch]);

  const userId = accountData?.id as any;
  const { data: chatListData } = useGetChatListQuery(userId);

  useEffect(() => {
    if (chatListData) {
      dispatch(setChats(chatListData));
    }
  }, [chatListData, dispatch]);

  return (
    <>
      <Header />
      <div className="chat-app__body">
        <Sidebar />
        <ChatWindow />
        <Profile />
      </div>
    </>
  );
}


function AuthOptions({
  showLogin,
  showRegister,
  handleShowLogin,
  handleShowRegister,
}: {
  showLogin: boolean;
  showRegister: boolean;
  handleShowLogin: () => void;
  handleShowRegister: () => void;
}) {
  return (
    <div className="chat-app__auth">
      <h2 className="chat-app__auth-title">Вы не вошли в систему
        <Image src="/logo.png" alt="Профиль" width={30} height={40} objectFit='contain' className="header__title-logo auth-logo" />
      </h2>
      <div className="chat-app__auth-buttons">
        {!showLogin && !showRegister && (
          <>
            <button className="chat-app__auth-button" onClick={handleShowLogin}>Войти</button>
            <button className="chat-app__auth-button" onClick={handleShowRegister}>Зарегистрироваться</button>
          </>
        )}
      </div>
      {showLogin && (
        <>
          <Login />
          <button className="chat-app__auth-button alt" onClick={handleShowRegister}>Регистрация</button>
        </>
      )}
      {showRegister && (
        <>
          <Register />
          <button className="chat-app__auth-button alt" onClick={handleShowLogin}>Вход</button>
        </>
      )}
    </div>
  );
}
