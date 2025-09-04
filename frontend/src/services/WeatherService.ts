interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  isIndoor: boolean;
}

class WeatherService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor() {
    // The API key is correctly read from environment variables
    this.apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY || null;
  }

  /**
   * Fetches weather for the user's current location.
   * Prompts the user for location permission.
   */
  async getCurrentWeather(): Promise<WeatherData> {
    if (!this.apiKey) {
      console.log('No API key found. Returning mock data.');
      return this.getMockWeatherData();
    }

    try {
      // Get user's current position
      const position = await this._getCurrentPosition();
      const { latitude, longitude } = position.coords;

      // Fetch weather using coordinates
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        location: data.name,
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main.toLowerCase(),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        isIndoor: this.isIndoorWeather(data.weather[0].main.toLowerCase())
      };
    } catch (error) {
      console.error('Error fetching weather or getting location:', error);
      // Fallback if geolocation fails or the API call fails
      return this.getMockWeatherData();
    }
  }

  /**
   * A private helper to get the user's current geo-position as a Promise.
   */
  private _getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      }
    });
  }

  private isIndoorWeather(condition: string): boolean {
    const indoorConditions = ['rain', 'snow', 'thunderstorm', 'drizzle'];
    return indoorConditions.includes(condition);
  }

  /**
   * FIX: This function now returns static, informative fallback data 
   * instead of random values. This makes it clear when the app is unable 
   * to fetch the real weather.
   */
  private getMockWeatherData(): WeatherData {
    return {
      location: 'Location Unavailable',
      temperature: 0,
      condition: 'unknown',
      description: 'Please allow location access in your browser and check your API key.',
      icon: '50d', // A neutral icon like 'mist' or 'fog'
      humidity: 0,
      windSpeed: 0,
      isIndoor: true // Default to indoor-friendly
    };
  }

  /**
   * Categorizes tasks as indoor or outdoor based on their content
   */
  categorizeTaskLocation(task: any): 'indoor' | 'outdoor' | 'flexible' {
    const text = `${task.name} ${task.desc || ''}`.toLowerCase();
    
    // Outdoor task keywords
    const outdoorKeywords = [
      'walk', 'run', 'jog', 'hike', 'bike', 'cycle', 'drive', 'travel',
      'garden', 'yard', 'lawn', 'plant', 'outdoor', 'outside', 'patio',
      'park', 'beach', 'pool', 'swim', 'tennis', 'golf', 'soccer', 'football',
      'basketball', 'volleyball', 'baseball', 'cricket', 'hockey', 'skate',
      'skateboard', 'surf', 'kayak', 'canoe', 'fishing', 'camping', 'picnic',
      'bbq', 'grill', 'outdoor meeting', 'street', 'sidewalk', 'construction',
      'landscaping', 'roof', 'exterior', 'outdoor event', 'festival', 'concert',
      'market', 'shopping mall', 'outdoor dining', 'terrace', 'balcony',
      'delivery', 'pickup', 'errand', 'visit', 'appointment', 'meeting outside'
    ];
    
    // Indoor task keywords
    const indoorKeywords = [
      'desk', 'computer', 'laptop', 'office', 'home', 'indoor', 'inside',
      'meeting room', 'conference', 'call', 'video call', 'zoom', 'teams',
      'email', 'document', 'report', 'analysis', 'research', 'study',
      'read', 'write', 'code', 'programming', 'development', 'design',
      'planning', 'strategy', 'budget', 'finance', 'accounting', 'admin',
      'kitchen', 'cooking', 'baking', 'cleaning', 'laundry', 'organize',
      'library', 'classroom', 'training', 'workshop', 'presentation',
      'gym', 'workout', 'exercise', 'yoga', 'meditation', 'therapy',
      'doctor', 'dentist', 'hospital', 'clinic', 'pharmacy', 'bank',
      'store', 'shop', 'restaurant', 'cafe', 'theater', 'cinema',
      'museum', 'gallery', 'exhibition', 'conference room', 'boardroom'
    ];
    
    // Check for outdoor keywords
    const hasOutdoorKeywords = outdoorKeywords.some(keyword => text.includes(keyword));
    
    // Check for indoor keywords
    const hasIndoorKeywords = indoorKeywords.some(keyword => text.includes(keyword));
    
    // Determine category
    if (hasOutdoorKeywords && !hasIndoorKeywords) {
      return 'outdoor';
    } else if (hasIndoorKeywords && !hasOutdoorKeywords) {
      return 'indoor';
    } else if (hasOutdoorKeywords && hasIndoorKeywords) {
      return 'flexible'; // Can be done either way
    } else {
      // Default to indoor for ambiguous tasks
      return 'indoor';
    }
  }

  /**
   * Gets categorized tasks based on weather conditions
   */
  getCategorizedTasks(tasks: any[]): { indoor: any[], outdoor: any[], flexible: any[] } {
    const categorized: { indoor: any[], outdoor: any[], flexible: any[] } = { 
      indoor: [], 
      outdoor: [], 
      flexible: [] 
    };
    
    tasks.forEach(task => {
      const category = this.categorizeTaskLocation(task);
      categorized[category].push(task);
    });
    
    return categorized;
  }

  getWeatherSuggestions(weather: WeatherData, tasks: any[]): string[] {
    const suggestions: string[] = [];
    const categorized = this.getCategorizedTasks(tasks);
    
    if (weather.isIndoor) {
      suggestions.push('Perfect weather for focused indoor work!');
      suggestions.push(`Great time to tackle ${categorized.indoor.length} indoor tasks.`);
      if (categorized.flexible.length > 0) {
        suggestions.push(`Consider doing ${categorized.flexible.length} flexible tasks indoors today.`);
      }
      suggestions.push('Consider scheduling meetings and planning sessions.');
    } else {
      suggestions.push('Nice weather for outdoor activities!');
      if (categorized.outdoor.length > 0) {
        suggestions.push(`Perfect time for ${categorized.outdoor.length} outdoor tasks.`);
      }
      if (categorized.flexible.length > 0) {
        suggestions.push(`Consider doing ${categorized.flexible.length} flexible tasks outdoors today.`);
      }
      suggestions.push('Great time for outdoor meetings or breaks.');
    }
    
    if (weather.temperature > 25) {
      suggestions.push('High temperature - stay hydrated and take breaks.');
      if (categorized.outdoor.length > 0) {
        suggestions.push('Consider rescheduling outdoor tasks for cooler hours.');
      }
    } else if (weather.temperature < 10) {
      suggestions.push('Cold weather - perfect for focused indoor work.');
      if (categorized.outdoor.length > 0) {
        suggestions.push('Consider postponing outdoor tasks until warmer weather.');
      }
    }
    
    if (weather.condition === 'rainy') {
      suggestions.push('Rainy weather - ideal for creative and analytical tasks.');
      if (categorized.outdoor.length > 0) {
        suggestions.push('Postpone outdoor tasks due to rain.');
      }
    } else if (weather.condition === 'sunny') {
      suggestions.push('Sunny weather - great for energizing tasks and meetings.');
      if (categorized.outdoor.length > 0) {
        suggestions.push('Excellent weather for outdoor activities!');
      }
    }
    
    return suggestions;
  }

  getWeatherIcon(condition: string): string {
    const iconMap: { [key: string]: string } = {
      'sunny': '☀️',
      'cloudy': '☁️',
      'rainy': '🌧️',
      'snow': '❄️',
      'thunderstorm': '⛈️',
      'partly cloudy': '⛅',
      'clear': '🌙',
      'unknown': '❓' // Added icon for the unknown state
    };
    
    return iconMap[condition] || '🌤️';
  }

  getWeatherColor(condition: string): string {
    const colorMap: { [key: string]: string } = {
      'sunny': 'text-yellow-500',
      'cloudy': 'text-gray-500',
      'rainy': 'text-blue-500',
      'snow': 'text-blue-300',
      'thunderstorm': 'text-purple-500',
      'partly cloudy': 'text-gray-400',
      'clear': 'text-blue-600'
    };
    
    return colorMap[condition] || 'text-gray-500';
  }
}

export default new WeatherService();