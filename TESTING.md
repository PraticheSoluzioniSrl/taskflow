# Guida ai Test - TaskFlow

## ✅ Installazione Completata

Next.js è stato aggiornato dalla versione `14.2.5` a `^14.2.18` per risolvere la vulnerabilità di sicurezza.

## 🌐 Dove Eseguire i Test

### ⭐ **Raccomandato: Deployment su Vercel**
**URL**: https://taskflow-cosimo-spanos-projects.vercel.app/

**Perché usare Vercel:**
- ✅ Accessibile da qualsiasi dispositivo/browser senza configurazioni
- ✅ Database condiviso tra tutti i dispositivi
- ✅ OAuth Google già configurato correttamente
- ✅ Ambiente di produzione realistico
- ✅ Perfetto per testare la sincronizzazione tra dispositivi

### 💻 Test Locale (Opzionale)

**Quando usare il locale:**
- Per sviluppo e debug rapido
- Per vedere modifiche al codice immediatamente
- Per testare funzionalità prima del deploy

**Per testare in locale:**
```bash
npm run dev
# Poi apri http://localhost:3000
```

**⚠️ Nota**: Per il test locale devi avere:
- Variabili d'ambiente configurate (`.env.local`)
- Database Vercel Postgres accessibile
- Redirect URI OAuth configurato per `http://localhost:3000`

---

## 🧪 Test da Eseguire

### 1. Test Sincronizzazione tra Dispositivi

**Obiettivo**: Verificare che i task creati/modificati su un dispositivo appaiano automaticamente sugli altri dispositivi.

**Procedura**:
1. Apri https://taskflow-cosimo-spanos-projects.vercel.app/ su **Dispositivo A** (es. desktop)
2. Apri https://taskflow-cosimo-spanos-projects.vercel.app/ su **Dispositivo B** (es. smartphone o altro browser)
3. Assicurati di essere loggato con lo stesso account Google su entrambi i dispositivi
4. Su **Dispositivo A**:
   - Crea un nuovo task con titolo "Test Sincronizzazione"
   - Aggiungi una data di scadenza
   - Salva il task
5. Attendi massimo **30 secondi** (intervallo di polling)
6. Su **Dispositivo B**:
   - Verifica che il task "Test Sincronizzazione" appaia automaticamente
   - Modifica il task (es. cambia il titolo in "Test Sincronizzazione - Modificato")
7. Su **Dispositivo A**:
   - Attendi massimo 30 secondi
   - Verifica che le modifiche appaiano automaticamente

**Cosa verificare**:
- ✅ I task vengono sincronizzati tra dispositivi
- ✅ Le modifiche vengono propagate entro 30 secondi
- ✅ I task eliminati scompaiono da tutti i dispositivi
- ✅ I progetti e i tag vengono sincronizzati correttamente

**Note**: Il polling avviene ogni 30 secondi, quindi potrebbe essere necessario attendere fino a quel tempo per vedere le modifiche.

---

### 2. Test Sincronizzazione Google Calendar

**Obiettivo**: Verificare che i task con data vengano sincronizzati correttamente con Google Calendar.

**Prerequisiti**:
- Essere loggato con un account Google
- Avere i permessi per Google Calendar attivi

**Procedura**:
1. Crea un nuovo task:
   - Titolo: "Test Google Calendar"
   - Data scadenza: Scegli una data futura (es. domani)
   - Ora: Scegli un'ora (es. 14:00)
   - Descrizione: "Questo è un test di sincronizzazione"
   - Clicca su "Crea Task"
2. Verifica su Google Calendar:
   - Apri [Google Calendar](https://calendar.google.com)
   - Verifica che l'evento "Test Google Calendar" appaia nella data e ora specificate
   - Verifica che la descrizione sia presente
3. Modifica il task:
   - Modifica il titolo in "Test Google Calendar - Modificato"
   - Cambia la data o l'ora
   - Salva le modifiche
4. Verifica su Google Calendar:
   - L'evento dovrebbe essere aggiornato con le nuove informazioni
5. Elimina la data dal task:
   - Modifica il task e rimuovi la data di scadenza
   - Salva
6. Verifica su Google Calendar:
   - L'evento dovrebbe essere eliminato dal calendario

**Cosa verificare**:
- ✅ Gli eventi vengono creati su Google Calendar quando si aggiunge una data
- ✅ Gli eventi vengono aggiornati quando si modifica un task esistente
- ✅ Gli eventi vengono eliminati quando si rimuove la data
- ✅ La descrizione del task appare nella descrizione dell'evento
- ✅ L'ora viene rispettata correttamente

**Possibili problemi**:
- Se l'evento non appare, controlla la console del browser per errori
- Verifica che l'access token sia presente nella sessione
- Assicurati di aver concesso i permessi per Google Calendar durante il login

---

### 3. Test Filtro "In Ritardo"

**Obiettivo**: Verificare che il filtro mostri correttamente i task scaduti.

**Procedura**:
1. Crea alcuni task con date diverse:
   - Task 1: Data scadenza = ieri (dovrebbe essere in ritardo)
   - Task 2: Data scadenza = oggi
   - Task 3: Data scadenza = domani
   - Task 4: Nessuna data
2. Clicca sul filtro "In Ritardo" nella sidebar
3. Verifica che vengano mostrati solo i task con data scaduta (Task 1)
4. Disattiva il filtro e verifica che tutti i task siano visibili

**Cosa verificare**:
- ✅ Solo i task con data scaduta vengono mostrati
- ✅ I task completati non appaiono nel filtro "In Ritardo"
- ✅ Il contatore nella sidebar mostra il numero corretto di task in ritardo

---

### 4. Test Promemoria Subtask

**Obiettivo**: Verificare che i sottotask possano avere promemoria indipendenti.

**Procedura**:
1. Crea un nuovo task
2. Aggiungi un sottotask:
   - Titolo: "Sottotask con promemoria"
   - Imposta un promemoria (datetime-local) per domani alle 10:00
3. Salva il task
4. Verifica che il promemoria sia salvato correttamente
5. Quando arriva l'ora del promemoria, verifica che venga mostrata una notifica

**Cosa verificare**:
- ✅ I sottotask possono avere promemoria indipendenti
- ✅ Le notifiche vengono mostrate correttamente
- ✅ I promemoria dei sottotask vengono salvati nel database

---

### 5. Test Chiusura Automatica Modal

**Obiettivo**: Verificare che il modal si chiuda automaticamente dopo la creazione di un task.

**Procedura**:
1. Clicca sul pulsante "Nuovo Task"
2. Compila il form con un titolo
3. Clicca su "Crea Task"
4. Verifica che il modal si chiuda automaticamente

**Cosa verificare**:
- ✅ Il modal si chiude immediatamente dopo il salvataggio
- ✅ Il form viene resettato correttamente
- ✅ Il task appare nella lista dopo la chiusura del modal

---

## 🔍 Debug e Troubleshooting

### Problemi con la Sincronizzazione

Se i task non si sincronizzano tra dispositivi:

1. **Controlla la console del browser**:
   - Apri gli strumenti per sviluppatori (F12)
   - Vai alla tab "Console"
   - Cerca errori relativi a `/api/tasks`, `/api/projects`, `/api/tags`

2. **Verifica il polling**:
   - Il polling avviene ogni 30 secondi
   - Controlla nella console se vedi chiamate periodiche alle API

3. **Verifica l'autenticazione**:
   - Assicurati di essere loggato con lo stesso account su entrambi i dispositivi
   - Controlla che la sessione sia valida

### Problemi con Google Calendar

Se gli eventi non appaiono su Google Calendar:

1. **Controlla i permessi**:
   - Durante il login, assicurati di aver concesso i permessi per Google Calendar
   - Puoi verificare i permessi su [Google Account Settings](https://myaccount.google.com/permissions)

2. **Controlla la console**:
   - Apri la console del browser
   - Cerca errori relativi a `/api/calendar/sync`
   - Verifica che l'access token sia presente

3. **Verifica il formato della data**:
   - Le date devono essere nel formato `YYYY-MM-DD`
   - Le ore devono essere nel formato `HH:MM`

4. **Test manuale dell'API**:
   ```bash
   # Per test locale (dopo il login)
   curl -X POST http://localhost:3000/api/calendar/sync \
     -H "Content-Type: application/json" \
     -d '{"task": {"id": "test", "title": "Test", "dueDate": "2024-12-31", "dueTime": "14:00"}, "action": "sync"}'
   
   # Per test su Vercel (dopo il login)
   curl -X POST https://taskflow-cosimo-spanos-projects.vercel.app/api/calendar/sync \
     -H "Content-Type: application/json" \
     -d '{"task": {"id": "test", "title": "Test", "dueDate": "2024-12-31", "dueTime": "14:00"}, "action": "sync"}'
   ```

---

## 📝 Note Finali

- Il polling per la sincronizzazione avviene ogni **30 secondi**
- I task vengono sincronizzati immediatamente quando vengono creati/modificati localmente
- La sincronizzazione con Google Calendar avviene in modo asincrono e potrebbe richiedere alcuni secondi
- Tutti i dati vengono salvati nel database Vercel Postgres
- I dati locali vengono sostituiti completamente con quelli del database durante il polling per garantire la sincronizzazione
