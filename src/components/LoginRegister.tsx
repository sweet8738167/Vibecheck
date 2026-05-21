import { useState, KeyboardEvent, FormEvent } from "react";
import { User } from "../types";
import { Heart, Mail, Lock, User as UserIcon, Calendar, MapPin, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

// Avatares ilustrativos de alta qualidade da Unsplash para o perfil de encontros
const AVATAR_PRESETS = [
  { id: "f1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80", label: "Estilo Moderno" },
  { id: "f2", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80", label: "Estreante Casual" },
  { id: "f3", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80", label: "Elegante Editorial" },
  { id: "m1", url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80", label: "Aventureiro" },
  { id: "m2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80", label: "Clássico Sorridente" },
  { id: "m3", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80", label: "Descontraído" }
];

const POPULAR_INTERESTS = [
  "Música", "Culinária", "Viagens", "Leitura", "Cinema", 
  "Esportes", "Animais", "Tecnologia", "Arte", "Séries", 
  "Jogos de Tabuleiro", "Trilhas", "Surfe", "Café"
];

const RELATIONSHIP_GOALS = ["Namoro", "Amizade", "Conexão Casual", "Conversar"];
const ZODIAC_SIGNS = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem", 
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
];

interface LoginRegisterProps {
  onAuthSuccess: (user: User, token: string) => void;
}

export default function LoginRegister({ onAuthSuccess }: LoginRegisterProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados dos formulários
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");

  // Cadastro prolongado
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState("Feminino");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].url);
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  
  // Novos estados opcionais de perfil
  const [relationshipGoal, setRelationshipGoal] = useState("Namoro");
  const [zodiacSign, setZodiacSign] = useState("Áries");
  const [occupation, setOccupation] = useState("");

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  const handleAddInterest = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
    }
  };

  const handleRemoveInterest = (tag: string) => {
    setInterests(interests.filter((i) => i !== tag));
  };

  const handleCustomInterestKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (customInterest.trim()) {
        handleAddInterest(customInterest);
        setCustomInterest("");
      }
    }
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao conectar com o servidor.");
      }

      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "Erro no login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !fullName.trim() || !email.trim() || !regPassword) {
      setError("Os campos: Usuário, Nome Completo, Email e Senha são de preenchimento obrigatório.");
      return;
    }

    if (regPassword.length < 6) {
      setError("A senha deve conter pelo menos 6 caracteres.");
      return;
    }

    if (age < 18) {
      setError("Você deve ter pelo menos 18 anos de idade para se cadastrar.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          fullName,
          email,
          password: regPassword,
          avatarUrl: selectedAvatar,
          bio,
          age,
          gender,
          location,
          interests,
          relationshipGoal,
          zodiacSign,
          occupation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao efetuar cadastro.");
      }

      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "Problema ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center p-4">
      <div className="w-full max-w-lg md:max-w-2xl bg-[#16191F] rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row">
        
        {/* Banner lateral de boas vindas (Visível apenas em Desktop) */}
        <div className="hidden md:flex md:w-5/12 p-8 flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#E94560] to-[#FF6B6B] opacity-90 z-0"></div>
          
          <div className="relative z-10 flex items-center gap-2">
            <Heart className="w-6 h-6 fill-white stroke-none animate-pulse" />
            <span className="font-bold tracking-tight text-lg">VibeCheck</span>
          </div>

          <div className="relative z-10 space-y-4 my-auto">
            <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
              Encontre sua frequência.
            </h2>
            <p className="text-white/85 text-xs leading-relaxed">
              Um ambiente minimalista e acolhedor focado no que realmente importa: conversas sinceras e perfis autênticos.
            </p>
          </div>

          <div className="relative z-10 text-[10px] uppercase text-white/50 tracking-widest">
            &copy; 2026 VibeCheck
          </div>
        </div>

        {/* Bloco de Formulários */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center bg-[#16191F]">
          <div className="mb-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-[#E94560] font-bold mb-1 md:hidden">
              <Heart className="w-5 h-5 fill-current" />
              <span>VibeCheck</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}
            </h1>
            <p className="text-white/60 text-xs mt-1">
              {isLogin
                ? "Entre para conversar e ver novos perfis próximos."
                : "Cadastre-se para criar seu perfil e iniciar amizades ou namoros."}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 bg-[#E94560]/10 border border-[#E94560]/30 rounded-xl text-[#FF6B6B] text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {isLogin ? (
            /* FORMULÁRIO DE LOGIN */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                  Usuário ou E-mail
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                  <input
                    type="text"
                    required
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="sweet ou email@exemplo.com"
                    className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white/90 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha segura"
                    className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white/90 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#E94560] hover:bg-[#ff5573] disabled:bg-[#E94560]/40 text-white rounded-2xl font-bold transition-all shadow-lg shadow-[#E94560]/20 flex items-center justify-center gap-1.5 text-sm cursor-pointer mt-2"
              >
                {loading ? "Entrando..." : "Entrar com segurança"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* FORMULÁRIO DE CADASTRO */
            <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[60vh] md:max-h-[50vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                    Nome de Usuário (@único) *
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                    <input
                      type="text"
                      required
                      placeholder="lucas_designer"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl py-2 pl-10 pr-3 text-xs text-white/90 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Lucas Rodrigues Santos"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl py-2 px-3 text-xs text-white/90 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                    E-mail Privado *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                    <input
                      type="email"
                      required
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl py-2 pl-10 pr-3 text-xs text-white/90 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                    Senha de Acesso *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 6 dígitos"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl py-2 pl-10 pr-3 text-xs text-white/90 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                    Idade (Min 18) *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                    <input
                      type="number"
                      required
                      min="18"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl py-2 pl-10 pr-3 text-xs text-white/90 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                    Gênero *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl py-2 px-3 text-xs text-white/90 outline-none transition"
                  >
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Não-Binário">Não-Binário</option>
                    <option value="Prefiro não dizer">Prefiro não dizer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                    Localização (Cidade)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Curitiba, PR"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl py-2 pl-10 pr-3 text-xs text-white/90 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                    Objetivo
                  </label>
                  <select
                    value={relationshipGoal}
                    onChange={(e) => setRelationshipGoal(e.target.value)}
                    className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl py-2 px-3 text-xs text-white/90 outline-none transition focus:ring-1 focus:ring-[#E94560]"
                  >
                    {RELATIONSHIP_GOALS.map((goal) => (
                      <option key={goal} value={goal}>
                        {goal}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                    Signo
                  </label>
                  <select
                    value={zodiacSign}
                    onChange={(e) => setZodiacSign(e.target.value)}
                    className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl py-2 px-3 text-xs text-white/90 outline-none transition focus:ring-1 focus:ring-[#E94560]"
                  >
                    {ZODIAC_SIGNS.map((sign) => (
                      <option key={sign} value={sign}>
                        {sign}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                    Profissão / Ocupação
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Designer, Dev"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl py-2 px-3 text-xs text-white/90 outline-none transition"
                  />
                </div>
              </div>

              {/* SELEÇÃO DE AVATAR PRESET */}
              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#E94560] fill-[#E94560]/10" />
                  Foto de Perfil
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedAvatar(preset.url)}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition ${
                        selectedAvatar === preset.url
                          ? "border-[#E94560] scale-105 shadow-md shadow-[#E94560]/20"
                          : "border-transparent opacity-80 hover:opacity-100 hover:scale-102"
                      }`}
                    >
                      <img
                        referrerPolicy="no-referrer"
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                  Biografia / Sobre Você
                </label>
                <textarea
                  placeholder="Escreva algumas frases para as pessoas te conhecerem..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  maxLength={250}
                  className="w-full bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-xl py-2 px-3 text-xs text-white/90 outline-none transition resize-none font-sans"
                />
              </div>

              {/* INTERESSE CHIPS SELECTOR */}
              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                  Interesses & Estilo de Vida
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2 max-h-24 overflow-y-auto p-1.5 border border-white/10 rounded-lg bg-[#0F1115]/50">
                  {interests.length === 0 ? (
                    <span className="text-[10px] text-white/30 italic">Nenhum interesse selecionado. Adicione clicando abaixo!</span>
                  ) : (
                    interests.map((tag) => (
                      <span
                        key={tag}
                        onClick={() => handleRemoveInterest(tag)}
                        className="bg-[#E94560]/10 text-[#FF6B6B] border border-[#E94560]/30 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer hover:bg-[#E94560]/20 transition"
                      >
                        {tag} &times;
                      </span>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Outro? Digite e aperte Enter..."
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    onKeyDown={handleCustomInterestKeyDown}
                    className="flex-1 bg-[#0F1115] border border-white/10 focus:border-[#E94560] rounded-lg px-3 py-1 text-xs text-white/90 outline-none transition"
                  />
                </div>

                {/* Tags recomendadas rápidas */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {POPULAR_INTERESTS.filter(p => !interests.includes(p)).slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddInterest(tag)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full transition cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#E94560] hover:bg-[#ff5573] disabled:bg-[#E94560]/40 text-white rounded-2xl font-bold transition-all shadow-lg shadow-[#E94560]/20 flex items-center justify-center gap-1.5 text-xs cursor-pointer mt-3"
              >
                {loading ? "Criando conexão..." : "Cadastrar meu Perfil e Entrar"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Rodapé Alternador de views */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <span className="text-white/40 text-xs">
              {isLogin ? "Não tem uma conta?" : "Já possui conta?"}
            </span>{" "}
            <button
              onClick={handleToggleMode}
              className="text-[#E94560] hover:text-[#ff5573] font-semibold text-xs transition duration-150 underline focus:outline-none cursor-pointer"
            >
              {isLogin ? "Crie uma agora" : "Faça login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
