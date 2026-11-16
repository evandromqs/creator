# 🎬 Creator — Estúdio de Vídeos Verticais Automatizados

> Pipeline profissional para criação, sincronização de áudio/SFX e renderização de vídeos curtos em alta resolução (**1080x1920**, 30fps) usando **Hyperframes + GSAP 3.15.0**.

---

## 🚀 Destaques do Projeto

- **5 Estilos de Vídeos Variados:**
  1. `quiz-mobile`: Quiz interativo com contagem regressiva 5..1, voz pausada natural e efeitos sonoros sincronizados.
  2. `kinetic-shorts`: Tipografia cinética vertical, iluminação atmosférica, shake de câmera determinístico e legendas em pílula (karaokê).
  3. `story-loop`: Narrativas envolventes com loop infinito (a última frase conecta perfeitamente ao início do vídeo).
  4. `tech-viral`: Mini-documentários explicativos com motion graphics e cards flutuantes.
  5. `commercial-ad`: Anúncios e reels comerciais de alta conversão para produtos.

- **Motores de Voz & Timestamps:**
  - **Edge TTS Gratuito (Francisca / Antonio):** Narração de alta qualidade sem custo de API, com taxa desacelerada (0.9x), pausas naturais nas alternativas (`A:`, `B:`, `C:`) e intervalos calibrados na contagem regressiva.
  - **Mixer de Efeitos Sonoros (FFmpeg):** Injeção precisa de `tick.mp3` em cada segundo da contagem regressiva e `trim_alarm.mp3` na revelação da resposta correta, mantendo a voz cristalina.
  - **ElevenLabs v3:** Suporte completo à API `/v1/text-to-speech/{voiceId}/with-timestamps` para narrações dramáticas com alinhamento palavra por palavra.

- **Gestão de Postagens & Reset:**
  - Arquivamento automático em `posts/<id>/` com manifesto `post.json`, legendas `.srt`, legenda com hashtags `caption.txt`, áudios e snapshot do código-fonte.

- **Renderização Local & Nuvem:**
  - Renderização local via GPU com `npm run render`.
  - Renderização na nuvem através do GitHub Actions (`.github/workflows/render.yml`).

---

## 📁 Estrutura de Pastas

```text
creator/
├── .github/workflows/
│   └── render.yml               # Workflow de renderização no GitHub Actions
├── assets/
│   └── sfx/                     # Efeitos sonoros e marcas (tick, trim_alarm, logo)
├── audio/                       # Áudios gerados e faixas de narração
├── lib/
│   └── kit.cjs                  # Motor reutilizável de efeitos, timeline e render HTML
├── output/                      # Vídeos finais .mp4 renderizados
├── posts/                       # Arquivo de posts finalizados prontos para agendamento
├── scripts/
│   ├── build.cjs                # Compilador principal (suporta troca de templates)
│   ├── generate_quiz_audio.cjs  # Geração da voz Francisca 0.9x + pausas + mix de SFX
│   ├── generate_audio_edgetts.cjs # Gerador Edge TTS genérico + WordBoundary
│   ├── generate_audio_elevenlabs.cjs # Gerador ElevenLabs v3 + timestamps
│   └── reset_project.cjs        # Arquivamento e limpeza do workspace
├── templates/                   # Modelos de composição
│   ├── quiz-mobile/
│   ├── kinetic-shorts/
│   ├── story-loop/
│   ├── tech-viral/
│   └── commercial-ad/
├── transcript/                  # Timestamps estruturados (.json)
├── hyperframes.json             # Configuração do compilador Hyperframes
├── meta.json                    # Metadados do projeto ativo
└── package.json
```

---

## 🛠️ Instalação e Requisitos

1. **Pré-requisitos:**
   - Node.js 18+ (Recomendado Node 20 ou 22)
   - FFmpeg instalado no sistema operacional

2. **Instalação das dependências:**
   ```bash
   npm install
   ```

3. **Configuração de Variáveis de Ambiente (Opcional):**
   Copie `.env.example` para `.env` se for utilizar a API da ElevenLabs:
   ```bash
   cp .env.example .env
   ```

---

## ⚡ Comandos Rápidos

### 1. Compilação de Templates

```bash
# Compilar template padrão (Quiz Mobile)
npm run build

# Compilar templates específicos:
npm run build:quiz        # Quiz Mobile
npm run build:kinetic     # Kinetic Typography Shorts
npm run build:story       # Story Loop Infinito
npm run build:tech        # Tech Viral Documentary
npm run build:ad          # Commercial Product Ad
```

### 2. Geração de Voz e Efeitos

```bash
# Gerar narração completa do Quiz (Francisca 0.9x + pausas + SFX tick & trim)
npm run tts:quiz

# Gerar narração Edge TTS genérica
npm run tts:edge

# Gerar narração via ElevenLabs v3 com timestamps
npm run tts:elevenlabs
```

### 3. Visualização e Renderização

```bash
# Abrir preview interativo no navegador
npm run dev

# Validar sintaxe e conformidade de regras de animação
npm run check

# Renderizar vídeo final em MP4
npm run render
```

### 4. Arquivar Post e Resetar Workspace

```bash
# Salva o vídeo e metadados em posts/ e prepara o workspace para um novo vídeo
npm run reset -- --slug=quiz-geografia-01
```

---

## ☁️ Renderização no GitHub Actions

Você pode renderizar vídeos sem consumir recursos do seu computador:

1. Acesse a aba **Actions** no repositório GitHub.
2. Selecione o workflow **Render Video**.
3. Clique em **Run workflow**, escolha o template desejado (`quiz-mobile`, `kinetic-shorts`, etc.) e dispare a execução.
4. Ao finalizar, faça o download do arquivo `.mp4` disponível na seção **Artifacts**.

---

## 📄 Licença

Distribuído sob licença ISC. Desenvolvido para automação profissional de canais dark, canais de curiosidades e marcas digitais.
