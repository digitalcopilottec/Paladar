# Ride7 - Expansao da plataforma

Este documento organiza a evolucao do prototipo Ride7 para um ecossistema unico de mobilidade,
entregas, beneficios, assinaturas e publicidade.

## Modulos de produto

- Servicos: carro, MotoTaxi e entregas no mesmo app.
- Cashback: saldo disponivel, saldo pendente, historico, validade e regras por campanha.
- Pontos: transacoes de pontos para clientes e parceiros.
- Rankings: niveis Bronze, Prata, Ouro, Platina e Diamante para parceiros; Bronze, Silver, Gold,
  Platinum e Black/VIP para clientes.
- Recompensas: cupons, cashback, beneficios patrocinados, upgrades e promocoes exclusivas.
- Assinaturas: Plano Moto, Plano Carro, Plano Entrega e Clube Premium.
- Patrocinadores: banners, cupons, cashback patrocinado, impressoes, cliques e conversoes.
- Indicacoes: codigo/link por usuario, bonus para quem indica e desconto para novo usuario.

## Colecoes sugeridas

- `users`
- `drivers`
- `services`
- `rides`
- `deliveries`
- `wallets`
- `payments`
- `subscription_plans`
- `subscriptions`
- `cashback_transactions`
- `points_transactions`
- `user_levels`
- `driver_levels`
- `achievements`
- `user_achievements`
- `referrals`
- `sponsors`
- `advertisements`
- `ad_impressions`
- `ad_clicks`
- `promotions`
- `coupons`
- `rewards`
- `reward_redemptions`

## Servicos de negocio

- `CashbackService`: calcula e registra cashback sem duplicar transacoes.
- `PointsService`: aplica pontos por viagem, entrega, avaliacao, indicacao e campanha.
- `RankingService`: atualiza niveis com base em pontos, avaliacao, frequencia e cancelamentos.
- `SubscriptionService`: gerencia planos, status, renovacao, cancelamento e beneficios ativos.
- `RewardsService`: lista recompensas elegiveis e valida resgates.
- `ReferralService`: gera codigos e previne fraude em indicacoes.
- `SponsorService`: gerencia patrocinadores e campanhas.
- `AdvertisingService`: registra impressoes, cliques, CTR, cupom e conversao.
- `PaymentService`: valida pagamentos, assinaturas e transacoes de carteira.

## Regras de seguranca

Nunca calcular valores sensiveis apenas no frontend:

- cashback;
- pontos;
- ranking;
- cupons;
- descontos;
- pagamento;
- assinatura;
- recompensas.

Toda regra deve ser validada em backend ou Cloud Functions, com idempotencia para evitar:

- cashback duplicado;
- pontos artificiais;
- corrida falsa;
- indicacao fraudulenta;
- cupom reutilizado indevidamente;
- manipulacao de plano;
- pagamento duplicado.

## Configuracoes administrativas

O painel administrativo deve permitir alterar sem deploy:

- precos dos planos;
- beneficios;
- percentuais e limites de cashback;
- regras de pontos;
- niveis e rankings;
- campanhas;
- patrocinadores;
- anuncios;
- cupons;
- recompensas;
- regioes e periodos promocionais.
