const DISCORD_API_URL = 'https://discord.com/api/v10';

class DiscordService {
  constructor(token) {
    this.token = token;
    this.headers = {
      'Authorization': `Bot ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async fetchWithError(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: this.headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || 
          `Discord API Error: ${response.status} ${response.statusText}`
        );
      }

      return response.json();
    } catch (error) {
      console.error('Discord API Error:', error);
      return this.getFallbackData(url, options);
    }
  }

  getFallbackData(url, options = {}) {
    // Datos simulados mejorados
    if (url.includes('/guilds/')) {
      return {
        approximate_member_count: 1, // Cambiado a 1 ya que es un servidor nuevo
        name: 'Servidor de Prueba'
      };
    }
    
    if (url.includes('/messages')) {
      if (options.method === 'POST') {
        // Manejo específico para envío de mensajes
        const messageContent = options.body ? JSON.parse(options.body).content : '';
        return {
          id: Date.now().toString(),
          author: { username: 'Usuario' },
          content: messageContent,
          timestamp: new Date().toISOString()
        };
      }
      // Datos para obtener mensajes
      return [
        {
          id: Date.now().toString(),
          author: { username: 'Sistema' },
          content: 'Bienvenido al servidor',
          timestamp: new Date().toISOString()
        }
      ];
    }

    return null;
  }

  async getGuildInfo(guildId) {
    return this.fetchWithError(`${DISCORD_API_URL}/guilds/${guildId}`);
  }

  async getChannelMessages(channelId, limit = 5) {
    return this.fetchWithError(`${DISCORD_API_URL}/channels/${channelId}/messages?limit=${limit}`);
  }

  async sendMessage(channelId, content) {
    try {
      const result = await this.fetchWithError(`${DISCORD_API_URL}/channels/${channelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });

      // Si el envío fue exitoso, devolvemos el resultado
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      // En caso de error, devolvemos un mensaje simulado
      return {
        id: Date.now().toString(),
        author: { username: 'Usuario' },
        content: content,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getChannelStats(channelId, days = 7) {
    // Estadísticas simuladas más estables
    let baseValue = 150; // Valor base para las estadísticas
    
    return Array(days).fill(0).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - index));
      
      // Variación suave de ±20 mensajes
      const variation = Math.sin(index / 2) * 20;
      const messages = Math.round(baseValue + variation);
      
      return {
        day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        messages: messages
      };
    });
  }
}

export default DiscordService;