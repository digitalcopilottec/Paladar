# Ride7

Landing page premium do Ride7, um aplicativo de carona inspirado em fluxos conhecidos de apps como Uber e 99, mas com identidade visual própria.

## Como abrir

Abra `index.html` no navegador.

Para testar o fluxo funcional do cliente, abra `cliente.html`.

Para testar o fluxo funcional do motorista, abra `driver.html`.

## O que existe agora

- Tela inicial de passageiro para pedir corrida.
- Protótipo funcional do cliente em `cliente.html`, com escolha de categoria, pagamento, confirmação do ponto de partida, busca e veículo cadastrado encontrado.
- Protótipo funcional do motorista em `driver.html`, com cadastro, documentos obrigatórios, veículo, placa, cor, modo online e aceite de corrida.
- Simulação em tempo real de veículos se deslocando no mapa nos apps cliente e motorista.
- Sincronização local entre `cliente.html` e `driver.html`: solicitação, aceite, confirmação de embarque e viagem em andamento.
- Hero premium com marca Ride7, imagem realista e chamadas para download.
- Seção de experiência do app com narrativa comercial.
- Simulação de mapa, origem, destino e motoristas próximos.
- Categorias de corrida com preço, tempo de chegada e seleção interativa.
- Suite original alinhada ao MVP: cadastro seguro, GPS, pagamentos, segurança, motorista e admin.
- Seção para motorista com ganhos, chamada recebida e ações.
- Prévia de painel administrativo para operação em tempo real.
- Blocos de segurança com rota compartilhável, perfil verificado e ajuda rápida.
- Logos reais do Ride7 inseridas no header e hero.
- Imagens fotorealistas geradas para o hero e seção de motorista.
- CTA final e rodapé institucional.
- Especificação do produto em `docs/ride7-product-spec.md`.
- Análise do vídeo de referência em `docs/video-uber-flow-analysis.md`.
- Análise do segundo vídeo de referência em `docs/video-uber-flow-analysis-171447.md`.
- Análise do vídeo do motorista em `docs/video-driver-flow-analysis-20260806.md`.
- Guia de Google Maps e localização em `docs/google-maps-setup.md`.

## Assets

- `assets/ride7-logo-horizontal.png`
- `assets/ride7-logo-app.png`
- `assets/ride7-hero-boarding.png`
- `assets/ride7-hero-clean.png`
- `assets/ride7-passenger-boarding.png`
- `assets/ride7-driver-real.png`
- `assets/ride7-car-side.svg`
- `assets/ride7-hero-boarding-video.mp4`
- `assets/ride7-delivery-video.mp4`
- `assets/ride7-mototaxi-video.mp4`

## Próximo passo recomendado

Instalar Flutter e Firebase CLI para iniciar o app mobile com autenticação, cadastro, mapa e estrutura Firestore.

Para ativar Google Maps nos protótipos web, configure a chave em `maps-config.js`.
