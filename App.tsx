import React, { useState, useEffect } from 'react';
import { User, Appointment, AppointmentStatus } from './types';
import { AVAILABLE_SERVICES, INITIAL_APPOINTMENTS, MOCK_CALENDARS } from './constants';
import { AppointmentCard } from './components/AppointmentCard';
import { BookingForm } from './components/BookingForm';
import { AIAssistant } from './components/AIAssistant';
import { Button } from './components/Button';
import { CalendarDays, LogOut, Plus, Filter, X, RefreshCw, CheckCheck, AlertCircle, UserCircle, Key, Info, Copy, ShieldCheck } from 'lucide-react';
import { initGoogleServices, handleAuthClick, listUpcomingEvents, createCalendarEvent, listAllCalendars } from './services/calendarService';

const App: React.FC = () => {
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [foundAccounts, setFoundAccounts] = useState<User[]>([]); 
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [view, setView] = useState<'dashboard' | 'booking'>('dashboard');
  
  // Google Calendar Integration State
  const [isCalendarReady, setIsCalendarReady] = useState(false);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Filter States
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  // Origin for Debugging
  const [currentOrigin, setCurrentOrigin] = useState('');

  // Initialize Google API
  useEffect(() => {
    // Pegar URL segura para exibir no painel de ajuda
    if (typeof window !== 'undefined') {
        setCurrentOrigin(window.location.origin);
    }
    
    const checkGoogle = setInterval(() => {
      if (window.google && window.gapi) {
        initGoogleServices(() => setIsCalendarReady(true));
        clearInterval(checkGoogle);
      }
    }, 500);
    
    // Timeout para parar de tentar se a internet estiver lenta ou bloqueada
    setTimeout(() => clearInterval(checkGoogle), 5000);

    return () => clearInterval(checkGoogle);
  }, []);

  // Effect para buscar eventos quando o usuário for definido
  useEffect(() => {
    if (user && user.calendarId && isCalendarConnected) {
      refreshCalendarEvents(user.calendarId);
    }
  }, [user, isCalendarConnected]);

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
    clearFilters();
    // Se estiver em modo demo, reseta tudo ao sair
    if (isDemoMode) {
        setIsDemoMode(false);
        setIsCalendarConnected(false);
        setFoundAccounts([]);
    }
  };

  const handleConnectGoogle = async () => {
    setSyncError(null);
    try {
      await handleAuthClick();
      setIsCalendarConnected(true);
      setIsDemoMode(false);
      await scanCalendars();
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.result?.error?.message || error?.message || JSON.stringify(error);
      setSyncError(`Erro ao conectar com Google. Detalhes: ${errorMsg}`);
    }
  };

  const handleSimulateConnection = () => {
    setIsSyncing(true);
    setSyncError(null);
    setTimeout(() => {
        setIsCalendarConnected(true);
        setIsDemoMode(true);
        setFoundAccounts(MOCK_CALENDARS); // Usa os dados falsos do constants.ts
        setIsSyncing(false);
    }, 1500);
  };

  const scanCalendars = async () => {
    setIsSyncing(true);
    try {
      const calendars = await listAllCalendars();
      setFoundAccounts(calendars);
    } catch (error) {
      console.error("Failed to list calendars", error);
      setSyncError("Não foi possível listar as agendas reais. Tente o modo Simulação.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectAccount = (selectedUser: User) => {
    setUser(selectedUser);
  };

  const refreshCalendarEvents = async (calendarId: string) => {
    setIsSyncing(true);
    try {
      if (isDemoMode) {
          // Simula delay de rede
          setTimeout(() => {
              // Retorna eventos falsos levemente modificados para parecer que vieram daquela agenda
              const mockEvents = INITIAL_APPOINTMENTS.map(a => ({
                  ...a,
                  title: AVAILABLE_SERVICES.find(s => s.id === a.serviceId)?.name || 'Consulta', 
                  notes: `Evento simulado da agenda: ${calendarId}`
              }));
              setAppointments(mockEvents);
              setIsSyncing(false);
          }, 800);
      } else {
        const googleEvents = await listUpcomingEvents(AVAILABLE_SERVICES, calendarId);
        setAppointments(googleEvents);
        setIsSyncing(false);
      }
    } catch (error) {
      console.error("Failed to sync", error);
      setSyncError("Erro ao sincronizar eventos.");
      setIsSyncing(false);
    }
  };

  const clearFilters = () => {
    setDateFilter('');
    setStatusFilter('all');
    setServiceFilter('all');
  };

  // Booking Logic
  const handleNewBooking = async (serviceId: string, date: Date) => {
    const service = AVAILABLE_SERVICES.find(s => s.id === serviceId);
    
    let newAppointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      serviceId,
      title: service ? `Agendamento: ${service.name}` : 'Novo Agendamento',
      date: date.toISOString(),
      status: AppointmentStatus.PENDING,
      notes: 'Agendado via Web App'
    };

    if (isCalendarConnected && user?.calendarId) {
      if (service) {
        setIsSyncing(true);
        try {
          if (!isDemoMode) {
             newAppointment = await createCalendarEvent(newAppointment, service, user.calendarId);
          } else {
             // Simula criação
             await new Promise(r => setTimeout(r, 1000));
             newAppointment.status = AppointmentStatus.CONFIRMED;
             newAppointment.notes += " (Simulação)";
          }
        } catch (error) {
          console.error("Error creating event", error);
          alert("Erro ao salvar. Salvando localmente.");
        } finally {
          setIsSyncing(false);
        }
      }
    }

    setAppointments(prev => [...prev, newAppointment].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ));
    setView('dashboard');
    clearFilters(); 
  };

  // Filter Logic
  const filteredAppointments = appointments.filter(appt => {
    const matchesDate = dateFilter ? appt.date.startsWith(dateFilter) : true;
    const matchesStatus = statusFilter !== 'all' ? appt.status === statusFilter : true;
    const matchesService = serviceFilter !== 'all' ? appt.serviceId === serviceFilter : true;

    return matchesDate && matchesStatus && matchesService;
  });

  const upcomingAppointments = filteredAppointments.filter(a => {
    const apptDate = new Date(a.date);
    const now = new Date();
    return apptDate >= now || apptDate.toDateString() === now.toDateString();
  });

  const historyAppointments = filteredAppointments.filter(a => new Date(a.date) < new Date() && new Date(a.date).toDateString() !== new Date().toDateString());

  const isFiltering = dateFilter !== '' || statusFilter !== 'all' || serviceFilter !== 'all';

  // LOGIN / ACCOUNT SELECTION SCREEN
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-8">
            <div className="bg-brand-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8 text-brand-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Portal de Agendamento</h1>
            <p className="text-gray-500 mt-2">Gerencie múltiplas agendas em um só lugar</p>
          </div>
          
          <div className="space-y-6">
            {!isCalendarConnected ? (
              <div className="text-center space-y-4">
                {/* Botão Oficial Google */}
                {isCalendarReady ? (
                  <Button onClick={handleConnectGoogle} className="w-full py-3 flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Entrar com Google
                  </Button>
                ) : (
                  <div className="text-sm text-gray-400">Carregando API do Google...</div>
                )}

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">Ou teste agora</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>

                {/* Botão de Simulação (Salva Vidas) */}
                <Button onClick={handleSimulateConnection} variant="primary" fullWidth className="py-3 bg-brand-600 hover:bg-brand-700 text-white">
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    Simular Sincronização (Demo)
                </Button>
                <p className="text-xs text-gray-500 px-4">
                    Use o modo Demo se tiver problemas com a autenticação do Google neste ambiente de preview.
                </p>

                {syncError && (
                  <div className="mt-4 text-left p-3 rounded-lg bg-red-50 border border-red-100">
                      <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                          <p className="text-sm text-red-700">{syncError}</p>
                      </div>
                  </div>
                )}

                {/* Caixa de Ajuda para Configuração Real */}
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left">
                   <div className="flex items-center gap-2 mb-1">
                      <Info className="w-4 h-4 text-yellow-600" />
                      <span className="text-xs font-bold text-yellow-800">Para Login Real (Google Cloud)</span>
                   </div>
                   <p className="text-[10px] text-yellow-700 mb-2 leading-tight">
                     Se usar o botão "Google", adicione esta URL em <strong>Origens JavaScript</strong> no Console:
                   </p>
                   <div className="flex items-center justify-between bg-white border border-yellow-200 p-1.5 rounded text-xs text-gray-600 font-mono">
                     <span className="truncate">{currentOrigin}</span>
                     <button onClick={() => navigator.clipboard.writeText(currentOrigin)} className="text-yellow-600 hover:text-yellow-800 ml-2">
                       <Copy className="w-3 h-3" />
                     </button>
                   </div>
                </div>

              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Contas Encontradas ({foundAccounts.length})
                    </h3>
                    <button onClick={isDemoMode ? handleSimulateConnection : scanCalendars} className="text-brand-600 text-xs hover:underline flex items-center gap-1">
                       <RefreshCw className="w-3 h-3" /> Atualizar
                    </button>
                 </div>
                 
                 {isSyncing ? (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-500 gap-3">
                        <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
                        <span className="text-sm">Buscando agendas...</span>
                    </div>
                 ) : (
                   <div className="grid gap-3 max-h-[300px] overflow-y-auto">
                     {foundAccounts.map(account => (
                       <button
                         key={account.id}
                         onClick={() => handleSelectAccount(account)}
                         className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-brand-500 hover:bg-brand-50 transition-all bg-white group text-left w-full shadow-sm"
                       >
                         <div className="flex items-center gap-3">
                           <div className="bg-brand-100 p-2.5 rounded-full text-brand-600 group-hover:bg-brand-200 group-hover:text-brand-700 transition-colors">
                             <UserCircle className="w-6 h-6" />
                           </div>
                           <div>
                             <p className="font-semibold text-gray-900">{account.name}</p>
                             <p className="text-xs text-gray-500">
                                {isDemoMode ? 'Agenda Virtual (Demo)' : `ID: ${account.id.substring(0, 15)}...`}
                             </p>
                           </div>
                         </div>
                         <div className="text-right">
                             <div className="text-xs text-gray-400 flex items-center justify-end gap-1 mb-1">
                                <Key className="w-3 h-3" />
                                <span className="font-mono text-[10px]">{account.password}</span>
                             </div>
                             <span className="text-[10px] font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                                Acessar
                             </span>
                         </div>
                       </button>
                     ))}
                   </div>
                 )}
                 
                 {foundAccounts.length === 0 && !isSyncing && (
                   <p className="text-center text-gray-500 italic py-4">
                       Nenhuma agenda encontrada. {isDemoMode ? 'Tente novamente.' : 'Verifique se a conta Google tem agendas criadas.'}
                   </p>
                 )}

                 <Button variant="ghost" fullWidth onClick={() => { setIsCalendarConnected(false); setFoundAccounts([]); setIsDemoMode(false); }} className="mt-4">
                   Cancelar
                 </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
      
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-brand-600 p-1.5 rounded-lg">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight hidden sm:block">MinhaAgenda</span>
              <span className="font-bold text-xl text-gray-900 tracking-tight sm:hidden">Agenda</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right flex flex-col items-end">
                 <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                 <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-orange-400' : 'bg-green-500'}`}></span>
                    <p className="text-xs text-gray-500 truncate max-w-[100px] sm:max-w-[150px]">
                        {isDemoMode ? 'Modo Demo' : 'Conectado'}
                    </p>
                 </div>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full" title="Sair da Conta">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {view === 'dashboard' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Painel da Agenda</h1>
                <p className="text-gray-500">Gerenciando: <strong className="text-gray-800">{user.name}</strong></p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                 <Button 
                    variant="outline" 
                    onClick={() => refreshCalendarEvents(user.calendarId || 'primary')} 
                    disabled={isSyncing} 
                    className="bg-white"
                  >
                    {isSyncing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin text-brand-600" /> : <CheckCheck className="w-4 h-4 mr-2 text-green-600" />}
                    {isSyncing ? 'Sincronizando...' : 'Atualizar Eventos'}
                 </Button>
                
                <Button onClick={() => setView('booking')} className="shadow-md shadow-brand-200 hover:shadow-lg transition-shadow">
                  <Plus className="w-5 h-5 mr-2" />
                  Novo Agendamento
                </Button>
              </div>
            </div>

            {/* Sync Error Message */}
            {syncError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                {syncError}
              </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
                <Filter className="w-4 h-4 text-brand-500" />
                Filtrar Resultados
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Date Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Data</label>
                  <input 
                    type="date" 
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="all">Todos os status</option>
                    {Object.values(AppointmentStatus).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Service Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Serviço</label>
                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="all">Todos os serviços</option>
                    {AVAILABLE_SERVICES.map(service => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                    <option value="external">Externo / Importado</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                <div className="flex items-end">
                  <button 
                    onClick={clearFilters}
                    disabled={!isFiltering}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      isFiltering 
                        ? 'border-red-200 text-red-600 hover:bg-red-50 cursor-pointer' 
                        : 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                    }`}
                  >
                    <X className="w-4 h-4" />
                    Limpar
                  </button>
                </div>
              </div>
            </div>

            {/* Upcoming Section */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Próximos
              </h2>
              {upcomingAppointments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingAppointments.map(apt => {
                    // Create a display service object using the Title from Google if available
                    const s = AVAILABLE_SERVICES.find(srv => srv.id === apt.serviceId) || {
                        id: 'ext', 
                        name: apt.title || 'Evento Google', // Use the title captured
                        durationMinutes: 60, 
                        price: 0, 
                        description: 'Agendamento importado'
                    };
                    return <AppointmentCard key={apt.id} appointment={apt} service={s} />;
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
                  <p className="text-gray-500 mb-4">
                    {isFiltering ? 'Nenhum agendamento encontrado com os filtros atuais.' : 'Você não tem agendamentos futuros.'}
                  </p>
                  {isFiltering ? (
                    <Button variant="secondary" onClick={clearFilters}>Limpar Filtros</Button>
                  ) : (
                    <Button variant="secondary" onClick={() => setView('booking')}>Agendar Agora</Button>
                  )}
                </div>
              )}
            </section>

            {/* History Section */}
            {(historyAppointments.length > 0 || (isFiltering && historyAppointments.length === 0 && upcomingAppointments.length === 0)) ? (
              <section className="pt-4 border-t border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  Histórico
                </h2>
                {historyAppointments.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                    {historyAppointments.map(apt => {
                      const s = AVAILABLE_SERVICES.find(srv => srv.id === apt.serviceId) || {
                        id: 'ext', 
                        name: apt.title || 'Evento Passado', // Use the title captured
                        durationMinutes: 60, 
                        price: 0, 
                        description: 'Agendamento importado'
                      };
                      return <AppointmentCard key={apt.id} appointment={apt} service={s} />;
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm italic">Nenhum agendamento antigo corresponde aos filtros.</p>
                )}
              </section>
            ) : null}

          </div>
        ) : (
          /* Booking View */
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-in slide-in-from-right-8 duration-300">
            <BookingForm 
              onCancel={() => setView('dashboard')}
              onConfirm={handleNewBooking}
            />
          </div>
        )}
      </main>

      {/* AI Assistant */}
      <AIAssistant 
        user={user} 
        appointments={appointments} 
        services={AVAILABLE_SERVICES} 
      />

    </div>
  );
};

export default App;