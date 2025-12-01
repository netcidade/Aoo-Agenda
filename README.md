# Minha Agenda - Integração Google Calendar

Este projeto é um portal de agendamento integrado com Google Calendar e IA Gemini.

## Como rodar no seu computador (VS Code)

1. Certifique-se de ter o **Node.js** instalado.
2. Abra esta pasta no VS Code.
3. Abra o terminal e rode:
   ```bash
   npm install
   ```
4. Inicie o projeto:
   ```bash
   npm run dev
   ```
5. O site abrirá em `http://localhost:5173`.

## Configuração do Google Cloud

Para o login funcionar, você precisa autorizar o endereço local:

1. Acesse o Google Cloud Console > APIs & Services > Credentials.
2. Edite seu **OAuth 2.0 Client ID**.
3. Em **Authorized JavaScript origins**, adicione:
   - `http://localhost:5173`
4. Salve e aguarde alguns minutos.
