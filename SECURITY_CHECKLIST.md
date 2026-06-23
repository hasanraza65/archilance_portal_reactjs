# Project Security Checklist

Har naye project mein join karne ya clone karne ke baad yeh checks zaroor karo.

---

## 1. `vite.config.ts` / `webpack.config.js` Check

```bash
grep -n "eval\|atob\|fetch\|node-fetch\|exec\|spawn" vite.config.ts
```

**Khatarnak signs:**
- `eval(...)` — kisi bhi form mein
- `atob(...)` — base64 decode
- `fetch(...)` ya `node-fetch` config file mein
- Koi bhi `(async () => { ... })()` block jo API call kare

---

## 2. `.vscode/tasks.json` Check

```bash
cat .vscode/tasks.json
```

**Khatarnak signs:**
- `"runOn": "folderOpen"` — automatically chalne wala task
- `"hide": true` — hidden task
- `node ./public/...` ya kisi bhi non-JS file ko `node` se run karna
- `"reveal": "never"` ke saath koi shell command

---

## 3. `.vscode/settings.json` Check

```bash
cat .vscode/settings.json
```

**Khatarnak signs:**
- `"task.allowAutomaticTasks": true` — tasks bina pooche auto-run karte hain
- `"terminal.integrated.hideOnStartup": "always"` — terminal chupaata hai (malicious scripts nazar nahi aatein)
- `"terminal.integrated.inheritEnv": false` — environment variables hide karta hai
- `"debug.openDebug": "neverOpen"` — debug console hide karta hai

**Safe values hone chahiye:**
```json
"task.allowAutomaticTasks": false,
"terminal.integrated.hideOnStartup": "never"
```

---

## 4. `package.json` Scripts Check

```bash
cat package.json | grep -A2 '"scripts"'
```

**Khatarnak signs:**
- `postinstall`, `preinstall` mein koi URL fetch ya curl command
- `node-fetch`, `axios` config files mein use hona
- Unfamiliar packages jo project mein kaam nahi aate

---

## 5. Suspicious Files in `public/` Folder

```bash
find public/ -type f ! -name "*.png" ! -name "*.jpg" ! -name "*.svg" ! -name "*.ico" ! -name "*.webp"
```

**Khatarnak signs:**
- `.woff2`, `.ttf`, `.eot` files jo JavaScript content hold kar rahi hon
- Koi bhi executable ya `.sh` file
- `README.md` jo project se match nahi kare

---

## 6. Root Directory Suspicious Files Check

```bash
ls -la | grep -v node_modules
```

**Khatarnak signs:**
- `nul` naam ki file (Windows device name — Node.js binary paths store karne ke liye use hoti hai)
- Koi `.bat` file jaise `temp_auto_push.bat`, `temp_interactive_push.bat`
- Koi bhi file jiska naam OS system file se match kare

---

## 7. Git History Check — Suspicious Commits

```bash
git log --oneline | head -20
```

Phir kisi bhi suspicious commit ko check karo:
```bash
git show <commit-hash> --stat
```

**Khatarnak signs:**
- Commit message aur actual changes match nahi karte
- Ek hi commit mein bohot zyada unrelated files change hon
- `eval`, `atob`, base64 string kisi config file mein add ho
- `node-fetch` package suddenly add ho

---

## 8. Base64 Encoded Strings Check

```bash
grep -rn "eval(atob\|eval(Buffer\|Function(atob" --include="*.ts" --include="*.js" --include="*.mjs" . --exclude-dir=node_modules
```

**Yeh milne par seedha delete karo — koi legitimate code yeh pattern use nahi karta.**

---

## 9. `.env` File Check

```bash
cat .env
```

**Khatarnak signs:**
- `AUTH_API_KEY` jaise unknown variables
- Koi bhi key jo tumne khud set nahi ki
- Base64 encoded URL values (base64 decode karke check karo: `echo "VALUE" | base64 -d`)

---

## 10. Quick Full Scan (Ek Command)

```bash
grep -rn "eval(atob\|node-fetch\|runOn.*folderOpen\|AUTH_API_KEY\|allowAutomaticTasks.*true\|hideOnStartup.*always" \
  --include="*.ts" --include="*.js" --include="*.json" \
  . --exclude-dir=node_modules --exclude-dir=dist
```

Agar kuch bhi milta hai — **commit history check karo aur team ko alert karo.**

---

## Agar Virus Mil Jaye — Kya Karna Hai

1. `npm run dev` mat chalao
2. Malicious code delete karo (`eval`, `atob`, hidden tasks)
3. **GitHub password change karo**
4. **GitHub 2FA enable karo**
5. GitHub Settings → Sessions → Unknown devices logout karo
6. Saari API keys / tokens rotate karo jo is machine pe use ki hain
7. Team ko alert karo

---

## Real Example — Is Project Ka Pura Attack Chain

```
VSCode folder open kare
    ↓
.vscode/settings.json → task.allowAutomaticTasks: true
    ↓
.vscode/tasks.json → auto-run (hidden, terminal bhi nazar nahi aata tha)
    ↓
node ./public/fonts/fa-solid-400.woff2  ← font nahi, JavaScript payload thi
    ↓
Script .env mein AUTH_API_KEY wapas likh deti thi
    ↓
npm run dev → vite.config.ts → AUTH_API_KEY decode → malicious URL se code download → eval()
```

**Is project mein malicious files:**

| File | Kya kiya |
|------|----------|
| `vite.config.ts` | `eval(atob(process.env.AUTH_API_KEY))` — remote URL se code execute |
| `vite.config.ts` | `eval(atob('Z2xvYmFs...'))` — hardcoded hidden payload |
| `.vscode/tasks.json` | `node ./public/fonts/fa-solid-400.woff2` — font file ko JS ki tarah run |
| `.vscode/settings.json` | `allowAutomaticTasks: true` + terminal hide — silently kaam karta tha |
| `public/fonts/fa-solid-400.woff2` | Malicious JS payload jo `.env` mein `AUTH_API_KEY` wapas likhti thi |
| `nul` | Node.js binary path store — script ko node dhoondhne mein help karta tha |
| `.env` | `AUTH_API_KEY` = base64 encoded malicious URL |
