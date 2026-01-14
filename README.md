# TaskFlow 📋

Un task manager moderno e intuitivo con vista Lista, Calendario e Kanban. Ispirato a Trello e Todoist.

![TaskFlow Preview](preview.png)

## ✨ Funzionalità

- **3 Modalità di Visualizzazione**
  - 📝 **Lista**: Task raggruppati per data (Oggi, Domani, Questa Settimana, etc.)
  - 📅 **Calendario**: Vista mensile con indicatori dei task
  - 📊 **Kanban**: Board con colonne Backlog, Da Fare, In Corso, Completato

- **Task Importanti** ⭐
  - I task contrassegnati come "Importanti" non scompaiono mai finché non vengono completati
  - Sempre visibili in cima alle liste

- **Organizzazione**
  - 📁 Progetti con colori personalizzati
  - 🏷️ Tag per categorizzare i task
  - 📌 Subtask con promemoria indipendenti

- **Promemoria e Scadenze**
  - Data e ora di scadenza
  - Promemoria personalizzabili
  - Indicatori visivi per task in ritardo

- **Design Moderno**
  - Tema scuro con tonalità blu
  - Interfaccia responsive (mobile-friendly)
  - Animazioni fluide

## 🚀 Quick Start

### 1. Clona il repository

```bash
git clone https://github.com/tuousername/taskflow.git
cd taskflow
```

### 2. Installa le dipendenze

```bash
npm install
```

### 3. Avvia il server di sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

## 📦 Deploy su Vercel

### Metodo 1: Deploy automatico

1. Vai su [vercel.com](https://vercel.com)
2. Clicca su "Add New Project"
3. Importa il repository da GitHub
4. Vercel rileverà automaticamente Next.js
5. Clicca "Deploy"

### Metodo 2: Deploy via CLI

```bash
# Installa Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel
```

## 🔗 Integrazione Google Calendar (Opzionale)

Per sincronizzare i task con Google Calendar:

### 1. Crea un progetto Google Cloud

1. Vai su [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuovo progetto
3. Abilita l'API Google Calendar

### 2. Configura OAuth 2.0

1. Vai su "APIs & Services" > "Credentials"
2. Clicca "Create Credentials" > "OAuth client ID"
3. Seleziona "Web application"
4. Aggiungi URL autorizzati:
   - `http://localhost:3000` (sviluppo)
   - `https://tuodominio.vercel.app` (produzione)

### 3. Configura le variabili d'ambiente

Copia `.env.example` in `.env.local`:

```bash
cp .env.example .env.local
```

Modifica con le tue credenziali:

```env
GOOGLE_CLIENT_ID=tuo_client_id
GOOGLE_CLIENT_SECRET=tuo_client_secret
NEXTAUTH_SECRET=genera_una_stringa_casuale
NEXTAUTH_URL=http://localhost:3000
```

Per generare NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

### 4. Aggiungi le variabili su Vercel

1. Vai nelle impostazioni del progetto su Vercel
2. Sezione "Environment Variables"
3. Aggiungi tutte le variabili

## 🗄️ Setup Database (Vercel Postgres)

TaskFlow usa Vercel Postgres per la persistenza dei dati. Segui le istruzioni in [SETUP_DATABASE.md](./SETUP_DATABASE.md) per configurare il database.

**Quick Setup:**

1. Vai su Vercel Dashboard → Storage → Create Database → Postgres
2. Le variabili d'ambiente vengono aggiunte automaticamente
3. Dopo il deploy, chiama `/api/init-db` per inizializzare le tabelle
4. I dati vengono sincronizzati automaticamente quando fai login

**Nota:** Se il database non è configurato, l'app funziona comunque usando localStorage come fallback.

## 🛠️ Tecnologie

- **Framework**: [Next.js 14](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Date Handling**: [date-fns](https://date-fns.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Drag & Drop**: [@hello-pangea/dnd](https://github.com/hello-pangea/dnd)

## 📁 Struttura del Progetto

```
taskflow/
├── app/
│   ├── globals.css      # Stili globali
│   ├── layout.tsx       # Layout principale
│   └── page.tsx         # Homepage
├── components/
│   ├── Sidebar.tsx      # Barra laterale
│   ├── Header.tsx       # Header con ricerca
│   ├── TaskCard.tsx     # Card singolo task
│   ├── TaskModal.tsx    # Modal crea/modifica task
│   ├── ListView.tsx     # Vista lista
│   ├── CalendarView.tsx # Vista calendario
│   └── KanbanView.tsx   # Vista kanban
├── lib/
│   ├── store.ts         # Zustand store
│   └── utils.ts         # Utility functions
└── types/
    └── index.ts         # TypeScript types
```

## 🎨 Personalizzazione

### Colori

Modifica `tailwind.config.js` per cambiare la palette colori:

```js
theme: {
  extend: {
    colors: {
      navy: {
        // tuoi colori personalizzati
      }
    }
  }
}
```

### Font

Modifica `app/globals.css` per cambiare il font:

```css
@import url('https://fonts.googleapis.com/css2?family=TuoFont&display=swap');
```

## 📝 Roadmap

- [ ] Sincronizzazione Google Calendar
- [ ] Notifiche push per promemoria
- [ ] Dark/Light mode toggle
- [ ] Export task in PDF/CSV
- [ ] Collaborazione multi-utente
- [ ] App mobile nativa

## 🤝 Contribuire

1. Fork del repository
2. Crea un branch (`git checkout -b feature/NuovaFeature`)
3. Commit (`git commit -m 'Aggiunta NuovaFeature'`)
4. Push (`git push origin feature/NuovaFeature`)
5. Apri una Pull Request

## 📄 Licenza

MIT License - vedi [LICENSE](LICENSE) per dettagli.

---

Creato con ❤️ usando Claude AI
