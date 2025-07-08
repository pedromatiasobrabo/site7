import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Moon, Sun, Coffee, Smartphone, Bed, Volume2, VolumeX, Star, Award, Heart, Users, Briefcase, Home, Dumbbell, Utensils, Droplets, Bath, Tv, Book, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface DreamStoryGameProps {
  onBack: () => void;
}

interface GameState {
  score: number;
  currentDay: number;
  gameTime: Date; // Game time (24h cycle)
  gameCompleted: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  currentRoom: string;
  alex: {
    health: number;
    energy: number;
    sleepQuality: number;
    relationships: number;
    productivity: number;
    mood: 'happy' | 'tired' | 'stressed' | 'relaxed';
  };
  dailyActions: {
    sleep: boolean;
    eat: boolean;
    exercise: boolean;
    relax: boolean;
    drinkWater: boolean;
    shower: boolean;
  };
  lastActionTime: Date;
}

interface Room {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  actions: RoomAction[];
  description: string;
  background: string;
}

interface RoomAction {
  id: keyof GameState['dailyActions'];
  name: string;
  icon: React.ComponentType<any>;
  position: { x: number; y: number };
  description: string;
}

const DreamStoryGame: React.FC<DreamStoryGameProps> = ({ onBack }) => {
  const { isDark } = useTheme();
  const audioContextRef = useRef<AudioContext | null>(null);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const gameTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [showConfirmation, setShowConfirmation] = useState<{
    show: boolean;
    action: string;
    actionId: keyof GameState['dailyActions'];
    room: string;
  }>({ show: false, action: '', actionId: 'sleep', room: '' });
  
  const [showFeedback, setShowFeedback] = useState<{
    show: boolean;
    message: string;
    type: 'positive' | 'negative';
  }>({ show: false, message: '', type: 'positive' });
  
  const [alexAnimation, setAlexAnimation] = useState<string>('idle');
  const [musicLoaded, setMusicLoaded] = useState(false);
  const [showOutsideAction, setShowOutsideAction] = useState<{
    show: boolean;
    message: string;
    consequence: string;
    points: number;
  }>({ show: false, message: '', consequence: '', points: 0 });
  
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    currentDay: 1,
    gameTime: new Date(2024, 0, 1, 7, 0, 0), // Start at 7:00 AM
    gameCompleted: false,
    soundEnabled: true,
    musicEnabled: true,
    currentRoom: 'bedroom',
    alex: {
      health: 50,
      energy: 50,
      sleepQuality: 50,
      relationships: 50,
      productivity: 50,
      mood: 'happy'
    },
    dailyActions: {
      sleep: false,
      eat: false,
      exercise: false,
      relax: false,
      drinkWater: false,
      shower: false
    },
    lastActionTime: new Date()
  });

  const rooms: Room[] = [
    {
      id: 'bedroom',
      name: 'Quarto',
      icon: Bed,
      description: 'O quarto aconchegante de Alex com uma cama confortável',
      background: 'from-purple-900/20 to-blue-900/20',
      actions: [
        {
          id: 'sleep',
          name: 'Cama',
          icon: Bed,
          position: { x: 70, y: 60 },
          description: 'Dormir'
        }
      ]
    },
    {
      id: 'living',
      name: 'Sala de Estar',
      icon: Tv,
      description: 'Sala confortável com sofá e TV para relaxar',
      background: 'from-emerald-900/20 to-teal-900/20',
      actions: [
        {
          id: 'relax',
          name: 'Sofá',
          icon: Tv,
          position: { x: 30, y: 50 },
          description: 'Relaxar'
        }
      ]
    },
    {
      id: 'kitchen',
      name: 'Cozinha',
      icon: Utensils,
      description: 'Cozinha equipada para preparar refeições saudáveis',
      background: 'from-orange-900/20 to-red-900/20',
      actions: [
        {
          id: 'eat',
          name: 'Mesa',
          icon: Utensils,
          position: { x: 50, y: 40 },
          description: 'Comer'
        },
        {
          id: 'drinkWater',
          name: 'Água',
          icon: Droplets,
          position: { x: 80, y: 30 },
          description: 'Beber água'
        }
      ]
    },
    {
      id: 'gym',
      name: 'Academia',
      icon: Dumbbell,
      description: 'Academia bem equipada para exercícios',
      background: 'from-gray-900/20 to-slate-900/20',
      actions: [
        {
          id: 'exercise',
          name: 'Equipamentos',
          icon: Dumbbell,
          position: { x: 60, y: 50 },
          description: 'Exercitar-se'
        }
      ]
    },
    {
      id: 'bathroom',
      name: 'Banheiro',
      icon: Bath,
      description: 'Banheiro limpo e relaxante',
      background: 'from-blue-900/20 to-cyan-900/20',
      actions: [
        {
          id: 'shower',
          name: 'Chuveiro',
          icon: Bath,
          position: { x: 40, y: 60 },
          description: 'Tomar banho'
        }
      ]
    }
  ];

  // Initialize audio context and background music
  useEffect(() => {
    if (gameState.soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Initialize background music with correct URL
    if (!backgroundMusicRef.current) {
      const audio = new Audio('/[KAIROSOFT SOUNDTRACKS] Game Dev Story Working Hard (1).mp3');
      audio.loop = true;
      audio.volume = 0.3;
      audio.preload = 'auto';
      
      audio.addEventListener('canplaythrough', () => {
        setMusicLoaded(true);
        console.log('Background music loaded successfully');
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Error loading background music:', e);
        setMusicLoaded(false);
      });

      backgroundMusicRef.current = audio;
    }

    return () => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current = null;
      }
    };
  }, []);

  // Game time progression (1 second real = 15 minutes game time)
  useEffect(() => {
    gameTimeIntervalRef.current = setInterval(() => {
      setGameState(prev => {
        const newGameTime = new Date(prev.gameTime);
        newGameTime.setMinutes(newGameTime.getMinutes() + 15); // Add 15 minutes every second
        
        // Check if it's a new day (past midnight)
        if (newGameTime.getDate() !== prev.gameTime.getDate()) {
          return {
            ...prev,
            gameTime: newGameTime,
            currentDay: prev.currentDay + 1,
            dailyActions: {
              sleep: false,
              eat: false,
              exercise: false,
              relax: false,
              drinkWater: false,
              shower: false
            }
          };
        }
        
        return {
          ...prev,
          gameTime: newGameTime
        };
      });
    }, 1000);

    return () => {
      if (gameTimeIntervalRef.current) {
        clearInterval(gameTimeIntervalRef.current);
      }
    };
  }, []);

  // Handle music play/pause
  useEffect(() => {
    if (backgroundMusicRef.current && musicLoaded) {
      if (gameState.musicEnabled) {
        const playPromise = backgroundMusicRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('Auto-play prevented. Music will start after user interaction.');
          });
        }
      } else {
        backgroundMusicRef.current.pause();
      }
    }
  }, [gameState.musicEnabled, musicLoaded]);

  const handleFirstInteraction = () => {
    if (backgroundMusicRef.current && gameState.musicEnabled && musicLoaded) {
      const playPromise = backgroundMusicRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Could not start background music:', error);
        });
      }
    }
  };

  // 8-bit sound generation
  const playSound = (type: 'positive' | 'negative' | 'button') => {
    if (!gameState.soundEnabled || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    switch (type) {
      case 'button':
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
        break;
      case 'positive':
        [523, 659, 784, 1047].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
          gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
          osc.start(ctx.currentTime + i * 0.15);
          osc.stop(ctx.currentTime + i * 0.15 + 0.3);
        });
        break;
      case 'negative':
        [392, 349, 311, 262].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.2);
          gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.2);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.4);
          osc.start(ctx.currentTime + i * 0.2);
          osc.stop(ctx.currentTime + i * 0.2 + 0.4);
        });
        break;
    }
  };

  const updateAlexMood = (alex: any) => {
    const avgStats = (alex.health + alex.energy + alex.sleepQuality + alex.relationships) / 4;
    if (avgStats >= 70) return 'happy';
    if (avgStats >= 50) return 'relaxed';
    if (avgStats >= 30) return 'tired';
    return 'stressed';
  };

  const navigateRoom = (direction: 'left' | 'right') => {
    handleFirstInteraction();
    playSound('button');
    
    const currentIndex = rooms.findIndex(room => room.id === gameState.currentRoom);
    let newIndex;
    
    if (direction === 'left') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : rooms.length - 1;
    } else {
      newIndex = currentIndex < rooms.length - 1 ? currentIndex + 1 : 0;
    }
    
    setGameState(prev => ({
      ...prev,
      currentRoom: rooms[newIndex].id
    }));
  };

  const handleActionClick = (action: RoomAction) => {
    handleFirstInteraction();
    playSound('button');
    
    // Check if action already performed today
    if (gameState.dailyActions[action.id]) {
      setShowFeedback({
        show: true,
        message: `Alex já ${action.description.toLowerCase()} hoje! Tente novamente amanhã.`,
        type: 'negative'
      });
      setTimeout(() => setShowFeedback({ show: false, message: '', type: 'positive' }), 3000);
      return;
    }

    // Special actions that take Alex outside
    if (action.id === 'relax' && Math.random() > 0.5) {
      // Sometimes relaxing means going out with friends
      setShowOutsideAction({
        show: true,
        message: "Alex foi para a balada com os amigos.",
        consequence: Math.random() > 0.5 
          ? "Parabéns! Alex fez novos amigos e se divertiu! Ganhou 15 pontos!"
          : "Oh não! Alex ficou cansado e perdeu qualidade de sono. Sua pontuação caiu 10 pontos!",
        points: Math.random() > 0.5 ? 15 : -10
      });
      return;
    }

    setShowConfirmation({
      show: true,
      action: action.description,
      actionId: action.id,
      room: getCurrentRoom().name
    });
  };

  const confirmAction = (confirmed: boolean) => {
    handleFirstInteraction();
    
    if (!confirmed) {
      setShowConfirmation({ show: false, action: '', actionId: 'sleep', room: '' });
      return;
    }

    const actionId = showConfirmation.actionId;
    const actionEffects = getActionEffects(actionId);
    
    // Play animation
    setAlexAnimation(actionId);
    
    // Play sound
    playSound(actionEffects.points > 0 ? 'positive' : 'negative');

    // Update game state
    setGameState(prev => {
      const newAlex = { ...prev.alex };
      
      // Apply effects
      Object.entries(actionEffects.effects).forEach(([key, value]) => {
        if (key in newAlex) {
          (newAlex as any)[key] = Math.max(0, Math.min(100, (newAlex as any)[key] + value));
        }
      });

      newAlex.mood = updateAlexMood(newAlex);

      const newScore = Math.max(0, prev.score + actionEffects.points);

      return {
        ...prev,
        score: newScore,
        alex: newAlex,
        dailyActions: {
          ...prev.dailyActions,
          [actionId]: true
        },
        lastActionTime: new Date()
      };
    });

    // Show feedback
    setShowFeedback({
      show: true,
      message: actionEffects.message,
      type: actionEffects.points > 0 ? 'positive' : 'negative'
    });

    // Hide confirmation
    setShowConfirmation({ show: false, action: '', actionId: 'sleep', room: '' });

    // Reset animation after 2 seconds
    setTimeout(() => {
      setAlexAnimation('idle');
      setShowFeedback({ show: false, message: '', type: 'positive' });
    }, 3000);
  };

  const handleOutsideActionOK = () => {
    const { points, consequence } = showOutsideAction;
    
    // Apply consequences
    setGameState(prev => {
      const newAlex = { ...prev.alex };
      
      if (points > 0) {
        newAlex.relationships += 15;
        newAlex.health += 5;
      } else {
        newAlex.sleepQuality -= 20;
        newAlex.energy -= 15;
      }
      
      // Clamp values
      Object.keys(newAlex).forEach(key => {
        if (typeof (newAlex as any)[key] === 'number') {
          (newAlex as any)[key] = Math.max(0, Math.min(100, (newAlex as any)[key]));
        }
      });

      newAlex.mood = updateAlexMood(newAlex);

      return {
        ...prev,
        score: Math.max(0, prev.score + points),
        alex: newAlex,
        dailyActions: {
          ...prev.dailyActions,
          relax: true
        },
        currentRoom: 'living' // Alex returns to living room
      };
    });

    // Show feedback
    setShowFeedback({
      show: true,
      message: consequence,
      type: points > 0 ? 'positive' : 'negative'
    });

    setShowOutsideAction({ show: false, message: '', consequence: '', points: 0 });

    setTimeout(() => {
      setShowFeedback({ show: false, message: '', type: 'positive' });
    }, 3000);
  };

  const getActionEffects = (action: keyof GameState['dailyActions']) => {
    const effects: Record<string, any> = {
      sleep: {
        points: 20,
        message: "Parabéns! Alex dormiu bem e recuperou energia. Ganhou 20 pontos!",
        effects: { sleepQuality: 25, energy: 20, health: 10 }
      },
      eat: {
        points: 15,
        message: "Parabéns! Alex fez uma refeição saudável. Ganhou 15 pontos!",
        effects: { health: 20, energy: 15 }
      },
      exercise: {
        points: 18,
        message: "Parabéns! Alex se exercitou e melhorou sua saúde. Ganhou 18 pontos!",
        effects: { health: 25, energy: -5, sleepQuality: 10 }
      },
      relax: {
        points: 12,
        message: "Parabéns! Alex relaxou e reduziu o estresse. Ganhou 12 pontos!",
        effects: { relationships: 15, health: 10, energy: 10 }
      },
      drinkWater: {
        points: 8,
        message: "Parabéns! Alex se hidratou bem. Ganhou 8 pontos!",
        effects: { health: 10, energy: 5 }
      },
      shower: {
        points: 10,
        message: "Parabéns! Alex tomou banho e se sente renovado. Ganhou 10 pontos!",
        effects: { health: 15, relationships: 10 }
      }
    };

    return effects[action] || { points: 0, message: '', effects: {} };
  };

  const getCurrentRoom = () => {
    return rooms.find(room => room.id === gameState.currentRoom) || rooms[0];
  };

  const getScoreColor = () => {
    if (gameState.score >= 100) return 'text-green-400';
    if (gameState.score >= 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatColor = (value: number) => {
    if (value >= 70) return 'text-green-400';
    if (value >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMoodEmoji = () => {
    switch (gameState.alex.mood) {
      case 'happy': return '😊';
      case 'relaxed': return '😌';
      case 'tired': return '😴';
      case 'stressed': return '😰';
      default: return '😊';
    }
  };

  const getAlexSprite = () => {
    switch (alexAnimation) {
      case 'sleep': return '🛌';
      case 'eat': return '🍽️';
      case 'exercise': return '🏋️';
      case 'relax': return '📺';
      case 'drinkWater': return '💧';
      case 'shower': return '🚿';
      default: return '🧍';
    }
  };

  const formatGameTime = () => {
    return gameState.gameTime.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const resetGame = () => {
    handleFirstInteraction();
    
    setGameState({
      score: 0,
      currentDay: 1,
      gameTime: new Date(2024, 0, 1, 7, 0, 0),
      gameCompleted: false,
      soundEnabled: gameState.soundEnabled,
      musicEnabled: gameState.musicEnabled,
      currentRoom: 'bedroom',
      alex: {
        health: 50,
        energy: 50,
        sleepQuality: 50,
        relationships: 50,
        productivity: 50,
        mood: 'happy'
      },
      dailyActions: {
        sleep: false,
        eat: false,
        exercise: false,
        relax: false,
        drinkWater: false,
        shower: false
      },
      lastActionTime: new Date()
    });
    setAlexAnimation('idle');
    setShowFeedback({ show: false, message: '', type: 'positive' });
    setShowConfirmation({ show: false, action: '', actionId: 'sleep', room: '' });
  };

  const toggleMusic = () => {
    setGameState(prev => ({ ...prev, musicEnabled: !prev.musicEnabled }));
  };

  const toggleSound = () => {
    setGameState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const currentRoom = getCurrentRoom();

  return (
    <div className={`h-screen flex flex-col transition-colors duration-300 overflow-hidden ${
      isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-white via-emerald-50/80 to-emerald-100/60'
    }`}>
      {/* Header */}
      <header className={`flex-shrink-0 backdrop-blur-sm border-b transition-colors duration-300 ${
        isDark 
          ? 'bg-slate-900/95 border-slate-800' 
          : 'bg-white/95 border-gray-200'
      }`}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className={`p-2 rounded-full transition-colors ${
                  isDark 
                    ? 'hover:bg-slate-800 text-white' 
                    : 'hover:bg-gray-100 text-gray-900'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-purple-400" />
                </div>
                <h1 className={`text-lg font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Dream Story</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Game Clock */}
              <div className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors duration-300 ${
                isDark ? 'bg-slate-800 text-white' : 'bg-gray-200 text-gray-900'
              }`}>
                <Clock className="w-4 h-4" />
                <span className="text-sm font-mono">{formatGameTime()}</span>
              </div>

              {/* Music Toggle */}
              <button
                onClick={toggleMusic}
                className={`p-2 rounded-lg transition-colors relative ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
                title={gameState.musicEnabled ? 'Desativar música' : 'Ativar música'}
              >
                <div className="relative">
                  <Volume2 className={`w-4 h-4 ${gameState.musicEnabled ? 'text-emerald-400' : 'text-gray-500'}`} />
                  {!gameState.musicEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-0.5 bg-red-500 rotate-45"></div>
                    </div>
                  )}
                </div>
                {musicLoaded && (
                  <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                    gameState.musicEnabled ? 'bg-green-400' : 'bg-gray-400'
                  }`}></div>
                )}
              </button>

              {/* Sound Effects Toggle */}
              <button
                onClick={toggleSound}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
                title={gameState.soundEnabled ? 'Desativar efeitos sonoros' : 'Ativar efeitos sonoros'}
              >
                {gameState.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              
              <button
                onClick={resetGame}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
                title="Reiniciar jogo"
              >
                <Trophy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Game Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Stats Bar */}
        <div className={`flex-shrink-0 px-4 py-3 border-b transition-colors duration-300 ${
          isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-emerald-50/50 border-emerald-200'
        }`}>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className={`text-lg font-bold ${getScoreColor()}`}>
                {gameState.score}
              </div>
              <div className={`text-xs transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-emerald-700'
              }`}>Pontos</div>
            </div>
            
            <div>
              <div className={`text-lg font-bold transition-colors duration-300 ${
                isDark ? 'text-purple-400' : 'text-purple-600'
              }`}>
                Dia {gameState.currentDay}
              </div>
              <div className={`text-xs transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-emerald-700'
              }`}>Atual</div>
            </div>

            <div>
              <div className="text-lg">{getMoodEmoji()}</div>
              <div className={`text-xs transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-emerald-700'
              }`}>Humor</div>
            </div>

            <div>
              <div className={`text-lg font-bold transition-colors duration-300 ${
                isDark ? 'text-emerald-400' : 'text-emerald-600'
              }`}>
                {currentRoom.name}
              </div>
              <div className={`text-xs transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-emerald-700'
              }`}>Local</div>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Room Background */}
          <div className={`absolute inset-0 transition-all duration-500 bg-gradient-to-br ${currentRoom.background} ${
            isDark 
              ? 'from-slate-800 to-slate-900' 
              : 'from-emerald-100 to-emerald-200'
          }`}>
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="grid grid-cols-10 grid-rows-10 h-full w-full">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div key={i} className={`border ${
                    isDark ? 'border-slate-600' : 'border-emerald-300'
                  }`}></div>
                ))}
              </div>
            </div>
          </div>

          {/* Room Navigation */}
          <button
            onClick={() => navigateRoom('left')}
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full transition-all duration-200 hover:scale-110 z-30 backdrop-blur-sm ${
              isDark 
                ? 'bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-600' 
                : 'bg-white/90 hover:bg-gray-100 text-gray-900 border border-gray-200 shadow-lg'
            }`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={() => navigateRoom('right')}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full transition-all duration-200 hover:scale-110 z-30 backdrop-blur-sm ${
              isDark 
                ? 'bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-600' 
                : 'bg-white/90 hover:bg-gray-100 text-gray-900 border border-gray-200 shadow-lg'
            }`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Alex Character */}
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
            style={{ fontSize: '3rem' }}
          >
            <div className="text-center">
              <div className="mb-2">{getAlexSprite()}</div>
              <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                isDark ? 'bg-slate-800 text-white' : 'bg-white text-emerald-900'
              }`}>
                Alex
              </div>
            </div>
          </div>

          {/* Room Actions */}
          {currentRoom.actions.map((action) => {
            const isUsed = gameState.dailyActions[action.id];
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={`absolute z-10 p-3 rounded-xl border-2 transition-all duration-200 hover:scale-110 ${
                  isUsed
                    ? isDark
                      ? 'bg-slate-700/50 border-slate-600 text-slate-500 cursor-not-allowed'
                      : 'bg-gray-200/50 border-gray-300 text-gray-500 cursor-not-allowed'
                    : isDark
                      ? 'bg-slate-800/80 border-slate-600 text-white hover:bg-slate-700/80 hover:border-slate-500 cursor-pointer'
                      : 'bg-white/80 border-emerald-300 text-emerald-700 hover:bg-emerald-50/80 hover:border-emerald-400 cursor-pointer'
                }`}
                style={{
                  left: `${action.position.x}%`,
                  top: `${action.position.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                disabled={isUsed}
              >
                <div className="flex flex-col items-center gap-1">
                  <action.icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{action.name}</span>
                  {isUsed && (
                    <div className="text-xs text-green-400">✓</div>
                  )}
                </div>
              </button>
            );
          })}

          {/* Room Title */}
          <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-30 px-4 py-2 rounded-lg backdrop-blur-sm border transition-colors duration-300 ${
            isDark 
              ? 'bg-slate-900/80 border-slate-700 text-white' 
              : 'bg-white/80 border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center gap-2">
              <currentRoom.icon className="w-5 h-5 text-emerald-400" />
              <span className="font-bold">{currentRoom.name}</span>
            </div>
            <p className="text-xs text-center mt-1 opacity-75">{currentRoom.description}</p>
          </div>

          {/* Confirmation Modal */}
          {showConfirmation.show && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className={`backdrop-blur-sm rounded-2xl p-6 border max-w-sm mx-4 transition-colors duration-300 ${
                isDark 
                  ? 'bg-slate-900/90 border-slate-800' 
                  : 'bg-white/90 border-gray-200 shadow-lg'
              }`}>
                <div className="text-center">
                  <h3 className={`text-lg font-bold mb-3 transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Confirmar Ação
                  </h3>
                  <p className={`text-sm mb-6 transition-colors duration-300 ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    Você deseja fazer Alex {showConfirmation.action.toLowerCase()}?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => confirmAction(false)}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                        isDark 
                          ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                      }`}
                    >
                      Não
                    </button>
                    <button
                      onClick={() => confirmAction(true)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-xl font-medium transition-colors"
                    >
                      Sim
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Outside Action Modal */}
          {showOutsideAction.show && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className={`backdrop-blur-sm rounded-2xl p-6 border max-w-sm mx-4 transition-colors duration-300 ${
                isDark 
                  ? 'bg-slate-900/90 border-slate-800' 
                  : 'bg-white/90 border-gray-200 shadow-lg'
              }`}>
                <div className="text-center">
                  <h3 className={`text-lg font-bold mb-3 transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Alex saiu de casa!
                  </h3>
                  <p className={`text-sm mb-6 transition-colors duration-300 ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    {showOutsideAction.message}
                  </p>
                  <button
                    onClick={handleOutsideActionOK}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Modal */}
          {showFeedback.show && (
            <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
              <div className={`backdrop-blur-sm rounded-2xl p-6 border max-w-sm mx-4 transition-colors duration-300 ${
                showFeedback.type === 'positive'
                  ? isDark
                    ? 'bg-green-500/20 border-green-500/30 text-green-400'
                    : 'bg-green-100/80 border-green-300/50 text-green-700'
                  : isDark
                    ? 'bg-red-500/20 border-red-500/30 text-red-400'
                    : 'bg-red-100/80 border-red-300/50 text-red-700'
              }`}>
                <p className="text-center font-medium">{showFeedback.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Stats */}
        <div className={`flex-shrink-0 px-4 py-3 border-t transition-colors duration-300 ${
          isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-emerald-50/50 border-emerald-200'
        }`}>
          <div className="grid grid-cols-5 gap-2 text-center">
            {[
              { label: 'Saúde', value: gameState.alex.health, icon: Heart, color: 'text-red-400' },
              { label: 'Energia', value: gameState.alex.energy, icon: Award, color: 'text-yellow-400' },
              { label: 'Sono', value: gameState.alex.sleepQuality, icon: Bed, color: 'text-purple-400' },
              { label: 'Social', value: gameState.alex.relationships, icon: Users, color: 'text-blue-400' },
              { label: 'Produtividade', value: gameState.alex.productivity, icon: Briefcase, color: 'text-green-400' }
            ].map((stat, index) => (
              <div key={index}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <stat.icon className={`w-3 h-3 ${stat.color}`} />
                  <span className={`text-xs font-medium transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>{stat.label}</span>
                </div>
                <div className={`text-sm font-bold ${getStatColor(stat.value)}`}>
                  {stat.value}%
                </div>
                <div className={`w-full rounded-full h-1 mt-1 transition-colors duration-300 ${
                  isDark ? 'bg-slate-800' : 'bg-gray-200'
                }`}>
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      stat.value >= 70 ? 'bg-green-400' :
                      stat.value >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${stat.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DreamStoryGame;