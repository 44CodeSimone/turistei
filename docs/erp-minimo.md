# ERP Mínimo  Turistei (Big Tech Real)

Este documento define o ERP mínimo integrado ao Turistei, focado em:
- financeiro real
- rastreabilidade
- conciliação
- repasses por prestador
- auditoria completa

Sem engessamento.
Sem duplicar sistemas.
Sem quebrar o core.

---

## Objetivo do ERP no Turistei

O ERP do Turistei não é um ERP genérico.

Ele existe para:
- explicar de onde veio cada valor
- para onde ele vai
- quando deve ser repassado
- quem é o responsável financeiro

Tudo derivado do pedido.

---

## Conceitos Fundamentais

### Venda (Pedido)
Representa o que o cliente comprou.

- PedidoID
- Cliente
- Itens
- Prestadores envolvidos
- Valor bruto
- Comissão da plataforma
- Valor líquido por prestador

Uma venda pode gerar uma ou mais transações financeiras.

---

### Transação Financeira
Representa o que aconteceu no pagamento.

Campos mínimos:
- TransacaoID
- PedidoID (ou VendaID)
- ReferenciaExterna (gateway / operadora)
- OperadoraID
- MeioPagamento (PIX, CARTAO, BOLETO)
- Status (PENDING, PAID, FAILED, REFUNDED, CHARGEBACK)
- DataHora
- ValorBruto
- TaxaOperadora
- ValorLiquido
- Moeda (ex: BRL)
- Logs (auditoria)

---

### Operadora
Define quem processou o pagamento.

- OperadoraID
- Nome
- Tipo (PIX, Cartão, Boleto, Gateway)
- Configuração técnica (futura)

---

## Contas a Receber (Visão Financeira)

Contas a Receber não é apenas uma tabela, é uma visão financeira.

Ela responde:
- Quanto entrou?
- Quanto é da plataforma?
- Quanto pertence a cada prestador?
- Quando deve ser repassado?

Campos derivados:
- PedidoID
- PrestadorID
- Competência (mês/ano)
- ValorBruto
- ComissãoPlataforma
- ValorLiquidoPrestador
- StatusRepasse (PENDING, SCHEDULED, PAID)

---

## Relação com o Marketplace

Regra imutável do Turistei:
- O dinheiro pertence ao prestador por item
- A plataforma retém apenas a comissão
- O ERP nunca mistura caixa de prestadores

Esse modelo suporta:
- split financeiro
- repasses separados
- auditoria por pedido e por item

---

## Auditoria e Logs

Todo evento financeiro gera log:
- criação
- pagamento
- cancelamento
- estorno
- chargeback
- ajuste administrativo

Nenhum valor é apagado.
Tudo é rastreável.

---

## Evolução Futura (sem obrigatoriedade)

Este ERP mínimo permite evoluir para:
- split automático com gateways
- relatórios fiscais
- exportação contábil
- integração com ERP externo
- conciliação automática

Sem refatorar o core.

---

## Status

Compatível com o core atual do Turistei
Alinhado ao modelo Big Tech
Seguro
Auditável
Evolutivo

Este documento é contrato técnico, não implementação imediata.
