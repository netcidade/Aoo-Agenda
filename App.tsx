import React, { useState, useEffect } from 'react';
import { User, Appointment, AppointmentStatus } from './types';
import { AVAILABLE_SERVICES, CLINIC_CALENDARS } from './constants';
import { AppointmentCard } from './components/AppointmentCard';
import { BookingForm } from './components/BookingForm';
import { AIAssistant } from './components/AIAssistant';
import { Button } from './components/Button';
import { CalendarDays, LogOut, Plus, Filter, X, RefreshCw, CheckCheck, AlertCircle, UserCircle, MapPin, Phone, GripVertical } from 'lucide-react';
import { initGoogleServices, listUpcomingEvents, createCalendarEvent } from './services/calendarService';

const App: React.FC = () => {
  // State management
  const [selectedCalendarUser, setSelectedCalendarUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [view, setView] = useState<'dashboard' | 'booking'>('dashboard');
  
  // Drag and Drop State
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  
  // Google Calendar Integration State
  const [isCalendarReady, setIsCalendarReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Filter States
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  // Initialize Google API (API Key Only)
  useEffect(() => {
    // Garante que o app carregue visualmente mesmo se a API falhar ou demorar
    initGoogleServices(() => setIsCalendarReady(true));
  }, []);

  // Effect para buscar eventos quando uma agenda é selecionada
  useEffect(() => {
    if (selectedCalendarUser) {
      // Se a API estiver pronta, carrega. Se não, tenta carregar (modo offline vai retornar vazio e logar erro)
      refreshCalendarEvents(selectedCalendarUser.calendarId || '');
    }
  }, [selectedCalendarUser, isCalendarReady]);

  const handleLogout = () => {
    setSelectedCalendarUser(null);
    setView('dashboard');
    clearFilters();
    setAppointments([]);
  };

  const handleSelectAccount = (account: User) => {
    setSelectedCalendarUser(account);
    setSyncError(null);
  };

  // Função auxiliar para aplicar a ordem salva
  const applySavedOrder = (events: Appointment[]): Appointment[] => {
    const savedOrderJson = localStorage.getItem('appointmentsOrder');
    if (!savedOrderJson) return events;

    try {
      const savedOrderIds: string[] = JSON.parse(savedOrderJson);
      
      // Cria um mapa para acesso rápido ao índice
      const orderMap = new Map(savedOrderIds.map((id, index) => [id, index]));

      return [...events].sort((a, b) => {
        const indexA = orderMap.get(a.id);
        const indexB = orderMap.get(b.id);

        // Se ambos têm ordem salva, usa ela
        if (indexA !== undefined && indexB !== undefined) {
          return indexA - indexB;
        }
        
        // Se apenas um tem ordem salva, prioriza ele (ou coloca no final, depende da preferencia)
        // Aqui: Itens sem ordem salva ficam no final, ordenados por data original
        if (indexA !== undefined) return -1;
        if (indexB !== undefined) return 1;

        return 0; // Mantém ordem original (que já vem por data do Google)
      });
    } catch (e) {
      console.error("Erro ao ler ordem salva", e);
      return events;
    }
  };

  const refreshCalendarEvents = async (calendarId: string) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
        const googleEvents = await listUpcomingEvents(AVAILABLE_SERVICES, calendarId);
        // Aplica a ordenação salva sobre os dados novos
        const orderedEvents = applySavedOrder(googleEvents);
        setAppointments(orderedEvents);
    } catch (error: any) {
      // Erro é logado no console pelo service
      let msg = "Erro ao carregar agenda.";
      // Tenta extrair mensagem útil
      if (error?.result?.error?.code === 404) {
          msg = "Agenda não encontrada ou privada. Verifique o ID no arquivo constants.ts.";
      } else if (error?.result?.error?.code === 403) {
          msg = "Acesso negado. A API Key pode estar incorreta ou a agenda não é pública.";
      } else if (error?.result?.error?.message) {
          msg = `Erro Google: ${error.result.error.message}`;
      }
      setSyncError(msg);
    } finally {
      setIsSyncing(false);
    }
  };

  const clearFilters = () => {
    setDateFilter('');
    setStatusFilter('all');
    setServiceFilter('all');
  };

  // Booking Logic (Simulation for Public Portal)
  const handleNewBooking = async (serviceId: string, date: Date) => {
    const service = AVAILABLE_SERVICES.find(s => s.id === serviceId);
    
    // Criação local do agendamento
    const newAppointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      serviceId,
      title: service ? `Pré-reserva: ${service.name}` : 'Novo Agendamento',
      date: date.toISOString(),
      status: AppointmentStatus.PENDING,
      notes: 'Solicitação realizada pelo portal.'
    };

    setIsSyncing(true);
    try {
        // Simula chamada (já que não temos permissão de escrita com API Key pública)
        await createCalendarEvent(newAppointment, service!, selectedCalendarUser?.calendarId || '');
        
        // Adiciona visualmente
        const updatedList = [...appointments, newAppointment];
        // Não reordenamos automaticamente por data aqui para respeitar a ordem manual se existir,
        // mas novos itens vão para o final por padrão da array
        setAppointments(updatedList);
        
        alert("✅ Solicitação de agendamento enviada!\n\nComo este é um portal público, sua solicitação foi registrada e nossa equipe entrará em contato para confirmar.");
        
        setView('dashboard');
        clearFilters();
    } catch (error) {
        alert("Erro ao processar agendamento.");
    } finally {
        setIsSyncing(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessário para permitir o drop
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedItemIndex === null || draggedItemIndex === targetIndex) return;

    // Copia a lista atual de itens VISÍVEIS (upcomingAppointments)
    // Nota: Reordenamos apenas o array visualizado e salvamos os IDs
    const updatedList = [...upcomingAppointments];
    const itemToMove = updatedList[draggedItemIndex];
    
    // Remove do index antigo
    updatedList.splice(draggedItemIndex, 1);
    // Insere no novo index
    updatedList.splice(targetIndex, 0, itemToMove);

    // Precisamos atualizar o state principal 'appointments'
    // A estratégia mais segura é criar um novo array de appointments baseado na nova ordem visual
    // E concatenar os itens que foram filtrados para fora (se houver, embora DnD esteja desabilitado com filtro)
    
    // Como desabilitamos DnD quando há filtros, updatedList contém TUDO que é relevante.
    // Mas 'upcomingAppointments' filtra passado. Precisamos cuidar para não perder histórico.
    
    // 1. Pega IDs da nova ordem
    const newOrderIds = updatedList.map(a => a.id);
    
    // 2. Salva no localStorage
    localStorage.setItem('appointmentsOrder', JSON.stringify(newOrderIds));
    
    // 3. Atualiza o estado
    // Reconstruímos o array appointments respeitando a nova ordem visual para os itens presentes
    // e mantendo os outros (histórico) onde estavam ou no final.
    const newAppointmentsState = [...appointments].sort((a, b) => {
        const indexA = newOrderIds.indexOf(a.id);
        const indexB = newOrderIds.indexOf(b.id);
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        // Se nenhum está na lista manipulada (ex: evento passado), mantém ordem original de data
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    setAppointments(newAppointmentsState);
    setDraggedItemIndex(null);
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
    // Ajuste simples para considerar eventos de hoje ainda válidos
    const todayEnd = new Date(); 
    todayEnd.setHours(23, 59, 59);
    return apptDate >= now || (apptDate.toDateString() === now.toDateString());
  });

  const isFiltering = dateFilter !== '' || statusFilter !== 'all' || serviceFilter !== 'all';

  // --- TELA DE SELEÇÃO DE PROFISSIONAL (SUBSTITUI LOGIN) ---
  if (!selectedCalendarUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white w-full max-w-2xl p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="text-center mb-10">
            <div className="bg-brand-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CalendarDays className="w-10 h-10 text-brand-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Portal do Cliente</h1>
            <p className="text-gray-500 mt-3 text-lg">Selecione o profissional ou sala para visualizar a disponibilidade</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CLINIC_CALENDARS.map(account => (
               <button
                 key={account.id}
                 onClick={() => handleSelectAccount(account)}
                 className="flex flex-col p-6 rounded-xl border border-gray-200 hover:border-brand-500 hover:bg-brand-50 hover:shadow-md transition-all bg-white group text-left"
               >
                 <div className="flex items-center gap-4 mb-3">
                   <div className="bg-gray-100 p-3 rounded-full text-gray-600 group-hover:bg-brand-200 group-hover:text-brand-700 transition-colors">
                     <UserCircle className="w-8 h-8" />
                   </div>
                   <div>
                     <p className="font-bold text-gray-900 text-lg">{account.name}</p>
                     <p className="text-xs text-brand-600 font-medium bg-brand-50 inline-block px-2 py-0.5 rounded mt-1">
                        Ver Agenda
                     </p>
                   </div>
                 </div>
                 {(account.phone || account.email) && (
                     <div className="mt-2 space-y-1 pt-3 border-t border-gray-100">
                        {account.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Phone className="w-3 h-3" /> {account.phone}
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="w-3 h-3" /> Unidade Central
                        </div>
                     </div>
                 )}
               </button>
            ))}
          </div>

          <div className="mt-8 text-center bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
             <p>Este é um portal público. Os agendamentos feitos aqui são enviados para aprovação.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
      
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={handleLogout} className="md:hidden p-2 -ml-2 text-gray-500">
                 <LogOut className="w-5 h-5" />
              </button>
              <div className="bg-brand-600 p-1.5 rounded-lg hidden md:block">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">MinhaAgenda</span>
            </div>
            
            {/* Center Info (Desktop) */}
            <div className="hidden md:flex items-center justify-center flex-1 mx-4">
                 <div className="bg-gray-100 px-4 py-1.5 rounded-full flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Visualizando: <strong>{selectedCalendarUser.name}</strong></span>
                 </div>
            </div>

            <div className="flex items-center gap-3">
               <span className={`w-2 h-2 rounded-full ${isCalendarReady ? 'bg-green-500' : 'bg-yellow-400'}`} title="Status da API"></span>
               <button 
                  onClick={handleLogout} 
                  className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
               >
                 <LogOut className="w-4 h-4" />
                 Trocar Agenda
               </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {view === 'dashboard' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* Mobile Info Header */}
            <div className="md:hidden bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3 mb-6">
                 <div className="bg-brand-100 p-2 rounded-full">
                    <UserCircle className="w-6 h-6 text-brand-600" />
                 </div>
                 <div>
                    <p className="text-xs text-gray-500">Visualizando agenda de:</p>
                    <p className="font-bold text-gray-900">{selectedCalendarUser.name}</p>
                 </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Horários Disponíveis</h1>
                <p className="text-gray-500 text-sm">
                  {isFiltering 
                    ? 'Filtros ativos. Reordenação desabilitada.' 
                    : 'Arraste os cards para reorganizar a visualização (salvo automaticamente).'}
                </p>
              </div>
              <div className="flex gap-3">
                 <Button 
                    variant="outline" 
                    onClick={() => refreshCalendarEvents(selectedCalendarUser.calendarId || '')} 
                    disabled={isSyncing} 
                    className="bg-white"
                  >
                    {isSyncing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin text-brand-600" /> : <CheckCheck className="w-4 h-4 mr-2 text-green-600" />}
                    {isSyncing ? 'Carregando...' : 'Atualizar'}
                 </Button>
                
                <Button onClick={() => setView('booking')} className="shadow-md shadow-brand-200 hover:shadow-lg transition-shadow">
                  <Plus className="w-5 h-5 mr-2" />
                  Solicitar Horário
                </Button>
              </div>
            </div>

            {/* Sync Error Message */}
            {syncError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3 text-sm animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="font-bold">Não foi possível carregar a agenda.</p>
                    <p>{syncError}</p>
                    <p className="mt-2 text-xs text-red-600 opacity-80">Dica: Verifique se a API Key é válida e se o ID da agenda está correto em 'constants.ts'.</p>
                </div>
              </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
                <Filter className="w-4 h-4 text-brand-500" />
                Filtrar Resultados
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Data</label>
                  <input 
                    type="date" 
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="all">Todos</option>
                    <option value={AppointmentStatus.CONFIRMED}>Ocupado / Confirmado</option>
                    <option value={AppointmentStatus.PENDING}>Pendente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Serviço</label>
                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="all">Todos</option>
                    {AVAILABLE_SERVICES.map(service => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                  </select>
                </div>
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
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Agenda Futura
              </h2>
              {upcomingAppointments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingAppointments.map((apt, index) => {
                    // Tenta encontrar um serviço correspondente ou cria um genérico com o título do Google
                    const s = AVAILABLE_SERVICES.find(srv => srv.id === apt.serviceId) || {
                        id: 'ext', 
                        name: apt.title || 'Evento Google', 
                        durationMinutes: 60, 
                        price: 0, 
                        description: 'Agendamento sincronizado'
                    };
                    
                    const isDraggable = !isFiltering;
                    const isDragging = draggedItemIndex === index;

                    return (
                      <div 
                        key={apt.id}
                        draggable={isDraggable}
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(index)}
                        className={`transition-all duration-200 ${
                          isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
                        } ${isDragging ? 'opacity-40 scale-95 border-2 border-brand-500 rounded-xl border-dashed' : ''}`}
                      >
                         {/* Drag Handle Overlay (Visible on Hover if Draggable) */}
                         {isDraggable && (
                           <div className="group relative h-full">
                              <AppointmentCard appointment={apt} service={s} />
                              <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 p-1 rounded-md shadow-sm pointer-events-none z-10">
                                <GripVertical className="w-4 h-4 text-gray-400" />
                              </div>
                           </div>
                         )}
                         {!isDraggable && <AppointmentCard appointment={apt} service={s} />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
                  <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4 font-medium">
                    {isFiltering ? 'Nenhum horário encontrado para este filtro.' : 'A agenda parece livre nos próximos dias.'}
                  </p>
                  {!isFiltering && (
                    <Button variant="secondary" onClick={() => setView('booking')}>Solicitar Agendamento</Button>
                  )}
                </div>
              )}
            </section>
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
        user={selectedCalendarUser} 
        appointments={appointments} 
        services={AVAILABLE_SERVICES} 
      />

    </div>
  );
};

export default App;