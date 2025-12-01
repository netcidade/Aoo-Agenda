import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Appointment, Service, User } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAIResponse = async (
  userMessage: string,
  user: User,
  appointments: Appointment[],
  services: Service[]
): Promise<string> => {
  // Prepare context data
  const contextData = {
    user: user.name,
    currentDate: new Date().toLocaleString('pt-BR'),
    appointments: appointments.map(a => {
      const service = services.find(s => s.id === a.serviceId);
      return {
        date: new Date(a.date).toLocaleString('pt-BR'),
        service: service?.name || 'Serviço desconhecido',
        status: a.status
      };
    }),
    servicesAvailable: services.map(s => `${s.name} (R$ ${s.price}, ${s.durationMinutes} min)`)
  };

  const systemInstruction = `
    Você é o assistente virtual inteligente do app "MinhaAgenda".
    Seu objetivo é ajudar o cliente (${contextData.user}) com sua agenda.
    
    Dados atuais:
    - Data/Hora atual: ${contextData.currentDate}
    - Agendamentos do cliente: ${JSON.stringify(contextData.appointments)}
    - Serviços disponíveis para contratar: ${JSON.stringify(contextData.servicesAvailable)}

    Diretrizes:
    1. Responda de forma curta, educada e prestativa em Português do Brasil.
    2. Se o cliente perguntar sobre horários futuros, analise os agendamentos dele.
    3. Se o cliente quiser marcar algo, explique quais serviços existem, mas diga que ele deve usar o botão "Novo Agendamento" na tela principal para efetivar (você não pode gravar no banco de dados ainda).
    4. Se o cliente perguntar preços, consulte a lista de serviços.
    5. Mantenha um tom profissional e acolhedor.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "Desculpe, não consegui processar sua resposta agora.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Desculpe, estou com dificuldades técnicas no momento. Tente novamente mais tarde.";
  }
};