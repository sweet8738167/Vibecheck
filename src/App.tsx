import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from "react";
import { User, Message } from "./types";
import { 
  Heart, 
  Search, 
  User as UserIcon, 
  MessageSquare, 
  LogOut, 
  MapPin, 
  Sparkles, 
  Calendar, 
  Send, 
  Edit, 
  X, 
  Menu, 
  Check, 
  UserPlus,
  Smile,
  AlertCircle,
  Clock,
  ChevronLeft,
  Bell,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import LoginRegister from "./components/LoginRegister";

const RELATIONSHIP_GOALS = ["Namoro", "Amizade", "Conexão Casual", "Conversar"];
const ZODIAC_SIGNS = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem", 
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
];

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("vibe_token"));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Chat console states
  const [activeRecipient, setActiveRecipient] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typedMessage, setTypedMessage] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);
  
  // Custom Filters & Advanced Search options
  const [genderFilter, setGenderFilter] = useState("Todos");
  const [interestFilter, setInterestFilter] = useState("");
  const [minAgeFilter, setMinAgeFilter] = useState("");
  const [maxAgeFilter, setMaxAgeFilter] = useState("");
  const [relationshipGoalFilter, setRelationshipGoalFilter] = useState("Todos");
  const [zodiacSignFilter, setZodiacSignFilter] = useState("Todos");
  const [cityFilter, setCityFilter] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Edit profile modal state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAge, setEditAge] = useState(18);
  const [editGender, setEditGender] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editRelationshipGoal, setEditRelationshipGoal] = useState("Namoro");
  const [editZodiacSign, setEditZodiacSign] = useState("Áries");
  const [editOccupation, setEditOccupation] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Credits and Push Notifications states
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState("Pendente");
  const [testPushLoading, setTestPushLoading] = useState(false);
  const [testPushResult, setTestPushResult] = useState<string | null>(null);

  const setupPushNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushStatus("Não Suportado");
      return;
    }

    try {
      // 1. Registrar o Service Worker servido pela nossa API Express
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/"
      });
      console.log("Service Worker registrado com sucesso:", registration);

      // 2. Aguardar o SW estar ativo
      await navigator.serviceWorker.ready;

      // Atualiza o estado visual das permissões
      if (Notification.permission === "granted") {
        setPushStatus("Ativado");
      } else if (Notification.permission === "denied") {
        setPushStatus("Bloqueado");
      } else {
        setPushStatus("Pendente");
      }

      // Se a permissão já estiver bloqueada, encerramos aqui para não incomodar
      if (Notification.permission === "denied") return;

      // 3. Solicitar permissão, caso seja pendente
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          setPushStatus("Ativado");
        } else {
          setPushStatus("Bloqueado");
          return;
        }
      }

      // 4. Obter a chave pública do VAPID do servidor
      const keyRes = await fetch("/api/notifications/vapid-public-key", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!keyRes.ok) {
        throw new Error("Não foi possível buscar a chave pública do servidor.");
      }
      const { publicKey } = await keyRes.json();

      // Conversão Base64 URL para Uint8Array conforme exigido pelo standard pushManager
      const padding = "=".repeat((4 - publicKey.length % 4) % 4);
      const base64 = (publicKey + padding).replace(/\-/g, "+").replace(/_/g, "/");
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }

      // 5. Se inscrever ou recuperar inscrição atual no PushManager do navegador
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray
        });
      }

      // 6. Sincronizar inscrição com o servidor seguro em backend
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(subscription)
      });
      console.log("Inscrição de notificações push efetuada com sucesso!");
    } catch (err) {
      console.error("Erro na configuração interna do Push Notifications:", err);
    }
  };

  const triggerTestPush = async () => {
    if (!token) return;
    setTestPushLoading(true);
    setTestPushResult(null);
    try {
      const res = await fetch("/api/notifications/test-push", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTestPushResult("Notificação de teste disparada com sucesso!");
      } else {
        setTestPushResult("Falha ao disparar. Permissões ativas?");
      }
    } catch (err) {
      setTestPushResult("Erro de conexão com o servidor.");
    } finally {
      setTestPushLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && token) {
      setupPushNotifications();
    }
  }, [currentUser, token]);

  // Responsive mobile states
  const [mobileActiveView, setMobileActiveView] = useState<"list" | "profile" | "chat">("list");

  // Ref to automatically scroll to the bottom of the active chat
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Interval handlers for live chat updates
  const chatIntervalRef = useRef<any>(null);
  const convIntervalRef = useRef<any>(null);

  // 1. Check if token is valid on start and fetch user account info
  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    }
  }, [token]);

  // 2. Load users & conversations once signed-in (triggers whenever any filter changes!)
  useEffect(() => {
    if (currentUser) {
      loadUsers();
      loadConversations();
      
      // Periodically refresh list of recent conversations to display counters
      convIntervalRef.current = setInterval(loadConversations, 5000);
      return () => {
        if (convIntervalRef.current) clearInterval(convIntervalRef.current);
      };
    }
  }, [
    currentUser, 
    searchTerm, 
    genderFilter, 
    interestFilter, 
    minAgeFilter, 
    maxAgeFilter, 
    relationshipGoalFilter, 
    zodiacSignFilter, 
    cityFilter
  ]);

  // 3. Keep updating messages whenever we are actively talking to someone
  useEffect(() => {
    if (currentUser && activeRecipient) {
      loadMessages(activeRecipient.id);
      
      // Poll every 1.5 seconds when chat is open for high-performance feel
      if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
      chatIntervalRef.current = setInterval(() => {
        loadMessages(activeRecipient.id);
      }, 1500);

      return () => {
        if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
      };
    } else {
      setMessages([]);
      if (chatIntervalRef.current) {
        clearInterval(chatIntervalRef.current);
        chatIntervalRef.current = null;
      }
    }
  }, [currentUser, activeRecipient]);

  // 4. Scroll to latest messages when they change
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const safeParseJson = async (response: Response) => {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
    throw new Error("A resposta de rede não é um JSON válido.");
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await safeParseJson(response);
        setCurrentUser(data);
        
        // Inicializa campos de edição
        setEditName(data.fullName);
        setEditBio(data.bio);
        setEditAge(data.age);
        setEditGender(data.gender);
        setEditLocation(data.location);
        setEditInterests(data.interests || []);
        setEditAvatarUrl(data.avatarUrl);
        setEditRelationshipGoal(data.relationshipGoal || "Namoro");
        setEditZodiacSign(data.zodiacSign || "Áries");
        setEditOccupation(data.occupation || "");
      } else {
        // Token expirado ou rejeitado
        handleLogout();
      }
    } catch {
      handleLogout();
    }
  };

  const loadUsers = async () => {
    if (!token) return;
    try {
      const url = new URL("/api/users", window.location.origin);
      if (searchTerm) url.searchParams.set("search", searchTerm);
      if (genderFilter !== "Todos") url.searchParams.set("gender", genderFilter);
      if (interestFilter) url.searchParams.set("interest", interestFilter);
      if (minAgeFilter) url.searchParams.set("minAge", minAgeFilter);
      if (maxAgeFilter) url.searchParams.set("maxAge", maxAgeFilter);
      if (relationshipGoalFilter !== "Todos") url.searchParams.set("relationshipGoal", relationshipGoalFilter);
      if (zodiacSignFilter !== "Todos") url.searchParams.set("zodiacSign", zodiacSignFilter);
      if (cityFilter) url.searchParams.set("city", cityFilter);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await safeParseJson(response);
        setUsersList(data);
        
        // Mantém seleção do usuário se ele persistir nos resultados filtrados
        if (data.length > 0) {
          const isStillPresent = selectedUser && data.some((u: User) => u.id === selectedUser.id);
          if (!isStillPresent) {
            setSelectedUser(data[0]);
          }
        } else {
          setSelectedUser(null);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    }
  };

  const loadConversations = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/chat/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await safeParseJson(response);
        setConversations(data);
      }
    } catch (err) {
      console.error("Erro ao carregar conversas:", err);
    }
  };

  const loadMessages = async (recipientId: string) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/chat/messages?recipientId=${recipientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await safeParseJson(response);
        // Apenas recarrega se houver nova mensagem para evitar flickers
        if (JSON.stringify(data) !== JSON.stringify(messages)) {
          setMessages(data);
        }
      }
    } catch (err) {
      console.error("Erro ao buscar mensagens:", err);
    }
  };

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!token || !activeRecipient || !typedMessage.trim()) return;

    const contentToSend = typedMessage.trim();
    setTypedMessage("");

    // Otimização optimista: adiciona mensagem temporária no chat client-side
    const tempMsg: Message = {
      id: "temp_" + Date.now(),
      senderId: currentUser!.id,
      recipientId: activeRecipient.id,
      content: contentToSend,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: activeRecipient.id,
          content: contentToSend,
        }),
      });

      if (response.ok) {
        loadMessages(activeRecipient.id);
        loadConversations();
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }
  };

  const handleAuthSuccess = (user: User, userToken: string) => {
    localStorage.setItem("vibe_token", userToken);
    setToken(userToken);
    setCurrentUser(user);
    
    // Inicializa campos de edição
    setEditName(user.fullName);
    setEditBio(user.bio);
    setEditAge(user.age);
    setEditGender(user.gender);
    setEditLocation(user.location);
    setEditInterests(user.interests || []);
    setEditAvatarUrl(user.avatarUrl);
    setEditRelationshipGoal(user.relationshipGoal || "Namoro");
    setEditZodiacSign(user.zodiacSign || "Áries");
    setEditOccupation(user.occupation || "");
  };

  const handleLogout = () => {
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem("vibe_token");
    setToken(null);
    setCurrentUser(null);
    setUsersList([]);
    setSelectedUser(null);
    setActiveRecipient(null);
    setMessages([]);
  };

  // Seletor de chat nas conversas já iniciadas ou abrindo de um perfil
  const initiateChat = (user: User) => {
    setActiveRecipient(user);
    setMobileActiveView("chat");
  };

  const viewUserProfile = (user: User) => {
    setSelectedUser(user);
    if (mobileActiveView === "chat") {
      // Se estava no chat de alguém, pode alternar para o perfil
    }
    setMobileActiveView("profile");
  };

  // Manejo de interesses na edição de perfil
  const handleAddEditInterest = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !editInterests.includes(trimmed)) {
      setEditInterests([...editInterests, trimmed]);
    }
  };

  const handleRemoveEditInterest = (tag: string) => {
    setEditInterests(editInterests.filter((i) => i !== tag));
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditSuccess(null);

    if (!editName.trim()) {
      setEditError("O nome completo preferencial não pode estar em branco.");
      return;
    }

    if (editAge < 18) {
      setEditError("Você precisa ter no mínimo 18 anos de idade.");
      return;
    }

    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: editName,
          bio: editBio,
          age: editAge,
          gender: editGender,
          location: editLocation,
          interests: editInterests,
          avatarUrl: editAvatarUrl,
          relationshipGoal: editRelationshipGoal,
          zodiacSign: editZodiacSign,
          occupation: editOccupation,
        }),
      });

      const data = await safeParseJson(response);
      if (response.ok) {
        setCurrentUser(data.user);
        setEditSuccess("Seu perfil foi atualizado com absoluto sucesso e segurança!");
        setTimeout(() => {
          setIsEditingProfile(false);
          setEditSuccess(null);
        }, 1500);
      } else {
        setEditError(data.error || "Erro ao atualizar dados.");
      }
    } catch {
      setEditError("Não foi possível conectar ao servidor.");
    }
  };

  // Helper para formatar horario
  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1115] text-[#E0E0E0] selection:bg-[#E94560]/35 select-none transition">
        <LoginRegister onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  // Os usuários já vêm completamente filtrados e atualizados pelo servidor
  const filteredUsers = usersList;

  return (
    <div className="h-screen flex flex-col bg-[#0F1115] text-[#E0E0E0] select-none font-sans overflow-hidden">
      
      {/* 1. TOP BAR NAVIGATION */}
      <nav className="h-16 border-b border-white/10 flex items-center justify-between px-4 md:px-6 bg-[#16191F] shrink-0 z-30 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#E94560] rounded-xl flex items-center justify-center shadow-lg shadow-[#E94560]/35 select-none animate-pulse">
            <Heart className="text-white w-4 h-4 fill-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1">
            VibeCheck
            <span className="text-[10px] uppercase font-bold text-[#E94560] bg-[#E94560]/10 px-1.5 py-0.5 rounded-md border border-[#E94560]/20 ml-1.5 hidden sm:inline-block">
              Seguro
            </span>
            <button
              onClick={() => setIsCreditsOpen(true)}
              className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-450 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/25 ml-1.5 hover:bg-amber-400/20 cursor-pointer transition shrink-0 font-sans"
              title="Ver Créditos, Desenvolvedor e WhatsApp de Suporte"
            >
              ⭐️ Créditos & Suporte
            </button>
          </span>
        </div>

        {/* Search Input centralizado em modo Desktop */}
        <div className="hidden md:flex items-center relative w-72">
          <Search className="absolute left-3 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar por usuário ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0F1115] border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#E94560] transition"
          />
        </div>

        {/* Informações da conta conectada */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsEditingProfile(true)}
            className="flex items-center gap-2.5 text-right cursor-pointer hover:bg-white/5 p-1.5 rounded-xl transition border border-transparent hover:border-white/10"
          >
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white/90">{currentUser.fullName}</p>
              <p className="text-[9px] text-[#E94560] font-mono">@{currentUser.username}</p>
            </div>
            <img
              referrerPolicy="no-referrer"
              src={currentUser.avatarUrl}
              alt="Seu Perfil"
              className="w-9 h-9 rounded-xl object-cover border border-white/20 shadow-md"
            />
          </button>

          <div className="h-6 w-px bg-white/10"></div>

          <button
            onClick={handleLogout}
            title="Sair da Conta"
            className="p-2 bg-white/5 border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 text-white/75 hover:text-red-400 rounded-xl transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* 2. MAIN LAYOUT DE CONTEÚDO */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* BARRA DE BOTÕES DE CONTROLE EM DISPLAY MOBILE (Navegação inferior caso colapsado) */}
        <div className="md:hidden absolute bottom-4 left-4 right-4 bg-[#16191F]/90 backdrop-blur-md border border-white/10 h-14 rounded-2xl flex items-center justify-around px-4 z-40 shadow-xl shadow-black/80">
          <button
            onClick={() => setMobileActiveView("list")}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition ${
              mobileActiveView === "list" ? "text-[#E94560]" : "text-white/40"
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[9px] font-bold">Descobrir</span>
          </button>

          <button
            onClick={() => {
              if (selectedUser) {
                setMobileActiveView("profile");
              } else if (usersList.length > 0) {
                setSelectedUser(usersList[0]);
                setMobileActiveView("profile");
              }
            }}
            disabled={!selectedUser && usersList.length === 0}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition ${
              mobileActiveView === "profile" ? "text-[#E94560]" : "text-white/40"
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[9px] font-bold">Perfil</span>
          </button>

          <button
            onClick={() => {
              if (activeRecipient) {
                setMobileActiveView("chat");
              } else if (conversations.length > 0) {
                // Seleciona a última conversa iniciada
                const partnerUser = usersList.find((u) => u.id === conversations[0].id) || conversations[0];
                setActiveRecipient(partnerUser);
                setMobileActiveView("chat");
              } else {
                setMobileActiveView("list");
              }
            }}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition relative ${
              mobileActiveView === "chat" ? "text-[#E94560]" : "text-white/40"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[9px] font-bold">Conversas</span>
            
            {/* Notificação geral de não lidas */}
            {conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0) > 0 && (
              <span className="absolute top-1 right-2.5 w-2.5 h-2.5 bg-[#E94560] border-2 border-[#16191F] rounded-full"></span>
            )}
          </button>
        </div>


        {/* COLUNA ESQUERDA: DESCOBRIR USUÁRIOS & CHATS FILTRADOS */}
        <aside className={`w-full md:w-[320px] lg:w-[340px] border-r border-white/10 bg-[#16191F] flex flex-col shrink-0 ${
          mobileActiveView === "list" ? "flex" : "hidden md:flex"
        }`}>
          
          <div className="p-4 flex items-center justify-between border-b border-white/10">
            <h2 className="font-bold text-white/50 uppercase text-[10px] tracking-widest flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3 text-[#E94560]" />
              Descobrir Conexões
            </h2>
            <span className="bg-[#E94560]/10 text-[#E94560] text-[10px] px-2 py-0.5 rounded-full font-bold border border-[#E94560]/30 animate-pulse">
              {usersList.length} cadastrados
            </span>
          </div>

          {/* Filtros em Accordion leve */}
          <div className="px-4 py-2.5 bg-[#0F1115]/30 border-b border-white/5 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 font-mono">Gênero:</span>
              <div className="flex gap-1">
                {["Todos", "Feminino", "Masculino"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenderFilter(g)}
                    className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                      genderFilter === g
                        ? "bg-[#E94560]/15 border-[#E94560] text-white"
                        : "bg-transparent border-white/10 text-white/50 hover:text-white"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Busca rápida de interesses */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filtrar por interesse (Ex: Café, Trilhas)..."
                value={interestFilter}
                onChange={(e) => setInterestFilter(e.target.value)}
                className="w-full bg-[#0F1115] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-stone-200 focus:outline-none focus:ring-1 focus:ring-[#E94560] placeholder-white/30"
              />
              {interestFilter && (
                <button
                  onClick={() => setInterestFilter("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs select-none"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Input de pesquisa móvel */}
            <div className="relative block md:hidden mt-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
              <input
                type="text"
                placeholder="Pesquisar por nome ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0F1115] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white focus:outline-none placeholder-white/30 focus:ring-1 focus:ring-[#E94560]"
              />
            </div>

            {/* Expansor de busca avançada */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="text-[10.5px] font-semibold text-[#E94560] hover:underline flex items-center gap-1 cursor-pointer font-mono"
              >
                <span>{showAdvancedFilters ? "Ocultar busca avançada ▴" : "Busca avançada... ▾"}</span>
              </button>
              
              {(genderFilter !== "Todos" || interestFilter || minAgeFilter || maxAgeFilter || relationshipGoalFilter !== "Todos" || zodiacSignFilter !== "Todos" || cityFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setGenderFilter("Todos");
                    setInterestFilter("");
                    setMinAgeFilter("");
                    setMaxAgeFilter("");
                    setRelationshipGoalFilter("Todos");
                    setZodiacSignFilter("Todos");
                    setCityFilter("");
                  }}
                  className="text-[9px] text-white/40 hover:text-[#E94560] transition cursor-pointer underline font-mono"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 pt-2 border-t border-white/5 overflow-hidden"
              >
                {/* Cidade */}
                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1 font-mono">
                    Cidade / Região
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Rio de Janeiro, Curitiba..."
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="w-full bg-[#0F1115] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-[#E94560] placeholder-white/20"
                  />
                </div>

                {/* Faixa Etária */}
                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1 font-mono">
                    Idade Mínima / Máxima
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Mín"
                      min="18"
                      max="120"
                      value={minAgeFilter}
                      onChange={(e) => setMinAgeFilter(e.target.value)}
                      className="w-1/2 bg-[#0F1115] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none text-center placeholder-white/25 focus:ring-1 focus:ring-[#E94560]"
                    />
                    <span className="text-[10px] text-white/35">-</span>
                    <input
                      type="number"
                      placeholder="Máx"
                      min="18"
                      max="120"
                      value={maxAgeFilter}
                      onChange={(e) => setMaxAgeFilter(e.target.value)}
                      className="w-1/2 bg-[#0F1115] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none text-center placeholder-white/25 focus:ring-1 focus:ring-[#E94560]"
                    />
                  </div>
                </div>

                {/* Objetivo de Relacionamento */}
                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1 font-mono">
                    Objetivo
                  </label>
                  <select
                    value={relationshipGoalFilter}
                    onChange={(e) => setRelationshipGoalFilter(e.target.value)}
                    className="w-full bg-[#0F1115] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white/80 focus:outline-none focus:ring-1 focus:ring-[#E94560] h-8"
                  >
                    <option value="Todos">Todos os objetivos</option>
                    {RELATIONSHIP_GOALS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Signo do Zodíaco */}
                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1 font-mono">
                    Signo do Zodíaco
                  </label>
                  <select
                    value={zodiacSignFilter}
                    onChange={(e) => setZodiacSignFilter(e.target.value)}
                    className="w-full bg-[#0F1115] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white/80 focus:outline-none focus:ring-1 focus:ring-[#E94560] h-8"
                  >
                    <option value="Todos">Todos os signos</option>
                    {ZODIAC_SIGNS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
          </div>

          {/* LISTA DE USUÁRIOS */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 pb-24 md:pb-4">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-white/40 text-xs flex flex-col items-center justify-center gap-2">
                <Smile className="w-8 h-8 text-white/20 animate-bounce" />
                <p>Nenhum perfil encontrado.</p>
                <p className="text-[10px] text-white/25">Tente redefinir a busca ou filtros acima.</p>
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedUser?.id === u.id;
                
                // Verifica se temos alguma conversa com mensagens não lidas deste usuário
                const matchingConv = conversations.find((c) => c.id === u.id);
                const hasUnread = matchingConv && matchingConv.unreadCount > 0;

                return (
                  <div
                    key={u.id}
                    onClick={() => viewUserProfile(u)}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition border duration-150 ${
                      isSelected
                        ? "bg-white/5 border-white/10"
                        : "bg-[#16191F] border-transparent hover:bg-white/5 hover:border-white/5"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        referrerPolicy="no-referrer"
                        src={u.avatarUrl}
                        alt={u.username}
                        className="w-11 h-11 rounded-xl object-cover border border-white/15"
                      />
                      {/* Indicador de online simulated */}
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#16191F]"></span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-white/95 truncate">
                          {u.fullName}
                        </p>
                        {hasUnread && (
                          <span className="w-4 h-4 rounded-full bg-[#E94560] text-[9px] font-bold text-white flex items-center justify-center shadow-md shadow-[#E94560]/20 shrink-0">
                            {matchingConv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-[#E94560] font-mono tracking-wide">
                        @{u.username}
                      </p>
                      
                      <div className="flex items-center gap-1.5 text-[9.5px] text-white/40 truncate mt-0.5 font-sans">
                        <MapPin className="w-3 h-3 text-white/20 shrink-0" />
                        <span className="truncate">{u.location || "Sem localização"} • {u.age} anos</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* SEÇÃO EXTRA DE CHATS RECENTES DO INBOX */}
            {conversations.length > 0 && (
              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest px-3 mb-2 font-mono">Conversas Recentes</p>
                <div className="space-y-1">
                  {conversations.map((conv) => {
                    const alreadyRenderedInFiltered = filteredUsers.some((fu) => fu.id === conv.id);
                    // Apenas renderiza se o usuário não estiver listado na busca para evitar duplicidade visual óbvia
                    if (alreadyRenderedInFiltered) return null;

                    return (
                      <div
                        key={conv.id}
                        onClick={() => {
                          const customU: User = {
                            id: conv.id,
                            username: conv.username,
                            fullName: conv.fullName,
                            avatarUrl: conv.avatarUrl,
                            email: "",
                            bio: "",
                            age: 25,
                            gender: "",
                            location: "",
                            interests: [],
                            createdAt: "",
                          };
                          viewUserProfile(customU);
                        }}
                        className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl cursor-pointer transition"
                      >
                        <img
                          referrerPolicy="no-referrer"
                          src={conv.avatarUrl}
                          alt={conv.fullName}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="text-xs font-semibold text-white/80 truncate">{conv.fullName}</p>
                            {conv.unreadCount > 0 && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E94560]"></span>
                            )}
                          </div>
                          <p className="text-[10px] text-white/40 truncate italic">
                            {conv.lastMessage || "Abra o chat para ver"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>


        {/* COLUNA CENTRAL: PERFIL DE USUÁRIO SELECIONADO (PRINCIPAL DISPLAY) */}
        <main className={`flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-[#0F1115] relative overflow-y-auto ${
          mobileActiveView === "profile" ? "flex" : "hidden md:flex"
        }`}>
          
          {selectedUser ? (
            <div className="max-w-md w-full bg-[#1A1D23] rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl relative">
              
              {/* Botão de retorno mobile */}
              <button 
                onClick={() => setMobileActiveView("list")}
                className="md:hidden absolute top-4 left-4 p-2 bg-white/5 border border-white/10 text-white rounded-xl transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center">
                {/* Visualizador de Foto do Perfil super premium com gradiente de alta difusão */}
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-[#E94560] to-[#FF6B6B] p-1 mb-6 relative group shadow-xl">
                  <img
                    referrerPolicy="no-referrer"
                    src={selectedUser.avatarUrl}
                    className="w-full h-full rounded-[20px] bg-[#1A1D23] object-cover"
                    alt={selectedUser.fullName}
                  />
                  {/* Status indicador simulado */}
                  <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-[#1A1D23]"></span>
                </div>

                <h1 className="text-2xl font-black text-white tracking-tight leading-none text-center">
                  {selectedUser.fullName}{selectedUser.age ? `, ${selectedUser.age}` : ""}
                </h1>

                <p className="text-[#E94560] font-bold mt-1 text-sm tracking-widest uppercase font-mono">
                  @{selectedUser.username}
                </p>

                {/* Detalhes de localização, gênero, signo e objetivo */}
                <div className="flex items-center justify-center flex-wrap gap-2 text-white/55 text-xs my-3 font-sans">
                  {selectedUser.location && (
                    <div className="flex items-center gap-1 bg-white/5 border border-white/5 px-3 py-1 rounded-full">
                      <MapPin className="w-3.5 h-3.5 text-[#E94560]" />
                      <span>{selectedUser.location}</span>
                    </div>
                  )}

                  {selectedUser.gender && (
                    <div className="flex items-center gap-1 bg-white/5 border border-white/5 px-3 py-1 rounded-full">
                      <UserIcon className="w-3.5 h-3.5 text-[#FF6B6B]" />
                      <span>{selectedUser.gender}</span>
                    </div>
                  )}

                  {selectedUser.zodiacSign && (
                    <div className="flex items-center gap-1 bg-white/5 border border-white/5 px-3 py-1 rounded-full">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{selectedUser.zodiacSign}</span>
                    </div>
                  )}

                  {selectedUser.relationshipGoal && (
                    <div className="flex items-center gap-1 bg-[#E94560]/10 border border-[#E94560]/20 text-[#FF6B6B] px-3 py-1 rounded-full font-semibold">
                      <Heart className="w-3 h-3 fill-current" />
                      <span>{selectedUser.relationshipGoal}</span>
                    </div>
                  )}
                </div>

                {selectedUser.occupation && (
                  <p className="text-xs text-white/50 tracking-wide font-medium bg-white/5 border border-white/5 px-3.5 py-1 rounded-xl mb-1 flex items-center gap-1">
                    💼 {selectedUser.occupation}
                  </p>
                )}

                {/* biografia do perfil */}
                <div className="w-full font-serif text-white/70 text-sm leading-relaxed p-4 bg-white/5 border border-white/5 rounded-2xl my-4 text-center">
                  {selectedUser.bio ? (
                    `"${selectedUser.bio}"`
                  ) : (
                    <span className="italic text-white/30 text-xs">Este usuário ainda não adicionou uma biografia pessoal.</span>
                  )}
                </div>

                {/* Chips de interesses */}
                <div className="w-full">
                  <p className="text-[9.5px] font-bold text-white/40 uppercase tracking-widest mb-2 font-mono">Interesses & Estilo</p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {selectedUser.interests && selectedUser.interests.length > 0 ? (
                      selectedUser.interests.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-white/5 rounded-full text-[10px] uppercase font-bold text-white/50 border border-white/10 tracking-wider hover:border-[#E94560]/30 hover:text-white transition duration-150"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-white/30 italic">Nenhum interesse configurado.</span>
                    )}
                  </div>
                </div>

                {/* CTA para iniciar conversa instantânea */}
                <div className="w-full mt-8">
                  <button
                    onClick={() => initiateChat(selectedUser)}
                    className="w-full py-4 bg-[#E94560] hover:bg-[#ff5573] text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl shadow-[#E94560]/20 hover:scale-[1.01] flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Iniciar Conversa Privada
                  </button>
                </div>

              </div>

            </div>
          ) : (
            <div className="text-center text-white/40 flex flex-col items-center gap-2">
              <UserIcon className="w-12 h-12 text-white/10" />
              <p>Nenhum perfil de usuário selecionado.</p>
              <p className="text-[10px]">Utilize a barra de pesquisa ou clique em perfis à esquerda.</p>
            </div>
          )}

        </main>


        {/* COLUNA DIREITA: CONVERSA / CHAT PRIVADO ATIVO */}
        <aside className={`w-full md:w-[340px] lg:w-[380px] border-l border-white/10 bg-[#16191F] flex flex-col shrink-0 ${
          mobileActiveView === "chat" ? "flex" : "hidden lg:flex"
        }`}>
          
          {activeRecipient ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Header do Chat individual */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#16191F] shrink-0">
                <div className="flex items-center gap-3">
                  {/* Botão de retorno mobile */}
                  <button 
                    onClick={() => setMobileActiveView("list")}
                    className="lg:hidden p-1 bg-white/5 border border-white/10 text-white rounded-lg transition mr-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <img
                    referrerPolicy="no-referrer"
                    src={activeRecipient.avatarUrl}
                    alt={activeRecipient.fullName}
                    className="w-10 h-10 rounded-xl object-cover border border-white/15 cursor-pointer"
                    onClick={() => viewUserProfile(activeRecipient)}
                  />
                  <div>
                    <p 
                      className="font-bold text-xs text-white hover:text-[#E94560] cursor-pointer transition"
                      onClick={() => viewUserProfile(activeRecipient)}
                    >
                      {activeRecipient.fullName}
                    </p>
                    <p className="text-[9.5px] text-green-400 font-medium">Seguro & Online</p>
                  </div>
                </div>

                {/* Opções rápidos de fechar console */}
                <button
                  onClick={() => {
                    setActiveRecipient(null);
                    setMobileActiveView("list");
                  }}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/55 hover:text-white transition cursor-pointer"
                  title="Fechar conversa do painel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* MENSAGENS DO HISTÓRICO */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col">
                {messages.length === 0 ? (
                  <div className="my-auto text-center px-4 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mx-auto text-rose-500 animate-bounce">
                      <Smile className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/80">O gelo está quebrado!</p>
                      <p className="text-[10px] text-white/45 mt-1">Diga olá para {activeRecipient.fullName}. Compartilhe gostos em comum para uma conversa incrível!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === currentUser.id;
                    const isTemp = m.id.startsWith("temp_");

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col max-w-[82%] ${
                          isMe ? "self-end items-end" : "self-start items-start"
                        }`}
                      >
                        {/* Mensagem bubble */}
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? "bg-[#E94560] text-white rounded-br-none shadow-md shadow-[#E94560]/10"
                              : "bg-white/5 text-white/95 rounded-bl-none border border-white/10"
                          }`}
                        >
                          <p className="whitespace-pre-wrap selection:bg-[#0F1115]/30">
                            {m.content}
                          </p>
                        </div>
                        
                        {/* Time label + Status */}
                        <div className="flex items-center gap-1.5 mt-1 text-[8.5px] text-white/35 px-1 font-mono">
                          <span>{formatTime(m.timestamp)}</span>
                          {isMe && (
                            <span className="flex items-center">
                              {isTemp ? (
                                <Clock className="w-2.5 h-2.5 text-white/20 animate-spin" />
                              ) : m.read ? (
                                <span className="text-green-400 font-bold flex items-center">
                                  Lido <Check className="w-2.5 h-2.5 ml-0.5" />
                                </span>
                              ) : (
                                <Check className="w-2.5 h-2.5 text-white/40" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* FORMULÁRIO DE DIGITAÇÃO E SUBMIT */}
              <div className="p-4 bg-[#0F1115]/40 border-t border-white/10 pb-24 md:pb-4">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-[#0F1115] border border-white/10 rounded-2xl px-3 py-2 focus-within:border-[#E94560]/60 transition">
                  <input
                    type="text"
                    required
                    placeholder="Escreva uma mensagem..."
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    className="bg-transparent text-xs text-white/90 w-full focus:outline-none placeholder-white/20 font-sans"
                  />
                  <button 
                    type="submit" 
                    className="text-[#E94560] hover:text-white transition duration-150 p-1 cursor-pointer hover:scale-105"
                  >
                    <Send className="w-5 h-5 fill-current" />
                  </button>
                </form>

                <div className="flex items-center justify-center gap-1 text-[9px] text-white/30 uppercase tracking-widest mt-2 select-none font-mono">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Conexão criptografada
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white/30 space-y-2">
              <MessageSquare className="w-10 h-10 text-white/10" />
              <p className="text-xs font-semibold">Sem conversa ativa</p>
              <p className="text-[10px] leading-normal px-4">Escolha um dos usuários cadastrados e clique no botão &quot;Iniciar Conversa Privada&quot; para abrir o chat.</p>
            </div>
          )}

        </aside>

      </div>


      {/* 4. MODAL DETALHADO DE EDIÇÃO DE PERFIL */}
      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#16191F] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
            >
              
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#1A1D23]">
                <div className="flex items-center gap-2 text-white">
                  <UserIcon className="w-5 h-5 text-[#E94560]" />
                  <h3 className="font-bold text-base">Editar meu Perfil Público</h3>
                </div>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="p-1 px-2.5 bg-white/5 border border-white/10 hover:border-white/25 text-white/50 hover:text-white rounded-lg transition"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {editError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{editError}</span>
                  </div>
                )}

                {editSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{editSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">Nome Completo</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">Foto (URL)</label>
                    <input
                      type="text"
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <p className="text-[8.5px] text-white/30 mt-1">Coloque a URL de uma foto bacana</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">Sua Idade</label>
                    <input
                      type="number"
                      min="18"
                      value={editAge}
                      onChange={(e) => setEditAge(Number(e.target.value))}
                      className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">Gênero</label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl px-3 py-2 text-xs text-white h-9"
                    >
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Não-Binário">Não-Binário</option>
                      <option value="Prefiro não dizer">Prefiro não dizer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">Cidade</label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">Objetivo</label>
                    <select
                      value={editRelationshipGoal}
                      onChange={(e) => setEditRelationshipGoal(e.target.value)}
                      className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl px-3 py-2 text-xs text-white h-9 focus:ring-1 focus:ring-[#E94560]"
                    >
                      {RELATIONSHIP_GOALS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">Signo</label>
                    <select
                      value={editZodiacSign}
                      onChange={(e) => setEditZodiacSign(e.target.value)}
                      className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl px-3 py-2 text-xs text-white h-9 focus:ring-1 focus:ring-[#E94560]"
                    >
                      {ZODIAC_SIGNS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">Ocupação</label>
                    <input
                      type="text"
                      placeholder="Ex: Designer, Arquiteto"
                      value={editOccupation}
                      onChange={(e) => setEditOccupation(e.target.value)}
                      className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl px-3 py-2 text-xs text-white h-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">Biografia pessoal</label>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl px-3 py-2 text-xs text-white resize-none"
                  />
                </div>

                {/* EDIT CHIPS */}
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">Seus Interesse Tags</label>
                  <div className="flex flex-wrap gap-1 mb-2 bg-[#0F1115] p-2 border border-white/5 rounded-xl">
                    {editInterests.map((tag) => (
                      <span
                        key={tag}
                        onClick={() => handleRemoveEditInterest(tag)}
                        className="bg-[#E94560]/10 text-[#FF6B6B] border border-[#E94560]/30 text-[9.5px] px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer hover:bg-rose-950/25"
                      >
                        {tag} &times;
                      </span>
                    ))}
                    {editInterests.length === 0 && <span className="text-[9px] text-white/30 italic">Sem interesses salvos.</span>}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Adicionar novo interesse..."
                      value={customInterest}
                      onChange={(e) => setCustomInterest(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (customInterest.trim()) {
                            handleAddEditInterest(customInterest);
                            setCustomInterest("");
                          }
                        }
                      }}
                      className="flex-1 bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customInterest.trim()) {
                          handleAddEditInterest(customInterest);
                          setCustomInterest("");
                        }
                      }}
                      className="px-3 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl text-xs text-white cursor-pointer"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition cursor-pointer"
                  >
                    Encerrar sem Salvar
                  </button>
                  
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#E94560] hover:bg-[#ff5573] text-white rounded-xl font-bold text-xs transition shadow-lg shadow-[#E94560]/20 cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4.5. MODAL DETALHADO DE CRÉDITOS E NOTIFICAÇÕES PUSH */}
      <AnimatePresence>
        {isCreditsOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-[#16191F] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#1A1D23]">
                <div className="flex items-center gap-2 text-white">
                  <span className="text-xl">⭐️</span>
                  <h3 className="font-bold text-base">Créditos & Notificações</h3>
                </div>
                <button
                  onClick={() => setIsCreditsOpen(false)}
                  className="p-1 px-2.5 bg-white/5 border border-white/10 hover:border-white/25 text-white/50 hover:text-white rounded-lg transition text-sm cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                
                {/* 1. SEÇÃO DE CRÉDITOS DESENVOLVEDORES */}
                <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <h4 className="text-[10px] uppercase font-bold text-[#E94560] tracking-widest font-mono">
                    Desenvolvedores do Projeto
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E94560]/10 border border-[#E94560]/30 flex items-center justify-center text-lg shadow-sm">
                        🍨
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white/95">Lil Sweet</p>
                        <p className="text-[11px] text-white/40">Desenvolvedor do site</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-lg shadow-sm">
                        🚀
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white/95">Renildo Rafael</p>
                        <p className="text-[11px] text-white/40">Co-Desenvolvedor & Gestor</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. SEÇÃO DE SUPORTE WHATSAPP */}
                <div className="space-y-3 bg-[#E94560]/5 p-4 rounded-2xl border border-[#E94560]/15">
                  <h4 className="text-[10px] uppercase font-bold text-[#FF6B6B] tracking-widest font-mono">
                    Dúvidas & Suporte Direto
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed font-sans">
                    Fale diretamente conosco no WhatsApp para tirar dúvidas, reportar bugs ou enviar sugestões!
                  </p>
                  
                  <a
                    href="https://wa.me/258873892920"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl font-bold text-xs transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-green-500/10 hover:scale-[1.01]"
                  >
                    <span>💬</span>
                    <span>Chamar no WhatsApp: 258873892920</span>
                  </a>
                </div>

                {/* 3. CONFIGURAÇÃO DE NOTIFICAÇÕES PUSH */}
                <div className="space-y-4 bg-[#0F1115]/80 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] uppercase font-bold text-white/60 tracking-widest font-mono">
                      Notificações Push
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      pushStatus === "Ativado" 
                        ? "bg-green-500/15 text-green-400 border border-green-500/30" 
                        : pushStatus === "Bloqueado"
                        ? "bg-red-500/15 text-red-400 border border-red-500/30"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse"
                    }`}>
                      {pushStatus}
                    </span>
                  </div>

                  <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                    Avisos automáticos de novas mensagens no navegador mesmo fora do site ou em segundo plano. Configurado para funcionar com o menor uso de bateria possível.
                  </p>

                  <div className="space-y-2.5 pt-2 border-t border-white/5">
                    {pushStatus !== "Ativado" && (
                      <button
                        onClick={setupPushNotifications}
                        className="w-full py-2 bg-white/5 border border-white/10 hover:border-[#E94560]/40 text-[#E94560] hover:bg-[#E94560]/10 rounded-xl font-bold text-xs transition duration-150 cursor-pointer"
                      >
                        Autorizar Notificações Push
                      </button>
                    )}

                    <button
                      onClick={triggerTestPush}
                      disabled={testPushLoading}
                      className="w-full py-2 bg-[#E94560] hover:bg-[#ff5573] text-white rounded-xl font-bold text-xs transition duration-150 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {testPushLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <span>🔔 Disparar Teste Push</span>
                      )}
                    </button>

                    {testPushResult && (
                      <p className="text-[10px] text-center text-rose-450 font-medium font-mono mt-2 select-text">
                        {testPushResult}
                      </p>
                    )}
                  </div>
                </div>

              </div>
              
              <div className="p-4 bg-white/[0.02] border-t border-white/5 text-center text-[9.5px] text-white/30 font-mono">
                Desenvolvido por Lil Sweet e Renildo Rafael &copy; 2026
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* 5. FOOTER STATUS BAR */}
      <footer className="h-8 bg-[#0F1115] border-t border-white/10 px-4 flex items-center justify-between shrink-0 select-none text-white/40 text-[9.5px] font-mono z-20">
        <div className="flex gap-4">
          <span className="hover:text-white transition cursor-pointer uppercase tracking-tight">Política de Privacidade</span>
          <span className="hover:text-white transition cursor-pointer uppercase tracking-tight">Termos de uso</span>
        </div>
        <div className="flex items-center gap-1.5 text-green-400 uppercase tracking-widest font-bold">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"></span>
          Conexão Segura ativa (SSL / AES)
        </div>
      </footer>

    </div>
  );
}
