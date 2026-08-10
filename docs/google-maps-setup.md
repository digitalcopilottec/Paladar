# Configuracao do Google Maps no RIDE7

Os apps `cliente.html` e `driver.html` ja estao preparados para Google Maps e localizacao atual do aparelho.

## Como ativar

1. Crie ou use um projeto na Google Cloud.
2. Ative a **Maps JavaScript API**.
3. Crie uma API key.
4. Restrinja a key para os dominios/URLs do projeto.
5. Edite `maps-config.js`.
6. Troque:

```js
apiKey: "COLE_SUA_GOOGLE_MAPS_API_KEY_AQUI",
```

por:

```js
apiKey: "SUA_CHAVE_AQUI",
```

## Como funciona agora

- Se a chave estiver configurada:
  - O app carrega Google Maps.
  - Solicita permissao de localizacao do navegador.
  - Centraliza o mapa na localizacao atual do aparelho.
  - No app do cliente, mostra a posicao do cliente e motoristas simulados proximos.
  - No app Driver, mostra a posicao do motorista e pontos simulados de embarque/destino.

- Se a chave nao estiver configurada:
  - O app continua funcionando com a imagem de mapa demonstrativa.
  - Uma mensagem avisa que a chave precisa ser configurada.
  - Veiculos simulados continuam se deslocando em tempo real sobre o mapa demonstrativo.

## Simulacao em tempo real

Os prototipos ja possuem uma camada de tempo real:

- Ao abrir o app do cliente, veiculos proximos se movimentam no mapa.
- Ao iniciar a busca, o veiculo principal se desloca ate o ponto de embarque.
- No app Driver, o motorista aparece em movimento.
- Ao aceitar uma corrida, o deslocamento muda para o trajeto ate o destino.

Com Google Maps ativo, os marcadores sao renderizados diretamente na API do Google. Sem a chave, os mesmos movimentos aparecem como camada visual de fallback.

## Observacao importante

Para conectar clientes e motoristas reais em aparelhos diferentes, o proximo passo e salvar e sincronizar localizacoes em tempo real no backend, por exemplo:

- `driverLocations/{driverId}` no Firestore ou Realtime Database.
- `rideLocations/{rideId}/points/{pointId}` para o historico da corrida.
- Cloud Functions para matching de motoristas proximos.
- Firebase Cloud Messaging para enviar chamadas de corrida.
