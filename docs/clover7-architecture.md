# Clover7 (CLV7) - Projeto Separado

Clover7 deve operar como app/modulo separado do RIDE7, mantendo integracoes futuras por API e nao como tela interna obrigatoria do cliente ou motorista.

## Direcao de Produto

- App independente: `clover7.html`, `clover7.css`, `clover7.js`.
- Identidade propria: verde Clover, dourado metalico, preto, branco e cinza metalico.
- Integracao futura com RIDE7 via eventos/API: recompensas, cashback, pagamento de corridas e beneficios.
- Nao apresentar CLV7 como investimento.
- Nao prometer valorizacao, rendimento ou retorno financeiro.

## Entidades Futuras

- users
- clover7_wallets
- clover7_transactions
- clover7_rewards
- clover7_payments
- clover7_qr_codes
- clover7_exchange_rates
- clover7_audit_logs

## Servicos

- WalletService
- TransactionService
- RewardService
- ConversionRateService
- QRCodeService
- ComplianceService
- AntifraudService
- BlockchainService futuro

## Regra Central

Saldo nunca deve ser alterado sem transacao registrada com `idempotency_key`, auditoria, status e mecanismo antifraude.

## Pix e Blockchain

Pix e blockchain ficam preparados, mas nao ficticios. Devem depender de parceiro financeiro autorizado, validacao juridica e backend configurado.
