# semfio — Guia Completo

## Índice
1. [Como instalar e rodar](#1-como-instalar-e-rodar)
2. [Como fazer o deploy na nuvem](#2-como-fazer-o-deploy-na-nuvem)
3. [Resposta: um app pode funcionar assim?](#3-resposta-um-app-pode-funcionar-assim)
4. [Limitações e próximos passos](#4-limitações-e-próximos-passos)

---

## 1. Como instalar e rodar

### Pré-requisito
Ter o **Node.js** instalado no computador.
Baixe em: https://nodejs.org (versão LTS recomendada)

### Passo a passo local (mesma rede Wi-Fi)

```bash
# 1. Descompacte a pasta semfio
# 2. Abra o terminal dentro dela e execute:

npm install       # instala a dependência (ws)
node server.js    # inicia o servidor
```

O terminal vai mostrar:
```
📂 Banco carregado: /seu/caminho/data.json
✅ semfio rodando em http://localhost:3000
```

**Acessando de outros dispositivos na mesma rede Wi-Fi:**

- No PC onde o servidor está rodando: `http://localhost:3000`
- No celular ou outro PC (mesma rede): `http://[IP-DO-PC]:3000`

Para descobrir o IP do PC:
| Sistema | Comando |
|---------|---------|
| Windows | `ipconfig` (procure "Endereço IPv4") |
| Mac | `ifconfig` ou Preferências → Rede |
| Linux | `ip addr` ou `hostname -I` |

Exemplo: se o IP do PC for `192.168.1.100`, acesse no celular:
`http://192.168.1.100:3000`

---

## 2. Como fazer o deploy na nuvem

O deploy na nuvem permite acesso de **qualquer lugar**, sem precisar estar na mesma rede.

### Opção recomendada: Railway (gratuito)

1. Crie uma conta em https://railway.app

2. Crie um repositório no GitHub com os arquivos:
   - `server.js`
   - `index.html`
   - `package.json`
   - `.gitignore`

3. No Railway: **New Project → Deploy from GitHub Repo** → selecione o repositório `semfio-`

4. Aguarde o deploy (~1 minuto). Acesse **Settings → Networking → Generate Domain**.

5. Você recebe uma URL do tipo:
   `https://semfio-producao.up.railway.app`

6. Abra essa URL **no PC e no celular** — eles exibem e editam os mesmos dados.

> **Persistência no Railway:** adicione um **Volume** em Settings e altere no `server.js` (ou use a variável de ambiente `DB_PATH` nas configurações do Railway):
> ```
> DB_PATH = /data/data.json
> ```
> Isso garante que os dados sobrevivam a redeploys.

### Alternativa: Render (também gratuito)

1. Conta em https://render.com
2. New → Web Service → conecte o repositório GitHub
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Acesse a URL gerada

---

## 3. Resposta: um app pode funcionar assim?

### Sim — e é exatamente o que o semfio faz.

O que você está descrevendo é chamado de **aplicação web sincronizada em tempo real**. Funciona assim:

```
  [PC Sede]          [Servidor na nuvem]       [Celular]
     |                      |                     |
     |--- digita texto ----> |                     |
     |                      |--- envia para -----> |
     |                      |                     | (aparece na tela)
     |                      |                     |
     |                      | <-- edita campo ---- |
     | <-- recebe update -- |                     |
  (campo atualiza)          |                     |
```

### O que garante que todos veem a mesma informação

**WebSocket:** ao contrário de uma página web comum (que você carrega e fica estática), o WebSocket mantém uma **conexão aberta e contínua** entre cada dispositivo e o servidor. Quando qualquer pessoa digita algo, o servidor recebe e distribui para todos os outros em milissegundos.

**Estado centralizado no servidor:** o servidor é a "fonte da verdade". Quando um novo dispositivo abre o app, ele recebe imediatamente o estado atual completo — mesmo que já tenha sido editado por outros dispositivos antes.

**Persistência em disco:** o `data.json` salva tudo automaticamente. Se o servidor reiniciar, os dados voltam exatamente como estavam.

### Comparação com apps conhecidos

| App | Tecnologia | Similaridade com semfio |
|-----|-----------|--------------------------|
| Google Docs | WebSocket + banco de dados | Muito similar |
| WhatsApp Web | WebSocket | Similar (mensagens em tempo real) |
| Notion | WebSocket + banco de dados | Similar |
| **semfio** | WebSocket + JSON file | Versão simplificada dos acima |

### Dispositivos suportados

Qualquer dispositivo com navegador moderno funciona:
- Computador (Windows, Mac, Linux)
- Celular Android ou iPhone
- Tablet
- Qualquer quantidade simultânea de dispositivos

### O que significa "mesmo aplicativo" nesse contexto

O semfio **não é um app nativo** (não precisa instalar pela App Store ou Play Store). É uma **página web** que se comporta como um app:

- Abre no navegador do celular como qualquer site
- Pode ser "instalado" na tela inicial do celular via **"Adicionar à tela inicial"** (no Chrome/Safari)
- Funciona como app após isso — ícone próprio, abre sem barra de endereço
- Todos os dispositivos acessam a mesma URL e veem os mesmos dados

---

## 4. Limitações e próximos passos

### Limitações atuais

| Limitação | Impacto | Solução |
|-----------|---------|---------|
| Sem histórico de versões | Não é possível "desfazer" edições de outros | Adicionar log de alterações |
| Arquivos em memória (~10 MB cada) | Arquivos grandes podem sobrecarregar | Usar armazenamento externo (AWS S3, etc.) |
| Um prontuário por vez | Não gerencia múltiplos pacientes | Adicionar sistema de múltiplos registros |

### O que pode ser adicionado

- **Múltiplos prontuários** — lista de pacientes com busca
- **Histórico de edições** — quem editou o quê e quando
- **Impressão formatada** — layout profissional para imprimir o prontuário
- **Notificações** — avisar no celular quando algo for editado no PC

---

*semfio — Documentação gerada em junho de 2026*
