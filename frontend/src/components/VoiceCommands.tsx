import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Settings, CheckCircle, Plus, Trash2, Edit } from 'lucide-react';
import AIService from '../services/AIService';

interface VoiceCommandsProps {
  onCommandProcessed: (command: any) => void;
  tasks: any[];
}

interface ProcessedVoiceCommand {
  action: string;
  parameters: any;
  response?: string;
}

const VoiceCommands: React.FC<VoiceCommandsProps> = ({ onCommandProcessed, tasks }) => {
  const [isListening, setIsListening] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [wakeWord, setWakeWord] = useState('Hey Assistant');
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [commandHistory, setCommandHistory] = useState<any[]>([]);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check if speech recognition is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
      return;
    }
    initializeSpeechRecognition();
  }, []);

  const initializeSpeechRecognition = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        console.log('Voice recognition started');
        setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        const fullTranscript = finalTranscript + interimTranscript;
        setTranscript(fullTranscript);
        
        // Check for wake word
        if (fullTranscript.toLowerCase().includes(wakeWord.toLowerCase())) {
          setIsWakeWordActive(true);
          setTranscript('');
          // Start listening for commands
          setTimeout(() => {
            recognition.stop();
            setTimeout(() => {
              recognition.start();
            }, 100);
          }, 1000);
        }
        
        // Process commands if wake word is active
        if (isWakeWordActive && finalTranscript) {
          processVoiceCommand(finalTranscript);
          setIsWakeWordActive(false);
          setTranscript('');
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsWakeWordActive(false);
        
        // Handle specific errors
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access and try again.');
        } else if (event.error === 'no-speech') {
          console.log('No speech detected');
        } else if (event.error === 'network') {
          alert('Network error occurred. Please check your internet connection.');
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
        // Restart if enabled and wake word is active
        if (isEnabled && isWakeWordActive) {
          setTimeout(() => {
            recognition.start();
          }, 100);
        }
      };
      
      setRecognition(recognition);
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      alert('Failed to initialize speech recognition. Please refresh the page and try again.');
    }
  };

  const toggleVoiceRecognition = () => {
    if (!recognition) return;
    
    if (isEnabled) {
      recognition.stop();
      setIsEnabled(false);
      setIsListening(false);
      setIsWakeWordActive(false);
    } else {
      recognition.start();
      setIsEnabled(true);
    }
  };

  const processVoiceCommand = async (command: string) => {
    try {
      let processedCommand: ProcessedVoiceCommand;
      try {
        processedCommand = await AIService.processVoiceCommand(command, tasks);
      } catch (error) {
        console.log('AI voice command processing failed, using fallback:', error);
        // Fallback: basic command parsing
        const lowerCommand = command.toLowerCase();
        if (lowerCommand.includes('add') || lowerCommand.includes('create')) {
          const taskName = command.replace(/add|create|task/gi, '').trim();
          processedCommand = {
            action: 'add',
            parameters: { taskName: taskName || 'New Task' },
            response: `Adding task: ${taskName || 'New Task'}`
          };
        } else if (lowerCommand.includes('complete') || lowerCommand.includes('done')) {
          const taskName = command.replace(/complete|done|finish/gi, '').trim();
          processedCommand = {
            action: 'complete',
            parameters: { taskName: taskName },
            response: `Marking task as complete: ${taskName}`
          };
        } else if (lowerCommand.includes('delete') || lowerCommand.includes('remove')) {
          const taskName = command.replace(/delete|remove/gi, '').trim();
          processedCommand = {
            action: 'delete',
            parameters: { taskName: taskName },
            response: `Deleting task: ${taskName}`
          };
        } else if (lowerCommand.includes('list') || lowerCommand.includes('show')) {
          processedCommand = {
            action: 'list',
            parameters: { filter: 'all' },
            response: `Showing all tasks. You have ${tasks.length} tasks.`
          };
        } else {
          processedCommand = {
            action: 'unknown',
            parameters: { command: command },
            response: `I didn't understand that command. Try saying "add task", "complete task", or "list tasks".`
          };
        }
      }
      
      // Add to command history
      setCommandHistory(prev => [
        {
          id: Date.now(),
          command: command,
          action: processedCommand.action,
          parameters: processedCommand.parameters,
          timestamp: new Date()
        },
        ...prev.slice(0, 9) // Keep last 10 commands
      ]);
      
      // Execute the command
      executeCommand(processedCommand);
      
      // Speak response
      if (processedCommand.response) {
        speakResponse(processedCommand.response);
      }
      
      // Notify parent component
      onCommandProcessed(processedCommand);
      
    } catch (error) {
      console.error('Error processing voice command:', error);
      speakResponse('Sorry, I encountered an error processing your command. Please try again.');
    }
  };

  const executeCommand = (processedCommand: ProcessedVoiceCommand) => {
    switch (processedCommand.action) {
      case 'add':
        // Handle add task
        console.log('Adding task:', processedCommand.parameters);
        break;
      case 'complete':
        // Handle complete task
        console.log('Completing task:', processedCommand.parameters);
        break;
      case 'delete':
        // Handle delete task
        console.log('Deleting task:', processedCommand.parameters);
        break;
      case 'edit':
        // Handle edit task
        console.log('Editing task:', processedCommand.parameters);
        break;
      case 'list':
        // Handle list tasks
        console.log('Listing tasks:', processedCommand.parameters);
        break;
      default:
        console.log('Unknown command:', processedCommand);
    }
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const getCommandIcon = (action: string) => {
    switch (action) {
      case 'add': return <Plus size={16} className="text-green-500" />;
      case 'complete': return <CheckCircle size={16} className="text-blue-500" />;
      case 'delete': return <Trash2 size={16} className="text-red-500" />;
      case 'edit': return <Edit size={16} className="text-yellow-500" />;
      default: return <Settings size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Voice Commands</h3>
        <div className="flex items-center gap-2">
          {isSupported ? (
            <button
              onClick={toggleVoiceRecognition}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isEnabled 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          ) : (
            <div className="px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm">
              Not Supported
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
          <span className={`px-2 py-1 rounded-full text-xs ${
            !isSupported ? 'bg-red-100 text-red-800' :
            isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {!isSupported ? 'Not Supported' : isEnabled ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        {!isSupported && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari for voice commands.
            </p>
          </div>
        )}
        
        {isSupported && isWakeWordActive && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-600 dark:text-blue-400">Listening for command...</span>
          </div>
        )}
      </div>

      {/* Wake Word */}
      {isSupported && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Wake Word
          </label>
          <input
            type="text"
            value={wakeWord}
            onChange={(e) => setWakeWord(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Hey Assistant"
          />
        </div>
      )}

      {/* Live Transcript */}
      {isSupported && isListening && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Live Transcript
          </label>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg min-h-[60px]">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {transcript || 'Listening...'}
            </p>
          </div>
        </div>
      )}

      {/* Command History */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Commands</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {commandHistory.length > 0 ? (
            commandHistory.map((cmd) => (
              <div key={cmd.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {getCommandIcon(cmd.action)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {cmd.command}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {cmd.action} • {cmd.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No commands yet. Try saying "{wakeWord}" followed by a command.
            </p>
          )}
        </div>
      </div>

      {/* Voice Commands Help */}
      {isSupported && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Voice Commands</h4>
          <div className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
            <p>• "{wakeWord}, add task [task name]"</p>
            <p>• "{wakeWord}, complete [task name]"</p>
            <p>• "{wakeWord}, delete [task name]"</p>
            <p>• "{wakeWord}, show urgent tasks"</p>
            <p>• "{wakeWord}, start focus mode"</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceCommands;
