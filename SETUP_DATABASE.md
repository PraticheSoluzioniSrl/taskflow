# Setup Database Vercel Postgres

## Passo 1: Crea il Database su Vercel

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto **taskflow-livid-five**
3. Vai su **Storage** → **Create Database** → **Postgres**
4. Scegli un nome per il database (es: `taskflow-db`)
5. Seleziona la regione più vicina (es: `Europe (Frankfurt)`)
6. Clicca **Create**

## Passo 2: Configura le Variabili d'Ambiente

Dopo aver creato il database, Vercel aggiungerà automaticamente queste variabili d'ambiente:

- `POSTGRES_URL` - Connection string principale
- `POSTGRES_PRISMA_URL` - Connection string per Prisma (se usato)
- `POSTGRES_URL_NON_POOLING` - Connection string senza pooling

**Verifica che siano presenti:**
1. Vai su **Settings** → **Environment Variables**
2. Controlla che le variabili sopra siano presenti
3. Se mancano, aggiungile manualmente dal tab **Storage** → **.env.local**

## Passo 3: Inizializza il Database

Dopo aver deployato l'app con le variabili d'ambiente:

1. Vai su `https://taskflow-livid-five.vercel.app/api/init-db`
2. Oppure usa curl:
   ```bash
   curl -X POST https://taskflow-livid-five.vercel.app/api/init-db
   ```
3. Dovresti ricevere: `{"success":true,"message":"Database initialized"}`

## Passo 4: Verifica

Controlla che le tabelle siano state create correttamente:

1. Vai su Vercel Dashboard → Storage → Il tuo database
2. Clicca su **Data** o **Query**
3. Esegui: `SELECT * FROM users;`
4. Dovresti vedere una tabella vuota (o con i tuoi dati se hai già fatto login)

## Troubleshooting

### Errore: "relation does not exist"
- Le tabelle non sono state create ancora
- Chiama `/api/init-db` di nuovo

### Errore: "connection refused"
- Verifica che le variabili d'ambiente siano configurate correttamente
- Controlla che il database sia attivo su Vercel Dashboard

### Errore: "Unauthorized"
- Devi essere loggato per chiamare `/api/init-db`
- Fai login prima di inizializzare il database

## Note

- Il database viene inizializzato automaticamente quando un utente fa login per la prima volta
- Le tabelle vengono create solo se non esistono già (`CREATE TABLE IF NOT EXISTS`)
- Puoi chiamare `/api/init-db` più volte senza problemi
