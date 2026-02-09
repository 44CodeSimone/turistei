# Turistei API

API backend do projeto **Turistei**, um marketplace de turismo multi-fornecedor,
desenvolvido com foco em arquitetura limpa, segurança e regras de negócio reais.

---

## 📌 Status do Projeto

✅ API estável  
✅ Ciclo de vida de pedidos completo  
✅ Controle de ownership (usuário x admin)  
✅ Testes automatizados passando  
✅ Persistência desacoplada (file repository)  

---

## 🏗️ Arquitetura

Arquitetura em camadas, seguindo padrão enterprise:

```
routes → controllers → services → repositories → storage
```

Regras:
- nenhuma lógica fora da camada correta
- services não conhecem HTTP
- repositories isolam persistência
- fácil troca futura para banco real (ex: Supabase)

---

## 🔐 Autenticação

- JWT (JSON Web Token)
- Middleware `requireAuth`
- Perfis suportados:
  - admin
  - user comum

---

## 📦 Funcionalidades Implementadas

### Pedidos (Orders)
- Criar pedido
- Listar pedidos
- Buscar pedido por ID
- Ciclo de vida completo:
  - CREATED
  - PAID
  - CONFIRMED
  - COMPLETED
  - CANCELLED
- Validação de transições inválidas (HTTP 409)

### Ownership
- Usuário vê apenas seus pedidos
- Admin vê todos os pedidos

---

## 🧪 Testes Automatizados

Executar todos os testes:

```bash
npm run test:all
```

Testes incluídos:
- API básica
- Ownership
- Lifecycle de pedidos
- Transições inválidas

---

## ▶️ Executar o Projeto

### Instalar dependências
```bash
npm install
```

### Rodar API
```bash
npm start
```

API disponível em:
```
http://localhost:3000
```

---

## 🗂️ Observações

- Persistência atual em `pedido.json`
- Estrutura preparada para evolução futura
- Projeto em fase de backend consolidado
