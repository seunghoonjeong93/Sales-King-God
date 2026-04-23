import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PlusCircle, 
  ClipboardList, 
  MapPin, 
  Zap, 
  Receipt, 
  CheckCircle2, 
  User, 
  LogOut,
  ChevronRight,
  Search,
  Bell,
  Cpu,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { generateReportFromNotes } from './lib/gemini';
import type { ActionItem, Report, Customer, UserProfile } from './types';
import { format } from 'date-fns';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const GlassCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("glass-morphism rounded-3xl p-6 shadow-xl overflow-hidden relative", className)}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  disabled
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'secondary' | 'ghost' | 'neon',
  className?: string,
  disabled?: boolean
}) => {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20",
    secondary: "bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/10",
    ghost: "bg-transparent hover:bg-white/5 text-slate-400",
    neon: "bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold shadow-lg shadow-emerald-500/20"
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

// --- Main App Views ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'todo'>('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) return (
    <div className="h-screen w-screen bg-[#0f172a] flex items-center justify-center">
      <div className="bg-blobs">
        <div className="blob-1" />
        <div className="blob-2" />
        <div className="blob-3" />
      </div>
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Zap className="text-blue-400 w-12 h-12" />
      </motion.div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4">
      <div className="bg-blobs">
        <div className="blob-1" />
        <div className="blob-2" />
        <div className="blob-3" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="p-6 glass-morphism rounded-[2rem] shadow-2xl">
            <Trophy className="w-16 h-16 text-emerald-400" />
          </div>
        </div>
        <h1 className="text-7xl font-black text-white mb-4 tracking-tighter uppercase italic">
          영업킹<span className="text-blue-400">갓</span>
        </h1>
        <p className="text-slate-400 text-xl mb-12 max-w-md font-medium">
          제조 영업의 전설이 시작되는 곳.<br />
          <span className="text-slate-300">보고서는 AI가 쓰고,</span> 당신은 <span className="text-white underline decoration-blue-500 underline-offset-4 font-bold tracking-widest">계약만 하세요</span>.
        </p>
        <Button onClick={handleLogin} variant="neon" className="text-lg px-12 py-4 rounded-2xl">
          전설로 로그인하기
        </Button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 flex flex-col md:flex-row font-sans selection:bg-blue-400 selection:text-white relative overflow-hidden">
      <div className="bg-blobs" />
      
      {/* Sidebar - Desktop */}
      <nav className="hidden md:flex w-32 flex-col glass-morphism border-r-0 border-white/10 py-8 items-center gap-10 h-screen sticky top-0 z-20">
        <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-emerald-400 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20 text-white italic">
           킹
        </div>

        <div className="flex-1 flex flex-col gap-6 items-center w-full">
          <SideNavIcon 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            icon={<BarChart3 size={24} />}
            label="대시보드"
          />
          <SideNavIcon 
            active={activeTab === 'reports'} 
            onClick={() => setActiveTab('reports')}
            icon={<PlusCircle size={24} />}
            label="보고작성"
          />
          <SideNavIcon 
            active={activeTab === 'todo'} 
            onClick={() => setActiveTab('todo')}
            icon={<ClipboardList size={24} />}
            label="미션목록"
          />
        </div>

        <div className="mt-auto px-4 w-full flex flex-col items-center gap-4">
           <button onClick={handleLogout} className="w-12 h-12 glass-morphism rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
           </button>
           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">로그아웃</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-h-0 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end p-6 md:p-10 gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2 uppercase flex items-center gap-2">
              영업킹갓 <span className="text-blue-400 text-lg font-medium lowercase italic tracking-normal">v2.0 "현장의 장군"</span>
            </h1>
            <p className="text-slate-400">돌아오셨군요, <span className="text-white font-semibold">전설의 클로저</span>님. 오늘은 보고서 작업이 80% 줄어듭니다.</p>
          </div>
          <div className="flex gap-3">
            <div className="px-4 py-2 glass-morphism rounded-full text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ● 상태: 야생마처럼 달리는 중
            </div>
            <div className="px-4 py-2 glass-morphism rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
               {format(new Date(), 'yyyy년 MM월 dd일 (EEEE)')}
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-4 md:p-10 pt-0 pb-24 md:pb-10">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && <DashboardView key="dash" user={user} />}
            {activeTab === 'reports' && <ReportsView key="reports" user={user} />}
            {activeTab === 'todo' && <TodoView key="todo" user={user} />}
          </AnimatePresence>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden fixed bottom-6 left-6 right-6 glass-morphism p-4 flex justify-around items-center z-20 rounded-[2rem] shadow-2xl border-white/10">
          <MobileNavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<BarChart3 size={24} />} />
          <div className="relative -top-8">
             <button onClick={() => setActiveTab('reports')} className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 text-white rounded-2xl shadow-xl shadow-blue-500/40 flex items-center justify-center transform active:scale-90 transition-transform rotate-45">
              <PlusCircle size={32} className="-rotate-45" />
             </button>
          </div>
          <MobileNavButton active={activeTab === 'todo'} onClick={() => setActiveTab('todo')} icon={<ClipboardList size={24} />} />
        </div>
      </main>
    </div>
  );
}

function SideNavIcon({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex flex-col items-center gap-1 py-3 transition-all group relative",
        active ? "text-blue-400" : "text-white/40 hover:text-white"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
        active ? "bg-white/10 scale-110 shadow-lg shadow-blue-500/20" : "group-hover:bg-white/5"
      )}>
        {icon}
      </div>
      <span className={cn("text-[10px] font-bold tracking-tighter", active ? "opacity-100" : "opacity-40")}>{label}</span>
      {active && <div className="absolute right-0 w-1 h-8 bg-blue-500 rounded-l-full shadow-[0_0_15px_rgba(59,130,246,0.8)]" />}
    </button>
  );
}

function MobileNavButton({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-2 transition-all",
        active ? "text-blue-400 scale-125" : "text-slate-500"
      )}
    >
      <div className="scale-125">
        {icon}
      </div>
    </button>
  );
}

// --- Views Implementation ---

function DashboardView({ user }: { user: FirebaseUser }) {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const q = query(collection(db, 'actionItems'), where('authorId', '==', user.uid), where('status', '!=', 'done'), limit(5));
    const unsubscribe = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as ActionItem)));
    });

    const hours = new Date().getHours();
    if (hours < 12) setGreeting("커피 수혈 완료? 오늘 실적 찢으러 가시죠! 💪");
    else if (hours < 18) setGreeting("지금쯤이면 법인카드로 맛난 거 드시고 계시겠죠? 부럽.. 🤤");
    else setGreeting("고생하셨습니다! 이제 AI한테 가스라이팅해서 보고서 쓰게 하죠? 🍻");

    return unsubscribe;
  }, [user.uid]);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-white tracking-tighter">오늘의 무쌍</h2>
        <p className="text-gray-400 text-lg">{greeting}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-lg">긴급 숙제 (마감 임박)</h3>
             </div>
             <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full font-bold uppercase tracking-widest border border-red-500/30">긴급상황</span>
          </div>
          
          <div className="space-y-4">
            {items.length === 0 ? (
              <p className="text-slate-500 py-10 text-center italic">완벽하군요! 모든 적들을 섬멸했습니다.</p>
            ) : items.map((item) => (
              <div key={item.id} className="group flex items-center gap-4 p-4 bg-white/[0.03] rounded-2xl hover:bg-white/[0.08] transition-all border border-white/5 active:scale-[0.98]">
                <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate text-sm">{item.task}</p>
                  <p className="text-xs text-slate-500">{item.customerName} | {item.dueDate}</p>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-tighter px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-400">
                  {item.category}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-700 group-hover:translate-x-1 transition-transform" />
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-6">
          <button className="w-full text-left focus:outline-none">
            <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 shadow-2xl shadow-blue-900/40 relative overflow-hidden group cursor-pointer active:scale-95 transition-all">
               <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform">
                  <MapPin size={80} />
               </div>
               <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                    <MapPin className="text-white" />
                  </div>
                  <h2 className="text-2xl font-black italic tracking-tighter text-white mb-1">지금 바로 체크인</h2>
                  <p className="text-sm text-white/70">현장에 도착했다는 움직일 수 없는 증거.</p>
               </div>
            </section>
          </button>

          <GlassCard className="p-0 overflow-hidden border-none shadow-none">
             <div className="p-6 space-y-4">
                <h3 className="font-bold text-xs text-slate-500 uppercase tracking-widest">활동 지표</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">승률</p>
                      <p className="text-2xl font-black text-white italic">85%</p>
                   </div>
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1">스피릿</p>
                      <p className="text-2xl font-black text-white italic">S+</p>
                   </div>
                </div>
             </div>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
}

function QuickActionButton({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) {
  return (
    <button className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all hover:scale-105">
      <span className={color}>{icon}</span>
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}

function ReportsView({ user }: { user: FirebaseUser }) {
  const [isRecording, setIsRecording] = useState(false);
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");

  useEffect(() => {
    const q = query(collection(db, 'customers'), limit(10));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
      setCustomers(data);
      
      // Auto-seed if empty
      if (snap.empty && user) {
        const seedData = [
          { name: "(주)우주정복공업", industry: "정밀기계", location: "화성" },
          { name: "핵꿀맛케미칼", industry: "석유화학", location: "울산" },
          { name: "번개파워크레인", industry: "중장비", location: "평택" }
        ];
        seedData.forEach(c => addDoc(collection(db, 'customers'), c));
      }
    });
    return unsubscribe;
  }, [user.uid]);

  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) return;
    try {
      const docRef = await addDoc(collection(db, 'customers'), { 
        name: newCustomerName.trim(), 
        authorId: user.uid,
        createdAt: serverTimestamp() 
      });
      setSelectedCustomer(docRef.id);
      setNewCustomerName("");
      setIsAddingCustomer(false);
    } catch (e) {
      console.error(e);
    }
  };

  const [isManualMode, setIsManualMode] = useState(false);
  const [manualSummary, setManualSummary] = useState("");

  const handleSmartRecord = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Simulate voice
    } else {
      // Stop and set mock text if notes empty
      if (!notes) setNotes("오늘 (주)우주정복공업 김부장님 만나서 도면 수정 건 협의함. 5월 28일까지 견적서랑 같이 보내줘야 함. 사양은 기존 B-Type에서 C-Type으로 변경 요청하심.");
    }
  };

  const handleGenerate = async () => {
    if (!notes) return;
    setIsGenerating(true);
    try {
      const result = await generateReportFromNotes(notes);
      setPreview(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!preview || !user) return;
    try {
      const customer = customers.find(c => c.id === selectedCustomer);
      const customerName = customer ? customer.name : '미지정';
      
      const reportRef = await addDoc(collection(db, 'reports'), {
        customerId: selectedCustomer,
        customerName: customerName,
        date: new Date().toISOString(),
        summary: preview.summary,
        authorId: user.uid,
        authorName: user.displayName || '영업킹',
        createdAt: serverTimestamp()
      });

      // Save action items
      for (const item of preview.actionItems) {
        await addDoc(collection(db, 'actionItems'), {
          reportId: reportRef.id,
          customerId: selectedCustomer,
          customerName: customerName,
          task: item.task,
          assignee: item.assignee,
          dueDate: item.dueDate || format(new Date(), 'yyyy-MM-dd'),
          status: 'todo',
          category: item.category,
          authorId: user.uid,
          createdAt: serverTimestamp()
        });
      }

      alert("보고서가 은하계 최고급으로 업로드되었습니다! 🚀");
      setPreview(null);
      setNotes("");
      setManualSummary("");
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase">예술적인 보고</h2>
        <div className="flex flex-col md:flex-row gap-3">
            {isAddingCustomer ? (
              <div className="flex glass-morphism rounded-xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                <input 
                  autoFocus
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="새 고객사 이름"
                  className="bg-transparent px-4 py-2 text-xs font-bold text-white outline-none w-40 placeholder:text-slate-600"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCustomer();
                    if (e.key === 'Escape') setIsAddingCustomer(false);
                  }}
                />
                <button 
                  onClick={handleAddCustomer}
                  className="bg-blue-600 px-4 text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-colors"
                >
                  추가
                </button>
                <button 
                  onClick={() => setIsAddingCustomer(false)}
                  className="bg-white/10 px-4 text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-colors"
                >
                  취소
                </button>
              </div>
            ) : (
              <select 
                value={selectedCustomer}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    setIsAddingCustomer(true);
                  } else {
                    setSelectedCustomer(e.target.value);
                  }
                }}
                className="glass-morphism rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value="">고객사 선택</option>
                {customers.map(c => <option key={c.id} value={c.id} className="bg-[#0f172a]">{c.name}</option>)}
                <option value="new" className="bg-[#0f172a] font-bold text-blue-400">+ 정복 대상 추가</option>
              </select>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex gap-2 glass-morphism p-1 rounded-2xl w-fit">
            <button 
              onClick={() => setIsManualMode(false)}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all",
                !isManualMode ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
              )}
            >
              AI 자동 생성
            </button>
            <button 
              onClick={() => setIsManualMode(true)}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all",
                isManualMode ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
              )}
            >
              수기 작성
            </button>
          </div>

          <GlassCard className="relative overflow-hidden group border-blue-500/20 border-t-2">
            {!isManualMode ? (
              <>
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
                      AI 도청 장치 (현장 기록)
                   </h3>
                   <span className="text-[10px] text-slate-600 font-mono italic">동기화_활성_v2.0</span>
                </div>
                
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="전장의 상황을 설명하세요... AI가 고객의 불평불만을 우아한 비즈니스 언어로 번역해 드립니다."
                  className="w-full h-64 bg-white/[0.02] rounded-2xl p-4 text-slate-200 text-sm border border-white/5 focus:border-blue-500/30 focus:outline-none resize-none transition-all placeholder:text-slate-600"
                />

                <div className="mt-4 flex gap-3">
                   <Button 
                    variant={isRecording ? 'neon' : 'secondary'} 
                    onClick={handleSmartRecord}
                    className="flex-1 py-4 text-xs font-black uppercase tracking-tighter"
                   >
                     {isRecording ? "도청 중단" : "음성 스캐너 가동"}
                   </Button>
                   <Button 
                    variant="primary" 
                    onClick={handleGenerate} 
                    disabled={isGenerating || !notes} 
                    className="flex-1 py-4 text-xs font-black uppercase tracking-tighter"
                   >
                     {isGenerating ? "데이터 연산 중..." : "AI 마법 시전"}
                   </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                      수기 보고서 작성
                   </h3>
                   <span className="text-[10px] text-slate-600 font-mono italic">수동_작성_모드</span>
                </div>
                
                <div className="space-y-4">
                  <textarea
                    value={manualSummary}
                    onChange={(e) => setManualSummary(e.target.value)}
                    placeholder="보고서 내용을 직접 입력하세요. (결재권자가 전율할만한 내용으로...)"
                    className="w-full h-80 bg-white/[0.02] rounded-2xl p-4 text-slate-200 text-sm border border-white/5 focus:border-emerald-500/30 focus:outline-none resize-none transition-all placeholder:text-slate-600"
                  />
                  
                  <Button 
                    variant="neon" 
                    onClick={() => {
                      if (!manualSummary) return;
                      setPreview({ summary: manualSummary, actionItems: [] });
                    }}
                    className="w-full py-4 text-xs font-black uppercase tracking-tighter"
                  >
                    내용 확정하기
                  </Button>
                </div>
              </>
            )}
          </GlassCard>

          <GlassCard className="border-emerald-500/20 border-b-2">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Receipt className="text-emerald-400 w-4 h-4" />
                빛의 속도로 환급받기 (영수증 OCR)
             </h3>
             <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-emerald-400/30 hover:bg-white/[0.02] transition-all cursor-pointer group">
                <div className="w-12 h-12 glass-morphism rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PlusCircle className="text-slate-600" />
                </div>
                <p className="text-xs text-slate-500 font-black uppercase tracking-widest">영수증 캡처</p>
                <p className="text-[10px] text-slate-600 tracking-tighter italic">"택시비, 회식비, 접대비... 뭐든 던져만 주세요."</p>
             </div>
          </GlassCard>
        </div>

        <div>
          <AnimatePresence mode="wait">
            {!preview ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6 glass-morphism rounded-[2.5rem]"
              >
                <div className="w-20 h-20 glass-morphism rounded-full flex items-center justify-center">
                  <Cpu className="w-10 h-10 text-slate-700" />
                </div>
                <div>
                  <h4 className="font-black italic text-slate-500 uppercase tracking-widest mb-1">보고서 대기 중</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">왼쪽에서 AI 마법을 부려보세요.<br />전율이 돋는 예술작품이 이곳에 나타납니다.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden backdrop-blur-xl">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Zap size={140} />
                  </div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black italic text-3xl text-white uppercase tracking-tighter">예술 작품 탄생</h3>
                    <span className="text-[10px] px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full font-bold border border-blue-500/30 tracking-[0.2em]">검증 완료</span>
                  </div>
                  <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {preview.summary}
                  </div>
                </div>

                <div className="space-y-4">
                   <h4 className="flex items-center gap-2 font-black text-[10px] text-slate-500 px-2 uppercase tracking-[0.3em]">
                     <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                     추출된 투두 리스트
                   </h4>
                   {preview.actionItems.map((item: any, i: number) => (
                     <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={i} 
                      className="glass-morphism rounded-2xl p-4 flex gap-4 hover:bg-white/[0.08] transition-all cursor-default"
                     >
                        <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-xs italic">{i+1}</div>
                        <div className="flex-1">
                           <p className="font-bold text-sm text-white mb-1">{item.task}</p>
                           <div className="flex gap-4">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                <User size={10} className="text-blue-500" /> {item.assignee}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                <Bell size={10} className="text-pink-500" /> {item.dueDate || '미정'}
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 ml-auto">
                                {item.category}
                              </span>
                           </div>
                        </div>
                     </motion.div>
                   ))}
                </div>

                <Button onClick={handleSave} variant="neon" className="w-full py-5 text-lg rounded-[1.5rem] tracking-widest">
                  결재권자에게 하사하기
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function TodoView({ user }: { user: FirebaseUser }) {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');

  useEffect(() => {
    let q = query(collection(db, 'actionItems'), where('authorId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as ActionItem)));
    });
    return unsubscribe;
  }, [user.uid]);

  const toggleStatus = async (item: ActionItem) => {
    const newStatus = item.status === 'done' ? 'todo' : 'done';
    try {
      await updateDoc(doc(db, 'actionItems', item.id), { status: newStatus });
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = items.filter(i => {
    if (filter === 'all') return true;
    return i.status === filter;
  });

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase">미션 아카이브</h2>
        <div className="flex glass-morphism p-1 rounded-xl">
           {(['all', 'todo', 'done'] as const).map(f => (
             <button 
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                filter === f ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
              )}
             >
               {f === 'all' ? '전체' : f === 'todo' ? '진행중' : '정복완료'}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 overflow-hidden">
        {filtered.map((item) => (
          <GlassCard key={item.id} className={cn("flex flex-col md:flex-row md:items-center gap-6 transition-all border-l-4 group", item.status === 'done' ? "border-l-slate-700 opacity-50" : "border-l-blue-500")}>
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-3 mb-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-white/5 rounded text-slate-400 border border-white/5">
                    {item.category}
                  </span>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{item.customerName}</span>
               </div>
               <p className={cn("font-black text-xl md:text-2xl tracking-tighter", item.status === 'done' && "line-through text-slate-500")}>
                 {item.task}
               </p>
               <div className="mt-4 flex items-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  <span className="flex items-center gap-2"><User size={12} className="text-blue-500" /> {item.assignee}</span>
                  <span className="flex items-center gap-2"><Bell size={12} className="text-pink-500" /> {item.dueDate}</span>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <Button 
                variant={item.status === 'done' ? 'secondary' : 'neon'} 
                onClick={() => toggleStatus(item)}
                className="flex-1 md:flex-none py-3 px-6 rounded-2xl text-[10px] uppercase tracking-[0.2em]"
               >
                 {item.status === 'done' ? '부활시키기' : '정복완료'}
               </Button>
               <button 
                onClick={async () => await deleteDoc(doc(db, 'actionItems', item.id))} 
                className="p-3 glass-morphism rounded-xl text-slate-700 hover:text-red-500 transition-all hover:scale-110"
               >
                 <LogOut className="rotate-90 w-4 h-4" />
               </button>
            </div>
          </GlassCard>
        ))}
        {filtered.length === 0 && (
          <div className="py-20 text-center glass-morphism rounded-[2.5rem] border-dashed border-2 border-white/5">
             <p className="text-slate-600 italic font-medium">정복할 미션이 없습니다. 새로운 타겟을 찾아보세요!</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
