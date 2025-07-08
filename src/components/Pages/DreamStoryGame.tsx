import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Moon, Sun, Coffee, Smartphone, Bed, Volume2, VolumeX, Star, Award, Heart, Users, Briefcase, Home, Dumbbell, Utensils, Droplets, Bath, Tv, Book, ChevronLeft, ChevronRight, Clock, Zap, Brain, Eye, Smile, Frown, Meh, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface DreamStoryGameProps {
  onBack: () => void;
}

interface GameState {
  score: number;
  currentDay: number;
  gameTime: Date;
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
    hygiene: number;
    nutrition: number;
    fitness: number;
    mood: 'happy' | 'tired' | 'stressed' | 'relaxed' | 'energetic' | 'sick';
  };
  dailyActions: {
    sleep: boolean;
    eat: boolean;
    exercise: boolean;
    relax: boolean;
    drinkWater: boolean;
    shower: boolean;
    brushTeeth: boolean;
    cookHealthy: boolean;
    readBook: boolean;
    watchTV: boolean;
    meditation: boolean;
    weightLifting: boolean;
  };
  lastActionTime: Date;
  consecutiveGoodActions: number;
  consecutiveBadActions: number;
}

interface Room {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  actions: RoomAction[];
  description: string;
  background: string;
  detailedDescription: string;
}

interface RoomAction {
  id: keyof GameState['dailyActions'];
  name: string;
  icon: React.ComponentType<any>;
  position: { x: number; y: number };
  description: string;
  actionType: 'positive' | 'negative' | 'neutral';
  consequences: string[];
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
    actionType: 'positive' | 'negative' | 'neutral';
    consequences: string[];
  }>({ show: false, action: '', actionId: 'sleep', room: '', actionType: 'neutral', consequences: [] });
  
  const [showFeedback, setShowFeedback] = useState<{
    show: boolean;
    message: string;
    type: 'positive' | 'negative' | 'neutral';
    points: number;
  }>({ show: false, message: '', type: 'positive', points: 0 });
  
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
    gameTime: new Date(2024, 0, 1, 7, 0, 0),
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
      hygiene: 50,
      nutrition: 50,
      fitness: 50,
      mood: 'happy'
    },
    dailyActions: {
      sleep: false,
      eat: false,
      exercise: false,
      relax: false,
      drinkWater: false,
      shower: false,
      brushTeeth: false,
      cookHealthy: false,
      readBook: false,
      watchTV: false,
      meditation: false,
      weightLifting: false
    },
    lastActionTime: new Date(),
    consecutiveGoodActions: 0,
    consecutiveBadActions: 0
  });

  const rooms: Room[] = [
    {
      id: 'bedroom',
      name: 'Quarto',
      icon: Bed,
      description: 'Quarto aconchegante com cama confortável',
      detailedDescription: 'Um quarto pixel art com uma cama grande com cobertores coloridos, um armário de madeira com portas abertas e uma cômoda. No canto, uma cadeira de leitura e uma luminária de mesa. Ao lado da cama, uma pequena mesa de cabeceira com um relógio despertador.',
      background: 'from-purple-900/20 to-blue-900/20',
      actions: [
        {
          id: 'sleep',
          name: 'Cama',
          icon: Bed,
          position: { x: 75, y: 65 },
          description: 'Dormir na cama confortável',
          actionType: 'positive',
          consequences: ['Restaura energia e melhora humor', 'Aumenta qualidade do sono', 'Melhora saúde geral']
        },
        {
          id: 'readBook',
          name: 'Cadeira de Leitura',
          icon: Book,
          position: { x: 20, y: 30 },
          description: 'Ler um livro na cadeira',
          actionType: 'positive',
          consequences: ['Aumenta produtividade', 'Melhora concentração', 'Desenvolve conhecimento']
        }
      ]
    },
    {
      id: 'living',
      name: 'Sala de Estar',
      icon: Tv,
      description: 'Sala confortável com sofá e TV',
      detailedDescription: 'Uma sala de estar detalhada em pixel art, com um sofá confortável, uma televisão com controles ao lado e uma mesa de centro. Objetos decorativos como uma planta em um vaso ao lado da janela, um tapete de padrão geométrico no chão e prateleiras com livros.',
      background: 'from-emerald-900/20 to-teal-900/20',
      actions: [
        {
          id: 'watchTV',
          name: 'Televisão',
          icon: Tv,
          position: { x: 80, y: 35 },
          description: 'Assistir televisão no sofá',
          actionType: 'negative',
          consequences: ['Reduz atividade física', 'Pode causar sedentarismo', 'Diminui produtividade se excessivo']
        },
        {
          id: 'meditation',
          name: 'Tapete',
          icon: Brain,
          position: { x: 45, y: 75 },
          description: 'Meditar ou se alongar no tapete',
          actionType: 'positive',
          consequences: ['Reduz estresse', 'Melhora bem-estar mental', 'Aumenta flexibilidade']
        }
      ]
    },
    {
      id: 'kitchen',
      name: 'Cozinha',
      icon: Utensils,
      description: 'Cozinha equipada para refeições',
      detailedDescription: 'Uma cozinha pixel art detalhada com um fogão a gás, um micro-ondas, uma pia, uma geladeira e uma mesa de jantar. Na bancada, uma tábua de cortar, faca e frutas frescas.',
      background: 'from-orange-900/20 to-red-900/20',
      actions: [
        {
          id: 'cookHealthy',
          name: 'Fogão',
          icon: Utensils,
          position: { x: 25, y: 45 },
          description: 'Cozinhar refeição saudável',
          actionType: 'positive',
          consequences: ['Melhora nutrição', 'Aumenta saúde', 'Desenvolve habilidades culinárias']
        },
        {
          id: 'eat',
          name: 'Micro-ondas',
          icon: Zap,
          position: { x: 75, y: 25 },
          description: 'Aquecer comida congelada',
          actionType: 'negative',
          consequences: ['Nutrição inferior', 'Menos saudável', 'Conveniência vs qualidade']
        },
        {
          id: 'drinkWater',
          name: 'Pia',
          icon: Droplets,
          position: { x: 85, y: 55 },
          description: 'Beber água fresca',
          actionType: 'positive',
          consequences: ['Melhora hidratação', 'Aumenta energia', 'Beneficia saúde geral']
        }
      ]
    },
    {
      id: 'gym',
      name: 'Academia',
      icon: Dumbbell,
      description: 'Academia bem equipada',
      detailedDescription: 'Uma academia em pixel art com equipamentos de exercício como uma esteira e um supino reto. Pesos e halteres ao redor, além de um espelho na parede e um ventilador de teto.',
      background: 'from-gray-900/20 to-slate-900/20',
      actions: [
        {
          id: 'exercise',
          name: 'Esteira',
          icon: Dumbbell,
          position: { x: 65, y: 50 },
          description: 'Correr na esteira',
          actionType: 'positive',
          consequences: ['Melhora condicionamento', 'Aumenta energia', 'Fortalece sistema cardiovascular']
        },
        {
          id: 'weightLifting',
          name: 'Supino',
          icon: Award,
          position: { x: 25, y: 65 },
          description: 'Levantar pesos',
          actionType: 'positive',
          consequences: ['Aumenta força muscular', 'Melhora resistência', 'Desenvolve disciplina']
        }
      ]
    },
    {
      id: 'bathroom',
      name: 'Banheiro',
      icon: Bath,
      description: 'Banheiro limpo e relaxante',
      detailedDescription: 'Um banheiro em pixel art com um chuveiro com cortina, uma pia com espelho, um vaso sanitário e uma toalha pendurada. No chão, um tapete de banho macio.',
      background: 'from-blue-900/20 to-cyan-900/20',
      actions: [
        {
          id: 'shower',
          name: 'Chuveiro',
          icon: Bath,
          position: { x: 20, y: 65 },
          description: 'Tomar banho relaxante',
          actionType: 'positive',
          consequences: ['Melhora higiene', 'Relaxa músculos', 'Aumenta bem-estar']
        },
        {
          id: 'brushTeeth',
          name: 'Pia',
          icon: Smile,
          position: { x: 75, y: 35 },
          description: 'Escovar os dentes',
          actionType: 'positive',
          consequences: ['Mantém saúde bucal', 'Previne problemas dentários', 'Melhora higiene pessoal']
        }
      ]
    }
  ];

  // Initialize audio context and background music
  useEffect(() => {
    if (gameState.soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (!backgroundMusicRef.current) {
      const audio = new Audio('/[KAIROSOFT SOUNDTRACKS] Game Dev Story Working Hard (1).mp3');
      audio.loop = true;
      audio.volume = 0.3;
      audio.preload = 'auto';
      
      audio.addEventListener('canplaythrough', () => {
        setMusicLoaded(true);
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

  // Game time progression
  useEffect(() => {
    gameTimeIntervalRef.current = setInterval(() => {
      setGameState(prev => {
        const newGameTime = new Date(prev.gameTime);
        newGameTime.setMinutes(newGameTime.getMinutes() + 15);
        
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
              shower: false,
              brushTeeth: false,
              cookHealthy: false,
              readBook: false,
              watchTV: false,
              meditation: false,
              weightLifting: false
            }
          };
        }
        
        return { ...prev, gameTime: newGameTime };
      });
    }, 1000);

    return () => {
      if gameTimeIntervalRef.current) {
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

  // Enhanced sound generation
  const playSound = (type: 'positive' | 'negative' | 'button' | 'achievement') => {
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
      case 'achievement':
        [523, 659, 784, 1047, 1319].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.5);
          osc.start(ctx.currentTime + i * 0.1);
          osc.stop(ctx.currentTime + i * 0.1 + 0.5);
        });
        break;
    }
  };

  const updateAlexMood = (alex: any) => {
    const avgStats = (alex.health + alex.energy + alex.sleepQuality + alex.hygiene + alex.nutrition + alex.fitness) / 6;
    
    if (avgStats >= 80) return 'energetic';
    if (avgStats >= 65) return 'happy';
    if (avgStats >= 50) return 'relaxed';
    if (avgStats >= 35) return 'tired';
    if (avgStats >= 20) return 'stressed';
    return 'sick';
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
    
    if (gameState.dailyActions[action.id]) {
      setShowFeedback({
        show: true,
        message: `Alex já ${action.description.toLowerCase()} hoje! Tente novamente amanhã.`,
        type: 'negative',
        points: 0
      });
      setTimeout(() => setShowFeedback({ show: false, message: '', type: 'positive', points: 0 }), 3000);
      return;
    }

    // Special random events for certain actions
    if (action.id === 'relax' && Math.random() > 0.7) {
      setShowOutsideAction({
        show: true,
        message: "Alex decidiu sair para encontrar amigos no parque.",
        consequence: Math.random() > 0.5 
          ? "Ótimo! Alex fez novos amigos e se divertiu ao ar livre! Ganhou 20 pontos e melhorou relacionamentos!"
          : "Alex ficou muito tempo fora e se cansou. Perdeu 15 pontos e energia.",
        points: Math.random() > 0.5 ? 20 : -15
      });
      return;
    }

    setShowConfirmation({
      show: true,
      action: action.description,
      actionId: action.id,
      room: getCurrentRoom().name,
      actionType: action.actionType,
      consequences: action.consequences
    });
  };

  const confirmAction = (confirmed: boolean) => {
    handleFirstInteraction();
    
    if (!confirmed) {
      setShowConfirmation({ 
        show: false, 
        action: '', 
        actionId: 'sleep', 
        room: '', 
        actionType: 'neutral', 
        consequences: [] 
      });
      return;
    }

    const actionId = showConfirmation.actionId;
    const actionType = showConfirmation.actionType;
    const actionEffects = getActionEffects(actionId, actionType);
    
    setAlexAnimation(actionId);
    
    // Play appropriate sound
    if (actionEffects.points > 0) {
      playSound('positive');
      if (actionEffects.points >= 25) {
        playSound('achievement');
      }
    } else if (actionEffects.points < 0) {
      playSound('negative');
    }

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
      
      // Update consecutive actions
      let newConsecutiveGood = prev.consecutiveGoodActions;
      let newConsecutiveBad = prev.consecutiveBadActions;
      
      if (actionEffects.points > 0) {
        newConsecutiveGood += 1;
        newConsecutiveBad = 0;
      } else if (actionEffects.points < 0) {
        newConsecutiveBad += 1;
        newConsecutiveGood = 0;
      }

      return {
        ...prev,
        score: newScore,
        alex: newAlex,
        dailyActions: {
          ...prev.dailyActions,
          [actionId]: true
        },
        lastActionTime: new Date(),
        consecutiveGoodActions: newConsecutiveGood,
        consecutiveBadActions: newConsecutiveBad
      };
    });

    // Show feedback
    setShowFeedback({
      show: true,
      message: actionEffects.message,
      type: actionEffects.points > 0 ? 'positive' : actionEffects.points < 0 ? 'negative' : 'neutral',
      points: actionEffects.points
    });

    setShowConfirmation({ 
      show: false, 
      action: '', 
      actionId: 'sleep', 
      room: '', 
      actionType: 'neutral', 
      consequences: [] 
    });

    setTimeout(() => {
      setAlexAnimation('idle');
      setShowFeedback({ show: false, message: '', type: 'positive', points: 0 });
    }, 3000);
  };

  const handleOutsideActionOK = () => {
    const { points } = showOutsideAction;
    
    setGameState(prev => {
      const newAlex = { ...prev.alex };
      
      if (points > 0) {
        newAlex.relationships += 20;
        newAlex.health += 10;
        newAlex.energy += 5;
      } else {
        newAlex.energy -= 20;
        newAlex.health -= 10;
      }
      
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
        currentRoom: 'living'
      };
    });

    setShowFeedback({
      show: true,
      message: showOutsideAction.consequence,
      type: points > 0 ? 'positive' : 'negative',
      points: points
    });

    setShowOutsideAction({ show: false, message: '', consequence: '', points: 0 });

    setTimeout(() => {
      setShowFeedback({ show: false, message: '', type: 'positive', points: 0 });
    }, 3000);
  };

  const getActionEffects = (action: keyof GameState['dailyActions'], actionType: 'positive' | 'negative' | 'neutral') => {
    const baseEffects: Record<string, any> = {
      sleep: {
        points: 25,
        message: "💤 Excelente! Alex dormiu profundamente e acordou revigorado! +25 pontos!",
        effects: { sleepQuality: 30, energy: 25, health: 15, mood: 'energetic' }
      },
      brushTeeth: {
        points: 15,
        message: "🦷 Perfeito! Alex manteve uma excelente higiene bucal! +15 pontos!",
        effects: { hygiene: 25, health: 10 }
      },
      shower: {
        points: 20,
        message: "🚿 Ótimo! Alex se sente limpo e renovado após o banho! +20 pontos!",
        effects: { hygiene: 30, health: 15, energy: 10 }
      },
      cookHealthy: {
        points: 30,
        message: "👨‍🍳 Fantástico! Alex preparou uma refeição nutritiva e deliciosa! +30 pontos!",
        effects: { nutrition: 35, health: 20, energy: 15 }
      },
      eat: {
        points: -15,
        message: "🥡 Hmm... Comida de micro-ondas não é a melhor opção. -15 pontos.",
        effects: { nutrition: -10, health: -5 }
      },
      drinkWater: {
        points: 12,
        message: "💧 Hidratação é fundamental! Alex se sente mais energizado! +12 pontos!",
        effects: { health: 15, energy: 10 }
      },
      exercise: {
        points: 25,
        message: "🏃‍♂️ Incrível! Alex completou um ótimo treino cardiovascular! +25 pontos!",
        effects: { fitness: 30, health: 20, energy: -5, sleepQuality: 15 }
      },
      weightLifting: {
        points: 28,
        message: "💪 Excelente! Alex desenvolveu força e resistência! +28 pontos!",
        effects: { fitness: 35, health: 25, energy: -10, productivity: 10 }
      },
      readBook: {
        points: 22,
        message: "📚 Maravilhoso! Alex expandiu seus conhecimentos através da leitura! +22 pontos!",
        effects: { productivity: 25, energy: 5, sleepQuality: 10 }
      },
      watchTV: {
        points: -12,
        message: "📺 Alex passou muito tempo assistindo TV. Sedentarismo não é bom. -12 pontos.",
        effects: { fitness: -15, energy: -10, productivity: -5 }
      },
      meditation: {
        points: 20,
        message: "🧘‍♂️ Perfeito! Alex encontrou paz interior e reduziu o estresse! +20 pontos!",
        effects: { health: 20, energy: 15, sleepQuality: 20, productivity: 10 }
      },
      relax: {
        points: 15,
        message: "😌 Ótimo! Alex relaxou e recarregou as energias! +15 pontos!",
        effects: { relationships: 15, health: 10, energy: 10 }
      }
    };

    // Apply bonuses for consecutive good actions
    const effect = baseEffects[action] || { points: 0, message: '', effects: {} };
    
    if (actionType === 'positive' && gameState.consecutiveGoodActions >= 3) {
      effect.points = Math.floor(effect.points * 1.5);
      effect.message += " 🔥 Sequência de boas ações! Bônus aplicado!";
    }

    return effect;
  };

  const getCurrentRoom = () => {
    return rooms.find(room => room.id === gameState.currentRoom) || rooms[0];
  };

  const getScoreColor = () => {
    if (gameState.score >= 200) return 'text-green-400';
    if (gameState.score >= 100) return 'text-yellow-400';
    if (gameState.score >= 0) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStatColor = (value: number) => {
    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-yellow-400';
    if (value >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getMoodEmoji = () => {
    switch (gameState.alex.mood) {
      case 'energetic': return '⚡';
      case 'happy': return '😊';
      case 'relaxed': return '😌';
      case 'tired': return '😴';
      case 'stressed': return '😰';
      case 'sick': return '🤒';
      default: return '😊';
    }
  };

  const getAlexSprite = () => {
    switch (alexAnimation) {
      case 'sleep': return '🛌';
      case 'eat': return '🍽️';
      case 'cookHealthy': return '👨‍🍳';
      case 'exercise': return '🏃‍♂️';
      case 'weightLifting': return '🏋️‍♂️';
      case 'relax': return '😌';
      case 'meditation': return '🧘‍♂️';
      case 'drinkWater': return '💧';
      case 'shower': return '🚿';
      case 'brushTeeth': return '🦷';
      case 'readBook': return '📚';
      case 'watchTV': return '📺';
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
        hygiene: 50,
        nutrition: 50,
        fitness: 50,
        mood: 'happy'
      },
      dailyActions: {
        sleep: false,
        eat: false,
        exercise: false,
        relax: false,
        drinkWater: false,
        shower: false,
        brushTeeth: false,
        cookHealthy: false,
        readBook: false,
        watchTV: false,
        meditation: false,
        weightLifting: false
      },
      lastActionTime: new Date(),
      consecutiveGoodActions: 0,
      consecutiveBadActions: 0
    });
    setAlexAnimation('idle');
    setShowFeedback({ show: false, message: '', type: 'positive', points: 0 });
    setShowConfirmation({ 
      show: false, 
      action: '', 
      actionId: 'sleep', 
      room: '', 
      actionType: 'neutral', 
      consequences: [] 
    });
  };

  const toggleMusic = () => {
    setGameState(prev => ({ ...prev, musicEnabled: !prev.musicEnabled }));
  };

  const toggleSound = () => {
    setGameState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const currentRoom = getCurrentRoom();

  // Pixel Art Room Component
  const PixelArtRoom: React.FC<{ room: Room }> = ({ room }) => {
    const renderRoomContent = () => {
      switch (room.id) {
        case 'bedroom':
          return (
            <div className="relative w-full h-full">
              {/* Floor */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-amber-900/30 to-amber-800/20"></div>
              
              {/* Walls */}
              <div className="absolute top-0 left-0 right-0 h-2/3 bg-gradient-to-b from-blue-900/20 to-blue-800/30"></div>
              
              {/* Bed */}
              <div className="absolute bottom-8 right-4 w-24 h-16 bg-red-800/60 rounded-lg border-2 border-red-900/80">
                <div className="absolute top-1 left-1 right-1 h-3 bg-white/80 rounded"></div>
                <div className="absolute top-4 left-1 right-1 bottom-1 bg-blue-600/70 rounded"></div>
              </div>
              
              {/* Nightstand */}
              <div className="absolute bottom-8 right-28 w-8 h-8 bg-amber-800/80 border border-amber-900"></div>
              
              {/* Reading Chair */}
              <div className="absolute bottom-12 left-4 w-12 h-12 bg-green-800/70 rounded-lg border border-green-900">
                <div className="absolute top-1 left-1 right-1 h-4 bg-green-600/80 rounded"></div>
              </div>
              
              {/* Wardrobe */}
              <div className="absolute top-8 left-4 w-16 h-20 bg-amber-900/80 border-2 border-amber-950">
                <div className="absolute top-2 left-2 w-5 h-16 bg-amber-800/60 border-r border-amber-950"></div>
                <div className="absolute top-2 right-2 w-5 h-16 bg-amber-800/60"></div>
              </div>
              
              {/* Window */}
              <div className="absolute top-4 right-8 w-16 h-12 bg-cyan-200/40 border-2 border-gray-600">
                <div className="absolute inset-1 border border-gray-500"></div>
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-500"></div>
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-500"></div>
              </div>
            </div>
          );
          
        case 'living':
          return (
            <div className="relative w-full h-full">
              {/* Floor */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-emerald-900/30 to-emerald-800/20"></div>
              
              {/* Walls */}
              <div className="absolute top-0 left-0 right-0 h-2/3 bg-gradient-to-b from-emerald-900/20 to-emerald-800/30"></div>
              
              {/* Sofa */}
              <div className="absolute bottom-12 left-8 w-20 h-12 bg-blue-800/70 rounded-lg border border-blue-900">
                <div className="absolute top-1 left-1 right-1 h-4 bg-blue-600/80 rounded"></div>
                <div className="absolute top-5 left-2 w-4 h-4 bg-blue-700/80 rounded"></div>
                <div className="absolute top-5 right-2 w-4 h-4 bg-blue-700/80 rounded"></div>
              </div>
              
              {/* TV */}
              <div className="absolute top-16 right-4 w-16 h-12 bg-gray-900 border-2 border-gray-800 rounded">
                <div className="absolute inset-2 bg-gray-700 rounded"></div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800"></div>
              </div>
              
              {/* TV Stand */}
              <div className="absolute top-28 right-2 w-20 h-6 bg-amber-800/80 border border-amber-900"></div>
              
              {/* Coffee Table */}
              <div className="absolute bottom-20 left-12 w-12 h-8 bg-amber-700/80 border border-amber-800 rounded"></div>
              
              {/* Carpet */}
              <div className="absolute bottom-8 left-6 w-24 h-16 bg-red-800/40 border border-red-900/60 rounded">
                <div className="absolute inset-2 border border-red-700/60"></div>
                <div className="absolute top-4 left-4 right-4 bottom-4 bg-red-700/30"></div>
              </div>
              
              {/* Plant */}
              <div className="absolute top-12 left-4 w-6 h-8 bg-amber-800/80 border border-amber-900">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-6 bg-green-600/80 rounded-full"></div>
              </div>
              
              {/* Bookshelf */}
              <div className="absolute top-8 left-12 w-12 h-16 bg-amber-900/80 border border-amber-950">
                <div className="absolute top-2 left-1 right-1 h-2 bg-red-600/60"></div>
                <div className="absolute top-5 left-1 right-1 h-2 bg-blue-600/60"></div>
                <div className="absolute top-8 left-1 right-1 h-2 bg-green-600/60"></div>
                <div className="absolute top-11 left-1 right-1 h-2 bg-purple-600/60"></div>
              </div>
            </div>
          );
          
        case 'kitchen':
          return (
            <div className="relative w-full h-full">
              {/* Floor */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-gray-300/40 to-gray-200/30"></div>
              
              {/* Walls */}
              <div className="absolute top-0 left-0 right-0 h-2/3 bg-gradient-to-b from-orange-200/30 to-orange-300/20"></div>
              
              {/* Counter */}
              <div className="absolute bottom-8 left-4 w-32 h-8 bg-amber-700/80 border border-amber-800"></div>
              
              {/* Stove */}
              <div className="absolute bottom-16 left-6 w-12 h-8 bg-gray-800 border border-gray-900 rounded">
                <div className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="absolute bottom-1 left-1 w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="absolute bottom-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
              
              {/* Microwave */}
              <div className="absolute top-12 right-4 w-12 h-8 bg-gray-700 border border-gray-800 rounded">
                <div className="absolute inset-1 bg-gray-600 rounded"></div>
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded"></div>
              </div>
              
              {/* Refrigerator */}
              <div className="absolute top-8 right-12 w-10 h-24 bg-gray-200 border-2 border-gray-400 rounded">
                <div className="absolute top-2 left-1 right-1 h-10 border-b border-gray-400"></div>
                <div className="absolute top-1 right-1 w-1 h-2 bg-gray-500"></div>
                <div className="absolute top-14 right-1 w-1 h-2 bg-gray-500"></div>
              </div>
              
              {/* Sink */}
              <div className="absolute bottom-16 right-2 w-10 h-6 bg-gray-300 border border-gray-500 rounded">
                <div className="absolute inset-1 bg-gray-400 rounded"></div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-gray-600"></div>
              </div>
              
              {/* Dining Table */}
              <div className="absolute bottom-12 left-16 w-16 h-12 bg-amber-600/80 border border-amber-700 rounded"></div>
              
              {/* Cutting Board */}
              <div className="absolute bottom-12 left-8 w-4 h-3 bg-amber-500/80 border border-amber-600 rounded"></div>
              
              {/* Fruits */}
              <div className="absolute bottom-11 left-10 w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="absolute bottom-11 left-12 w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="absolute bottom-11 left-14 w-2 h-2 bg-yellow-500 rounded-full"></div>
            </div>
          );
          
        case 'gym':
          return (
            <div className="relative w-full h-full">
              {/* Floor */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-gray-800/40 to-gray-700/30"></div>
              
              {/* Walls */}
              <div className="absolute top-0 left-0 right-0 h-2/3 bg-gradient-to-b from-gray-700/30 to-gray-800/20"></div>
              
              {/* Treadmill */}
              <div className="absolute bottom-12 right-8 w-16 h-12 bg-gray-800 border border-gray-900 rounded">
                <div className="absolute top-2 left-2 right-2 h-6 bg-gray-700 rounded"></div>
                <div className="absolute bottom-1 left-2 right-2 h-2 bg-gray-900"></div>
                <div className="absolute top-1 right-1 w-3 h-4 bg-red-600 rounded"></div>
              </div>
              
              {/* Bench Press */}
              <div className="absolute bottom-8 left-4 w-20 h-8 bg-gray-700 border border-gray-800">
                <div className="absolute top-1 left-2 right-2 h-2 bg-gray-600"></div>
                <div className="absolute top-4 left-4 right-4 h-2 bg-gray-800"></div>
              </div>
              
              {/* Weights */}
              <div className="absolute bottom-16 left-6 w-3 h-3 bg-gray-900 rounded-full border border-gray-800"></div>
              <div className="absolute bottom-16 left-10 w-3 h-3 bg-gray-900 rounded-full border border-gray-800"></div>
              <div className="absolute bottom-16 left-14 w-3 h-3 bg-gray-900 rounded-full border border-gray-800"></div>
              
              {/* Mirror */}
              <div className="absolute top-8 left-4 w-24 h-16 bg-gray-300/60 border-2 border-gray-500">
                <div className="absolute inset-1 bg-gray-200/40"></div>
              </div>
              
              {/* Dumbbells */}
              <div className="absolute bottom-12 left-16 w-6 h-2 bg-gray-800 rounded">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-900 rounded-full"></div>
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-gray-900 rounded-full"></div>
              </div>
              
              {/* Fan */}
              <div className="absolute top-4 right-8 w-8 h-8 bg-gray-600 rounded-full border border-gray-700">
                <div className="absolute inset-2 bg-gray-500 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-4 bg-gray-400"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-1 bg-gray-400"></div>
              </div>
            </div>
          );
          
        case 'bathroom':
          return (
            <div className="relative w-full h-full">
              {/* Floor */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-blue-200/40 to-blue-100/30"></div>
              
              {/* Walls */}
              <div className="absolute top-0 left-0 right-0 h-2/3 bg-gradient-to-b from-blue-100/30 to-blue-200/20"></div>
              
              {/* Shower */}
              <div className="absolute bottom-8 left-4 w-12 h-16 bg-gray-300/60 border-2 border-gray-500">
                <div className="absolute top-2 left-2 right-2 h-1 bg-gray-600"></div>
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-gray-600"></div>
                <div className="absolute bottom-2 left-2 right-2 h-8 bg-blue-300/40"></div>
              </div>
              
              {/* Sink */}
              <div className="absolute bottom-16 right-4 w-12 h-8 bg-white/80 border border-gray-400 rounded">
                <div className="absolute top-2 left-2 right-2 h-3 bg-gray-200 rounded"></div>
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-gray-500"></div>
              </div>
              
              {/* Mirror */}
              <div className="absolute top-8 right-4 w-12 h-8 bg-gray-300/60 border border-gray-500">
                <div className="absolute inset-1 bg-gray-200/40"></div>
              </div>
              
              {/* Toilet */}
              <div className="absolute bottom-8 right-12 w-6 h-8 bg-white/90 border border-gray-400 rounded">
                <div className="absolute top-1 left-1 right-1 h-3 bg-gray-100 rounded"></div>
                <div className="absolute bottom-1 left-1 right-1 h-3 bg-white rounded"></div>
              </div>
              
              {/* Towel */}
              <div className="absolute top-12 left-8 w-3 h-8 bg-blue-400/80 border border-blue-500"></div>
              
              {/* Bath Mat */}
              <div className="absolute bottom-4 left-8 w-12 h-4 bg-blue-600/60 border border-blue-700 rounded"></div>
              
              {/* Toilet Paper */}
              <div className="absolute bottom-12 right-8 w-2 h-2 bg-white border border-gray-300 rounded-full"></div>
            </div>
          );
          
        default:
          return <div className="w-full h-full bg-gray-500/20"></div>;
      }
    };

    return (
      <div className="absolute inset-0 overflow-hidden">
        {renderRoomContent()}
      </div>
    );
  };

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
              <div className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors duration-300 ${
                isDark ? 'bg-slate-800 text-white' : 'bg-gray-200 text-gray-900'
              }`}>
                <Clock className="w-4 h-4" />
                <span className="text-sm font-mono">{formatGameTime()}</span>
              </div>

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
          {/* Pixel Art Room Background */}
          <div className="absolute inset-0">
            <PixelArtRoom room={currentRoom} />
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
            const actionTypeColor = action.actionType === 'positive' ? 'border-green-500/50' : 
                                   action.actionType === 'negative' ? 'border-red-500/50' : 'border-blue-500/50';
            
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
                      ? `bg-slate-800/80 ${actionTypeColor} text-white hover:bg-slate-700/80 cursor-pointer`
                      : `bg-white/80 ${actionTypeColor} text-emerald-700 hover:bg-emerald-50/80 cursor-pointer`
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
                  {!isUsed && (
                    <div className={`text-xs ${
                      action.actionType === 'positive' ? 'text-green-400' :
                      action.actionType === 'negative' ? 'text-red-400' : 'text-blue-400'
                    }`}>
                      {action.actionType === 'positive' ? '+' : action.actionType === 'negative' ? '-' : '?'}
                    </div>
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

          {/* Enhanced Confirmation Modal */}
          {showConfirmation.show && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className={`backdrop-blur-sm rounded-2xl p-6 border max-w-sm mx-4 transition-colors duration-300 ${
                isDark 
                  ? 'bg-slate-900/90 border-slate-800' 
                  : 'bg-white/90 border-gray-200 shadow-lg'
              }`}>
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    showConfirmation.actionType === 'positive' ? 'bg-green-500/20' :
                    showConfirmation.actionType === 'negative' ? 'bg-red-500/20' : 'bg-blue-500/20'
                  }`}>
                    {showConfirmation.actionType === 'positive' ? (
                      <Star className="w-8 h-8 text-green-400" />
                    ) : showConfirmation.actionType === 'negative' ? (
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                    ) : (
                      <Eye className="w-8 h-8 text-blue-400" />
                    )}
                  </div>
                  
                  <h3 className={`text-lg font-bold mb-3 transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {showConfirmation.action}
                  </h3>
                  
                  <div className={`text-sm mb-6 transition-colors duration-300 ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    <p className="mb-3">Consequências possíveis:</p>
                    <ul className="space-y-1 text-left">
                      {showConfirmation.consequences.map((consequence, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className={`mt-1 ${
                            showConfirmation.actionType === 'positive' ? 'text-green-400' :
                            showConfirmation.actionType === 'negative' ? 'text-red-400' : 'text-blue-400'
                          }`}>•</span>
                          <span>{consequence}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => confirmAction(false)}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                        isDark 
                          ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                      }`}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => confirmAction(true)}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                        showConfirmation.actionType === 'positive' ? 'bg-green-500 hover:bg-green-600' :
                        showConfirmation.actionType === 'negative' ? 'bg-red-500 hover:bg-red-600' :
                        'bg-blue-500 hover:bg-blue-600'
                      } text-white`}
                    >
                      Confirmar
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
                  }`}>Alex saiu de casa!</h3>
                  <p className={`text-sm mb-6 transition-colors duration-300 ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    {showOutsideAction.message}
                  </p>
                  <button
                    onClick={handleOutsideActionOK}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                  >
                    Ver resultado
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Feedback Modal */}
          {showFeedback.show && (
            <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
              <div className={`backdrop-blur-sm rounded-2xl p-6 border max-w-sm mx-4 transition-colors duration-300 ${
                showFeedback.type === 'positive'
                  ? isDark
                    ? 'bg-green-500/20 border-green-500/30 text-green-400'
                    : 'bg-green-100/80 border-green-300/50 text-green-700'
                  : showFeedback.type === 'negative'
                    ? isDark
                      ? 'bg-red-500/20 border-red-500/30 text-red-400'
                      : 'bg-red-100/80 border-red-300/50 text-red-700'
                    : isDark
                      ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                      : 'bg-blue-100/80 border-blue-300/50 text-blue-700'
              }`}>
                <div className="text-center">
                  <div className={`text-2xl font-bold mb-2 ${
                    showFeedback.points > 0 ? 'text-green-400' :
                    showFeedback.points < 0 ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {showFeedback.points > 0 ? '+' : ''}{showFeedback.points} pontos
                  </div>
                  <p className="font-medium">{showFeedback.message}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Bottom Stats */}
        <div className={`flex-shrink-0 px-4 py-3 border-t transition-colors duration-300 ${
          isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-emerald-50/50 border-emerald-200'
        }`}>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Saúde', value: gameState.alex.health, icon: Heart, color: 'text-red-400' },
              { label: 'Energia', value: gameState.alex.energy, icon: Zap, color: 'text-yellow-400' },
              { label: 'Higiene', value: gameState.alex.hygiene, icon: Bath, color: 'text-blue-400' },
              { label: 'Nutrição', value: gameState.alex.nutrition, icon: Utensils, color: 'text-green-400' }
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
                      stat.value >= 80 ? 'bg-green-400' :
                      stat.value >= 60 ? 'bg-yellow-400' :
                      stat.value >= 40 ? 'bg-orange-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${stat.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Consecutive Actions Indicator */}
          {(gameState.consecutiveGoodActions >= 3 || gameState.consecutiveBadActions >= 3) && (
            <div className={`mt-2 text-center text-xs font-medium ${
              gameState.consecutiveGoodActions >= 3 ? 'text-green-400' : 'text-red-400'
            }`}>
              {gameState.consecutiveGoodActions >= 3 
                ? `🔥 ${gameState.consecutiveGoodActions} ações positivas seguidas! Bônus ativo!`
                : `⚠️ ${gameState.consecutiveBadActions} ações negativas seguidas! Cuidado!`
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DreamStoryGame;