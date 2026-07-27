# Protocol de verificare locala a HTML-ului SSR (fara deploy)

Referit din criteriile de acceptare ale task-urilor ca **„protocolul SSR local"**.

## De ce exista acest document

Pipeline-ul de agenti se opreste la **branch `ticket/...` + Pull Request**. NU face deploy (vezi `AGENTS.md` din radacina workspace-ului). Deci niciun criteriu de acceptare nu are voie sa depinda de `https://hai-în-sat.ro` fiind actualizat — la momentul verificarii, productia inca ruleaza codul vechi.

Vestea buna: aplicatia randeaza SSR identic si local. Orice criteriu despre **HTML-ul brut** (meta tags, JSON-LD, numar de `<h1>`, `<a href>`, coduri de status, headere de raspuns) se verifica local, exact.

## Comenzi

Ruleaza-le din `hai-in-sat/hai-in-sat/` (radacina repo-ului frontend).

```bash
npm run build
```

Construieste AMBELE bundle-uri (`ng build && ng run hai-in-sat:server`) — `dist/hai-in-sat/browser/` si `dist/hai-in-sat/server/main.js`. Dureaza cateva minute.

```bash
npm run serve:ssr
```

Porneste serverul Express SSR pe **http://localhost:4000**. Lasa-l sa ruleze intr-un terminal separat (sau in background) cat timp faci verificarile.

## Ce verifici si cum

```bash
# HTML brut al unei rute, salvat pentru inspectie
curl -s http://localhost:4000/properties > /tmp/properties.html

# cod de status + headere de raspuns
curl -sI http://localhost:4000/some-path

# simulare host/protocol asa cum le trimite Google Frontend in productie
curl -sI -H "Host: www.xn--hai-n-sat-t5a.ro" -H "X-Forwarded-Proto: https" http://localhost:4000/properties?type=land

# dimensiunea raspunsului in bytes
curl -s -o /dev/null -w "%{size_download}\n" http://localhost:4000/

# numarul de H1 dintr-o pagina
curl -s http://localhost:4000/about-us | grep -o "<h1" | wc -l

# link-uri interne crawlabile
curl -s http://localhost:4000/properties | grep -o 'href="/[^"]*"' | sort -u

# blocurile JSON-LD
curl -s http://localhost:4000/ | grep -o '<script type="application/ld+json">.*</script>'
```

## Limite — ce NU se poate verifica local

Aceste lucruri depind de infrastructura Google App Engine sau de servicii externe si **nu au voie sa apara in criteriile de acceptare**. Locul lor e sectiunea `## Verificare post-deploy (owner)` a fiecarui task:

- **Headerele din `app.yaml`** (`http_headers` pe handlere statice) — in local, asseturile sunt servite de `express.static` din `server.ts`, nu de handlerele GAE. Corectitudinea `app.yaml` se verifica prin **lectura fisierului**, nu prin curl.
- **Redirectul GAE http→https** — TLS se termina la Google Frontend; local nu exista.
- **Orice unealta externa**: Google Rich Results Test, validator.schema.org, Facebook Sharing Debugger, securityheaders.com, PageSpeed Insights, Google Search Console, metrici GAE.
- **Lighthouse / Core Web Vitals de teren** — masuratorile de lab locale nu sunt comparabile cu baseline-ul din audit (masinile difera); orice prag numeric de performanta e post-deploy.

## Regula pentru scrierea criteriilor de acceptare

Un criteriu e bun daca un agent **read-only, fara retea si fara deploy** poate spune DA sau NU citind:

1. codul din repo (grep / lectura de fisier),
2. iesirea suitei de teste (`npx ng test --watch=false --browsers=ChromeHeadless` pentru frontend, `.\mvnw.cmd -q test` pentru backend — rulate automat de runner),
3. o iesire de comanda **pe care implementatorul a rulat-o si a lipit-o in `## Implementation Notes`** (build, protocolul SSR local de mai sus).

Daca raspunsul cere productia live, criteriul apartine sectiunii post-deploy.
