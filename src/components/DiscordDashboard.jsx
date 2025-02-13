import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Moon, Sun, RefreshCw, Send, Users, Github, Linkedin, Twitter, Instagram } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Input } from "./ui/input";
import DiscordService from '../services/discordApi';

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.target && (e.target.src || e.target.href)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);
}

const discordService = new DiscordService(import.meta.env.VITE_DISCORD_TOKEN);
const GUILD_ID = import.meta.env.VITE_GUILD_ID;
const CHANNEL_ID = import.meta.env.VITE_CHANNEL_ID;
const UPDATE_INTERVAL = 60000;

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const DiscordDashboard = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [adminStatuses] = useState({
    "Carlos_Admin": "offline",
    "Ana_Moderator": "online",
    "Juan_Support": "offline",
    "Maria_Manager": "online",
    "Pedro_Admin": "offline"
  });
  const [serverData, setServerData] = useState({
    totalMembers: 0,
    lastMessages: [],
    admins: [
      { id: 1, name: "Carlos_Admin" },
      { id: 2, name: "Ana_Moderator" },
      { id: 3, name: "Juan_Support" },
      { id: 4, name: "Maria_Manager" },
      { id: 5, name: "Pedro_Admin" }
    ],
    activityData: []
  });

  useEffect(() => {
    document.body.className = darkMode 
      ? 'dark bg-[#313338]' 
      : 'bg-[#F2F3F5]';
    return () => {
      document.body.className = '';
    };
  }, [darkMode]);

  const fetchDiscordData = useCallback(async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      const [guildInfo, messages, activityStats] = await Promise.all([
        discordService.getGuildInfo(GUILD_ID),
        discordService.getChannelMessages(CHANNEL_ID),
        discordService.getChannelStats(CHANNEL_ID)
      ]);

      setServerData(prev => ({
        ...prev,
        totalMembers: guildInfo.approximate_member_count || 0,
        lastMessages: messages.map(msg => ({
          id: msg.id,
          user: msg.author.username,
          content: msg.content,
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        })),
        activityData: activityStats
      }));
    } catch (err) {
      console.error('Error fetching Discord data:', err);
      setError('Error al cargar los datos de Discord. Por favor, intenta de nuevo.');
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }, [loading]);

  useEffect(() => {
    const debouncedFetch = debounce(fetchDiscordData, 1000);
    debouncedFetch();

    const interval = setInterval(debouncedFetch, UPDATE_INTERVAL);
    return () => {
      clearInterval(interval);
    };
  }, [fetchDiscordData]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);
      const sentMessage = await discordService.sendMessage(CHANNEL_ID, newMessage);
      
      const formattedMessage = {
        id: sentMessage.id,
        user: sentMessage.author.username,
        content: sentMessage.content,
        timestamp: new Date(sentMessage.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      setServerData(prev => ({
        ...prev,
        lastMessages: [formattedMessage, ...prev.lastMessages.slice(0, 4)]
      }));

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Error al enviar el mensaje. Por favor, intenta de nuevo.');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className={`min-h-screen p-4 transition-colors duration-500 ${darkMode ? 'dark text-white' : 'text-[#2E3338]'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#5865F2]">
            Discord Server Dashboard
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              className="transition-all duration-200 hover:scale-105 hover:shadow-lg bg-[#5865F2] text-white hover:bg-[#4752C4]"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              onClick={() => !loading && fetchDiscordData()}
              disabled={loading}
              className="transition-all duration-200 hover:scale-105 hover:shadow-lg bg-[#5865F2] text-white hover:bg-[#4752C4]"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 animate-shake">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card className={`
            transition-all duration-200 hover:shadow-lg hover:scale-[1.02]
            ${darkMode ? 'bg-[#2B2D31] text-white' : 'bg-white'}
            border-none shadow-md rounded-xl overflow-hidden
          `}>
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle>Miembros Totales</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between p-6">
              <p className="text-4xl font-bold text-[#5865F2]">
                {serverData.totalMembers}
              </p>
              <Users className="h-8 w-8 text-[#5865F2]" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className={`
            transition-all duration-200 hover:shadow-lg
            ${darkMode ? 'bg-[#2B2D31] text-white' : 'bg-white'}
            border-none shadow-md rounded-xl overflow-hidden
          `}>
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle>Últimos Mensajes</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <form onSubmit={handleSendMessage} className="flex gap-2 mb-4">
                  <Input
                    type="text"
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className={`
                      transition-all duration-200 hover:shadow-md focus:shadow-lg
                      ${darkMode ? 'bg-[#383A40] border-gray-700 text-white' : 'bg-white border-gray-200'}
                    `}
                    disabled={sendingMessage}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={sendingMessage}
                    className="transition-all duration-200 hover:scale-105 bg-[#5865F2] text-white hover:bg-[#4752C4]"
                  >
                    <Send className={`h-4 w-4 ${sendingMessage ? 'opacity-50' : ''}`} />
                  </Button>
                </form>
                <div className="space-y-2">
                  {serverData.lastMessages.map((message) => (
                    <Alert
                      key={message.id}
                      className={`
                        transition-all duration-200 hover:translate-x-1
                        ${darkMode ? 'bg-[#383A40] text-white' : 'bg-gray-50'}
                        border-l-4 border-[#5865F2]
                      `}
                    >
                      <AlertDescription className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#5865F2]">{message.user}</span>
                          <span className="text-xs text-gray-500">{message.timestamp}</span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`
            transition-all duration-200 hover:shadow-lg
            ${darkMode ? 'bg-[#2B2D31] text-white' : 'bg-white'}
            border-none shadow-md rounded-xl overflow-hidden
          `}>
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle>Estado de Administradores</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                {serverData.admins.map((admin) => (
                  <div
                    key={admin.id}
                    className={`
                      transition-all duration-200
                      flex items-center justify-between p-3
                      rounded-lg hover:scale-[1.02]
                      ${darkMode ? 'bg-[#383A40]' : 'bg-gray-50'}
                      hover:shadow-md
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-2 h-2 rounded-full
                        ${adminStatuses[admin.name] === 'online' ? 'bg-green-500' : 'bg-gray-500'}
                      `} />
                      <span>{admin.name}</span>
                    </div>
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-medium
                      ${adminStatuses[admin.name] === 'online'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'}
                    `}>
                      {adminStatuses[admin.name]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className={`
          transition-all duration-200 hover:shadow-lg
          ${darkMode ? 'bg-[#2B2D31] text-white' : 'bg-white'}
          border-none shadow-md rounded-xl overflow-hidden
        `}>
          <CardHeader className="border-b border-gray-100 dark:border-gray-700">
            <CardTitle>Actividad del Servidor</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serverData.activityData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="day"
                    stroke={darkMode ? '#fff' : '#000'}
                    fontSize={12}
                  />
                  <YAxis
                    stroke={darkMode ? '#fff' : '#000'}
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? '#383A40' : '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      color: darkMode ? '#fff' : '#000'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="messages"
                    stroke="#5865F2"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#5865F2' }}
                    activeDot={{ r: 6, fill: '#5865F2' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
       {/* Footer */}
       <footer className="mt-8 pb-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <h2 className={`
              text-2xl font-bold 
              bg-gradient-to-r from-[#5865F2] via-[#4752C4] to-[#5865F2] 
              bg-clip-text text-transparent
              hover:scale-105 transform transition-all duration-300
              animate-pulse hover:animate-none
            `}>
              Elizabeth Diaz Familia
            </h2>
            
            <div className="flex gap-6">
              <a 
                href="https://github.com/Lizzy0981" 
                target="_blank" 
                rel="noopener noreferrer"
                className="transform transition-all duration-300 hover:scale-125 group"
              >
                <Github className={`
                  h-6 w-6 
                  ${darkMode ? 'text-white group-hover:text-[#5865F2]' : 'text-gray-700 group-hover:text-[#5865F2]'}
                  animate-bounce hover:animate-none
                  hover:rotate-12 transition-all duration-300
                `} />
              </a>
              
              <a 
                href="https://linkedin.com/in/eli-familia" 
                target="_blank" 
                rel="noopener noreferrer"
                className="transform transition-all duration-300 hover:scale-125 group"
              >
                <Linkedin className={`
                  h-6 w-6 
                  ${darkMode ? 'text-white group-hover:text-[#5865F2]' : 'text-gray-700 group-hover:text-[#5865F2]'}
                  animate-bounce hover:animate-none
                  hover:-rotate-12 transition-all duration-300
                  animation-delay-100
                `} />
              </a>
              
              <a 
                href="https://twitter.com/Lizzyfamilia" 
                target="_blank" 
                rel="noopener noreferrer"
                className="transform transition-all duration-300 hover:scale-125 group"
              >
                <Twitter className={`
                  h-6 w-6 
                  ${darkMode ? 'text-white group-hover:text-[#5865F2]' : 'text-gray-700 group-hover:text-[#5865F2]'}
                  animate-bounce hover:animate-none
                  hover:rotate-12 transition-all duration-300
                  animation-delay-200
                `} />
              </a>
            </div>
            
            <div className={`
              text-sm mt-2 font-medium
              ${darkMode ? 'text-gray-400' : 'text-gray-600'}
              hover:text-[#5865F2] transition-colors duration-300
              flex flex-col items-center gap-1
            `}>
              <p>Discord Dashboard</p>
              <p className="text-xs opacity-75">© {new Date().getFullYear()} | Made with 💜</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DiscordDashboard;