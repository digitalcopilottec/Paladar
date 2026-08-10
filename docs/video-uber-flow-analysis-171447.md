# Analise do Segundo Video de Referencia

Arquivo analisado:

`/Users/digitalcopilot/Downloads/WhatsApp Video 2026-08-05 at 17.14.47.mp4`

## Metadados extraidos

- Duracao: 17,62 segundos
- Resolucao: 384 x 848
- Codec de video: H.264
- Audio: MPEG-4 AAC
- Frames extraidos: 19
- Intervalo de extracao: 1 frame por segundo

## Arquivos gerados

- `tmp/video_frames_171447/frame_01_00.00s.png` ate `tmp/video_frames_171447/frame_19_17.57s.png`
- `tmp/video_frames_171447/contact_sheet.png`
- `tmp/video_frames_171447/metadata.txt`

## Fluxo observado

1. Home com campo "Para onde?".
2. Tela de planejamento da proxima viagem.
3. Campos de origem e destino com teclado aberto.
4. Lista de sugestoes de enderecos.
5. Tela de escolha de categoria com mapa no topo.
6. Aviso de preco mais alto que o normal.
7. Categorias visiveis com preco e ETA:
   - Prioridade
   - UberX
   - Comfort
   - Moto
8. Metodo de pagamento mostrado no rodape da escolha.
9. Botao principal para escolher a categoria.
10. Tela de confirmacao do ponto de partida.
11. Mapa em tela maior com marcador ajustavel.
12. Endereco de partida exibido em um card inferior.
13. Botao "Confirmar viagem".

## Padrões uteis para adaptar ao RIDE7

- Mostrar mapa no topo durante escolha de categoria.
- Lista vertical de categorias com preco, ETA e destaque da categoria selecionada.
- Exibir metodo de pagamento antes da confirmacao.
- Separar "escolher categoria" de "confirmar ponto de partida".
- Permitir arrastar/ajustar ponto no mapa.
- Usar botao principal fixo no final do painel.
- Mostrar alerta contextual de preco/demanda quando necessario.

## Impacto no prototipo RIDE7

O prototipo `cliente.html` ja cobre:

- Origem e destino.
- Escolha de categoria.
- Metodo de pagamento.
- Confirmacao de corrida.
- Busca de veiculo cadastrado.
- Motorista encontrado com dados do veiculo.

Melhorias recomendadas a partir deste video:

- Adicionar etapa intermediaria "Confirmar ponto de partida".
- Exibir aviso de demanda/preco acima do normal quando aplicavel.
- Mostrar o metodo de pagamento no rodape da lista de categorias.
- Destacar uma categoria recomendada como "Mais rapido".
