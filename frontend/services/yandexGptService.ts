interface YandexGPTMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface YandexGPTResponse {
  result: {
    alternatives: Array<{
      message: {
        role: string;
        text: string;
      }
    }>;
  };
}

class YandexGPTService {  private readonly API_URL = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';
  private readonly API_KEY = 'AQVNzeWYK4XOJbrAx-nivt1-pHPcV9vgV8az7g_W';
  private readonly FOLDER_ID = 'b1gq0fsi6smsmo3bqpqj';

  async sendMessage(message: string): Promise<string> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.API_KEY}`,
          'Content-Type': 'application/json',
          'x-folder-id': this.FOLDER_ID
        },
        body: JSON.stringify({
          modelUri: "gpt://b1gq0fsi6smsmo3bqpqj/yandexgpt/rc",
          completionOptions: {
            stream: false,
            maxTokens: 500,
            temperature: 0.3
          },
          messages: [
            {
              role: "user",
              text: message
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: YandexGPTResponse = await response.json();
      return data.result.alternatives[0]?.message?.text || 'No response received';
    } catch (error) {
      console.error('Error calling YandexGPT:', error);
      throw error;
    }
  }
}

export const yandexGptService = new YandexGPTService();
