# 🔐 Fix Autenticazione Google OAuth

## Problema Identificato

L'autenticazione non funziona perché l'URI di callback nella Google Cloud Console non è completo.

## ✅ Soluzione

### 1. Configurare Google Cloud Console

Vai su [Google Cloud Console](https://console.cloud.google.com/apis/credentials) e:

1. Seleziona il tuo progetto
2. Vai su **"Credenziali"** → **"OAuth 2.0 Client IDs"**
3. Clicca sul tuo client OAuth
4. Nella sezione **"URI di reindirizzamento autorizzati"**, assicurati di avere:

```
https://taskflow-cosimo-spanos-projects.vercel.app/api/auth/callback/google
```

⚠️ **IMPORTANTE**: Deve finire con `/google` alla fine!

5. Se hai altri domini Vercel (preview deployments), aggiungi anche:
```
https://taskflow-*.vercel.app/api/auth/callback/google
```

6. Per sviluppo locale:
```
http://localhost:3000/api/auth/callback/google
```

7. Clicca su **"Salva"**

### 2. Configurare Variabili d'Ambiente su Vercel

Vai su [Vercel Dashboard](https://vercel.com/cosimo-spanos-projects/taskflow/settings/environment-variables) e aggiungi:

#### Variabili Richieste:

1. **NEXTAUTH_URL**
   - Valore: `https://taskflow-cosimo-spanos-projects.vercel.app`
   - Ambiente: Production, Preview, Development

2. **NEXTAUTH_SECRET**
   - Valore: Genera una stringa casuale (vedi sotto)
   - Ambiente: Production, Preview, Development

3. **GOOGLE_CLIENT_ID**
   - Valore: Il tuo Client ID da Google Cloud Console
   - Ambiente: Production, Preview, Development

4. **GOOGLE_CLIENT_SECRET**
   - Valore: Il tuo Client Secret da Google Cloud Console
   - Ambiente: Production, Preview, Development

#### Come generare NEXTAUTH_SECRET:

```bash
# Su Linux/Mac
openssl rand -base64 32

# Su Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

Oppure usa questo comando online: https://generate-secret.vercel.app/32

### 3. Verificare la Configurazione

Dopo aver configurato tutto:

1. **Riavvia il deployment su Vercel**:
   - Vai su Vercel Dashboard
   - Clicca su "Deployments"
   - Trova l'ultimo deployment
   - Clicca sui tre puntini → "Redeploy"

2. **Testa l'autenticazione**:
   - Vai su https://taskflow-cosimo-spanos-projects.vercel.app/login
   - Clicca su "Accedi con Google"
   - Dovresti essere reindirizzato a Google per l'autorizzazione
   - Dopo l'autorizzazione, dovresti essere reindirizzato all'app

### 4. Troubleshooting

Se ancora non funziona:

1. **Controlla la console del browser** (F12):
   - Cerca errori nella tab "Console"
   - Cerca errori nella tab "Network" quando clicchi su "Accedi con Google"

2. **Verifica gli URI nella Google Cloud Console**:
   - Assicurati che l'URI finisca con `/google`
   - Rimuovi eventuali URI duplicati o incompleti

3. **Verifica le variabili d'ambiente su Vercel**:
   - Assicurati che siano impostate per tutti gli ambienti (Production, Preview, Development)
   - Controlla che non ci siano spazi extra o caratteri speciali

4. **Controlla i log di Vercel**:
   - Vai su Vercel Dashboard → Deployments → Clicca sul deployment → "Functions" tab
   - Cerca errori relativi a NextAuth o OAuth

### 5. URI Corretti da Configurare

Copia e incolla questi URI esatti nella Google Cloud Console:

```
https://taskflow-cosimo-spanos-projects.vercel.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

⚠️ **NOTA**: Non aggiungere altri URI incompleti o senza `/google` alla fine!
