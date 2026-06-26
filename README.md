# semfio — Sincronização Permanente

Editor colaborativo em tempo real com **dados salvos permanentemente** no servidor.

---

## O que há de novo na v2

- ✅ **Persistência** — dados salvos em `data.json`; sobrevivem a reinicializações do servidor
- ✅ **Mobile-first** — layout otimizado para celular, tablet e PC
- ✅ **Toast / feedback visual** — destaque azul em campos editados remotamente
- ✅ **Upload seguro** — limite de 10 MB por arquivo, máximo de 50 arquivos

---

## Como fazer o deploy (Railway — recomendado)

### Passo a passo:

1. Crie uma conta grátis em **https://railway.app**

2. Crie um repositório no GitHub com estes 3 arquivos:
   - `server.js`
   - `index.html`
   - `package.json`

3. No Railway: **New Project → Deploy from GitHub Repo** → selecione o repositório

4. Railway detecta Node.js automaticamente. O deploy acontece em ≈ 1 minuto.

5. Clique em **Settings → Networking → Generate Domain** para obter sua URL pública.

6. Abra a URL no PC e no celular — tudo sincroniza.

> ⚠️ **Nota sobre persistência no Railway:** o plano gratuito usa um volume efêmero. Para persistência real, adicione um **Volume** nas configurações do projeto e ajuste `DB_PATH` para apontar para o volume (ex: `/data/data.json`).

---

## Como rodar localmente (rede Wi-Fi)

```bash
# Instalar dependências (só uma vez)
npm install

# Rodar
node server.js
```

- PC: http://localhost:3000
- Celular (mesma rede): http://[IP do PC]:3000

Para descobrir o IP local:
- **Windows:** `ipconfig` no terminal (procure IPv4)
- **Mac/Linux:** `ifconfig` ou `ip addr`

---

## Estrutura dos dados

O arquivo `data.json` é criado automaticamente na primeira execução:

```json
{
  "freeText": "...",
  "form": {
    "paciente": "...",
    "nascimento": "...",
    ...
  },
  "files": [
    { "id": 123, "name": "exame.pdf", "dataUrl": "...", ... }
  ]
}
```

Fazer backup deste arquivo = backup de tudo.

---

## Tecnologias

- **Node.js** + **ws** — servidor WebSocket leve
- **JSON file** — banco de dados simples, zero dependências externas
- **Vanilla HTML/CSS/JS** — roda em qualquer navegador moderno
