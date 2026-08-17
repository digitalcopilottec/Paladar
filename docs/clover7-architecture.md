# Clover7 (CLV7) - Arquitetura Inicial

Este documento define a base modular da Clover7 dentro do ecossistema RIDE7. A primeira versao funciona como demonstracao de carteira interna/off-chain, preparada para futuras integracoes com parceiros financeiros, Pix autorizado e blockchain.

## Principios

- CLV7 nao deve ser apresentado como investimento.
- Nao prometer valorizacao, rendimento, retorno financeiro ou blockchain propria enquanto isso nao existir.
- Compra, venda, conversao, custodia, transferencia publica e Pix dependem de validacao juridica/regulatoria e provedor autorizado.
- Toda movimentacao de saldo deve nascer de uma transacao registrada e idempotente.
- Chaves privadas, credenciais e segredos nunca devem ser armazenados em texto puro.

## Modulos

### RIDE7

- users
- passengers
- drivers
- rides
- deliveries
- service_pricing

### Clover7

- clover7_wallets
- clover7_balances
- clover7_transactions
- clover7_rewards
- clover7_payments
- clover7_qr_codes
- clover7_exchange_rates
- clover7_audit_logs

### Seguranca

- authentication
- authorization
- mfa
- pin_validation
- biometric_challenges
- session_control
- transaction_limits
- antifraud_rules
- audit_logs

### Integracoes

- pix_provider
- financial_partner
- blockchain_adapter
- partner_rewards
- notification_service

## Entidades Principais

### clover7_wallets

- id
- user_id
- wallet_identifier
- status
- balance_available
- balance_pending
- blockchain_address_nullable
- created_at
- updated_at

### clover7_transactions

- id
- idempotency_key
- wallet_id
- type
- amount_clv7
- fee_clv7
- source
- destination
- status
- metadata
- created_at
- confirmed_at

Tipos sugeridos: received, sent, payment, reward, cashback, purchase, conversion, fee.

### clover7_rewards

- id
- user_id
- wallet_id
- campaign_id
- amount_clv7
- reason
- eligibility_status
- antifraud_status
- released_at
- created_at

### clover7_exchange_rates

- id
- source
- fiat_currency
- clv7_rate
- valid_from
- valid_until
- status

Nao exibir equivalente fiduciario quando nao existir uma taxa ativa e valida.

### clover7_audit_logs

- id
- actor_id
- actor_role
- action
- entity_type
- entity_id
- ip_hash
- device_id
- metadata
- created_at

## Fluxos

### Enviar CLV7

1. Resolver destinatario por usuario RIDE7, identificador Clover7, QR Code ou endereco futuro.
2. Validar saldo, limites, status da carteira e antifraude.
3. Criar clover7_transactions com idempotency_key.
4. Solicitar PIN, biometria ou MFA.
5. Debitar/creditar somente por lancamento transacional.
6. Registrar audit log.
7. Enviar notificacao.

### Receber CLV7

1. Gerar QR Code com identificador Clover7.
2. Opcionalmente incluir valor.
3. Permitir copiar e compartilhar.
4. Registrar QR Code quando necessario para auditoria.

### Pagar Corrida com CLV7

1. Calcular valor da corrida em reais.
2. Buscar taxa CLV7 valida configurada pelo backend.
3. Exibir conversao antes de confirmar.
4. Confirmar pagamento com autenticacao.
5. Registrar pagamento, corrida, carteira e logs.

### Recompensas

1. Criar campanha com regra clara.
2. Verificar elegibilidade.
3. Rodar antifraude contra duplicidade, autoindicacao e abuso.
4. Liberar saldo pendente ou disponivel.
5. Registrar historico.

## BlockchainService

Interface preparada para futura fase:

- getBalance(wallet)
- sendToken(transaction)
- receiveToken(address)
- getTransactionStatus(transactionId)
- getExplorerUrl(transactionId)
- validateAddress(address)

Na versao atual, a implementacao deve ser `InternalLedgerBlockchainService`, sem alegar descentralizacao.

## Painel Administrativo

Areas:

- usuarios
- carteiras
- saldo circulante
- transacoes
- recompensas
- pagamentos
- taxas
- fraudes
- alertas
- relatorios

Perfis:

- Administrador
- Financeiro
- Suporte
- Compliance
- Auditoria

Cada acao administrativa deve gerar audit log.
