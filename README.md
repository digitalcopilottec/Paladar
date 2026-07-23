# 🍽️ Paladar — Sistema de Restaurante

Sistema de gestão para restaurante: **Vendas (PDV)**, **Financeiro**, **Caixa**, **Relatórios**,
**Cardápio** e **Usuários com acesso por perfil**. Feito para rodar em **PC** e **Tablet touch**.

## Tecnologias
- **Backend:** Node + Express + SQLite (banco em arquivo — nada para instalar)
- **Frontend:** React + Vite (responsivo, otimizado para toque)
- **Login:** por usuário, com papéis (admin, gerente, caixa, garçom)

## Como rodar (Windows ou Mac)

Pré-requisito: Node.js 20+ instalado.

```bash
# 1) Backend (API) — na raiz do projeto
npm install
npm run seed          # cria o banco com dados de exemplo (só na 1ª vez)
npm start             # sobe a API em http://localhost:3000

# 2) Frontend — em outro terminal
cd client
npm install
npm run dev           # abre em http://localhost:5173
```

Em produção, você pode gerar o front e servir tudo pela API:
```bash
npm run build:client  # gera client/dist
npm start             # a API passa a servir a interface em http://localhost:3000
```

## Usuários de teste
| Usuário  | Senha       | Perfil  | Acesso |
|----------|-------------|---------|--------|
| admin    | admin123    | Admin   | Tudo |
| gerente  | gerente123  | Gerente | Tudo, exceto config avançada |
| caixa    | caixa123    | Caixa   | PDV, Caixa, Financeiro, Relatórios |
| garcom   | garcom123   | Garçom  | PDV e Mesas |

> ⚠️ Troque as senhas padrão antes de usar de verdade.

## Estrutura
```
server/            API Express
  schema.sql       modelo do banco
  routes/          auth, catalog, orders, tables, cash, financial, reports, users
client/            interface React (Vite)
  src/pages/       Login, Home, PDV, Mesas, Caixa, Financeiro, Relatórios, Cardápio, Usuários
data/paladar.db    banco SQLite (criado automaticamente)
```

## Buffet por quilo (atendente + display do cliente)

O fluxo principal do Paladar: o cliente se serve, o **atendente pesa** e o cliente
vê o resultado numa **tela espelhada**.

| Tela | Endereço | Quem usa |
|------|----------|----------|
| **App do atendente** | `/#/atendente` | Funcionário, no **celular** (com login) |
| **Display do cliente** | `/#/display` | Tela virada para o cliente (sem login) |
| **Config. Buffet** | `/#/config-buffet` | Gerente: preço/kg, valor por pessoa e tara |

O atendente digita o peso → o display do cliente mostra **peso e valor na hora** →
o atendente recebe → o display agradece. A venda entra como comanda paga (tipo
`quilo`) e aparece no caixa e nos relatórios.

> **Peso usa 3 casas decimais** (o grama), dinheiro usa 2. Não unifique: arredondar
> peso em 2 casas faz 0,485 kg virar 0,49 kg e **cobra a mais do cliente**.

> A **tara** (peso do prato vazio) é descontada de toda pesagem. Se a sua balança já
> desconta, deixe a tara em **0** para não descontar duas vezes.

### Planos do buffet

O atendente escolhe um **plano** antes de cobrar. Cada plano cobra de um jeito:

| Plano | Cobra por | Como o atendente informa |
|-------|-----------|--------------------------|
| Buffet Livre | pessoa | contador de pessoas (R$ 35 semana / R$ 50 sábado, automático) |
| Marmita do Dia | unidade | contador de marmitas |
| Marmita a Peso | quilo | peso na balança (desconta a tara) |
| Marmita Carne | quilo | peso na balança |

Os preços e planos são editáveis em **Config. Buffet** (gerente). O campo **preço
sábado** troca o valor automaticamente no sábado — deixe 0 para cobrar igual todo dia.

## Marca (enviar logo e arte)

Tela **Marca** (perfil gerente) — envie os arquivos **originais** da identidade:

- **Colar** com `Ctrl+V` / `⌘+V` (funciona com imagem na área de transferência)
- **Arrastar** o arquivo para o quadro
- **Clicar** e procurar no computador

Os arquivos vão para `server/uploads/` e são servidos em `/uploads/…` — ficam fora
do `client/public/`, então **não precisa rebuildar o front** para trocar a marca.

| Destino | Onde aparece |
|---------|--------------|
| `logo`  | Login, menu lateral, totem, cozinha, atendente e tela do cliente |
| `fundo` | Tela de atração do totem |

> **SVG não é aceito no upload.** SVG é executável no navegador (pode conter script)
> e seria servido no mesmo domínio do sistema. Use PNG, JPG ou WEBP (até 8 MB).

Enquanto nenhum logo é enviado, o sistema usa o **logo vetorial de reserva**
(`components/Logo.jsx`). Assim que você envia o arquivo, ele passa a mandar sozinho.

## Logo

O logo é um **componente SVG** (`client/src/components/Logo.jsx`) — não um arquivo de
imagem. Fica nítido em qualquer tamanho e acompanha as três variações da identidade:

```jsx
<Logo variant="light" />            {/* oficial: círculo branco, texto vermelho */}
<Logo variant="red" />              {/* círculo vermelho, tudo branco */}
<Logo variant="black" />            {/* círculo preto, tudo branco    */}
<Logo variant="light" compact />    {/* só o chapéu */}
```

> Use `compact` em marcas menores que ~44px: nesse tamanho o texto "Paladar" fica
> ilegível, então mostramos apenas o chapéu.

Onde aparece: login (completo), barra lateral, cabeçalho do totem e da cozinha (compacto).
A fonte manuscrita é a **Great Vibes** (Google Fonts, carregada no `index.html`).

## Tela de atração do totem (arte da marca)

A primeira tela é uma **reconstrução vetorial** da arte da marca — não um PNG. Assim
fica nítida em qualquer tamanho de totem e a grafia saiu corrigida ("Restaurante").
É montada em `pages/Totem.jsx` (classe `.tt-art`):
- **Logo (chapéu) e fundo split preto/vermelho:** SVG + CSS vetoriais.
- **"Paladar":** fonte manuscrita **Great Vibes** (carregada do Google Fonts em
  `index.html`). ⚠️ Precisa de internet; para um totem offline, baixe o `.woff2` e
  sirva de `client/public/`.
- **O prato:** recorte circular da foto real em `client/public/totem-fundo.jpg`
  (região do prato, via `background-position`). Trocar a foto = trocar esse arquivo.

Para ajustar o enquadramento do prato, mexa em `.tt-art-plate` (background-size/position)
no `styles.css`.

## Fotos e logo (o visual do totem)

O totem é a vitrine — é onde a foto vende. Dois arquivos e um campo:

1. **Logo:** salve o PNG em `client/public/logo.png`. Aparece sozinho no totem
   (início e cabeçalho). Sem o arquivo, cai no emoji 👨‍🍳.
2. **Fotos dos pratos:** a tabela `products` tem a coluna `image`. Coloque as fotos
   em `client/public/produtos/` e grave o caminho em **Cardápio → botão "Foto"**
   (ex.: `/produtos/picanha.jpg`). Sem foto, o totem mostra o ícone da categoria —
   nunca quebra.

### Fotos provisórias (`demo-*.jpg`)

Os 16 produtos estão com fotos **de demonstração** do Unsplash (licença de uso
comercial, sem atribuição obrigatória). Créditos em `produtos/CREDITOS-DEMO.txt`.

**Elas não são os pratos do Paladar — troque antes de abrir ao público.**
Basta salvar a sua foto por cima do arquivo `demo-*.jpg` correspondente, ou apontar
um caminho novo em Cardápio → Foto.

As mais distantes do prato real (trocar primeiro): **moqueca** (é um ensopado de
camarão genérico — banco de imagem gringo não tem moqueca) e **parmegiana** (é um
gratinado, não bife empanado).

> ⚠️ **Use fotos dos SEUS pratos.** O cliente pede pela imagem: foto de banco ou
> gerada por IA que não corresponde ao prato servido é propaganda enganosa.
> Foto quadrada (1:1) funciona melhor — o totem recorta em círculo.

## Totem de autoatendimento (na porta)

Um totem só, na entrada. Abra em tela cheia, sem login:

```
http://<servidor>:5173/#/totem
```

Fluxo do cliente:
1. Toca na tela → monta o pedido no cardápio (com adicionais)
2. Escolhe **🍽️ Comer aqui** ou **🍱 Marmita para viagem**
3. **Paga no ato** — crédito, débito ou Pix (sem dinheiro: não há caixa no totem)
4. Se for comer no local, **o sistema indica a mesa** na tela; se for marmita, retira no balcão
5. A tela volta sozinha ao início em 20s

**Salão lotado:** o totem desabilita "Comer aqui" e segue vendendo marmita. Se lotar
enquanto o cliente escolhia, ele é avisado e pode trocar para marmita.

**Liberar mesa:** como o totem já cobrou, a mesa fica ocupada **sem comanda aberta**.
Em **Mesas** ela aparece como *✓ pago no totem* com o botão **Liberar mesa** — use quando
o cliente for embora. Mesa com comanda em aberto não pode ser liberada sem fechar a conta.

> O pedido do totem nasce **pago e fechado**. Por isso o KDS filtra pelo status do
> **item**, não da comanda — senão o pedido do totem nunca chegaria na cozinha.

## KDS — tela da cozinha

Monitor da cozinha, atualizado sozinho a cada 8 segundos:

```
http://<servidor>:5173/#/cozinha
```

Cada comanda vira um ticket (mais antigo primeiro). Toque no status do item para avançar
`novo → preparando → pronto`, ou use **Tudo pronto**. Quando o garçom leva à mesa,
**Entregue → tirar** remove o ticket da fila (os itens continuam na conta do cliente).

Alerta de tempo: **normal** até 10min · **amarelo** a partir de 10min · **vermelho piscando**
a partir de 20min. Ajuste em `WARN_MIN` / `LATE_MIN` em `client/src/pages/Cozinha.jsx`.

## Adicionais / opções

Em **Adicionais** (perfil gerente) você cria grupos e liga aos produtos:

- **Mín. 1 / Máx. 1** → escolha única obrigatória. Ex.: *Ponto da carne* (mal / ao ponto / bem)
- **Mín. 0 / Máx. 3** → até 3 extras opcionais. Ex.: *Adicionais* (bacon +6,00, queijo +4,50)

O preço do adicional soma no item. Um produto sem grupo continua entrando com um toque.

> **A validação e o preço são sempre calculados no servidor** (`server/options.js`).
> O tablet do cliente é público — se o preço viesse dele, daria para forjar o pedido.

## Estoque, Ficha Técnica e CMV

1. **Estoque** → cadastre os insumos. O custo é sempre por **1 unidade**:
   picanha a R$ 89,00/kg → unidade `g`, custo `0,089`.
2. **Ficha Técnica** → diga quanto cada prato consome (300g de picanha, 150g de arroz).
   Adicionais também têm ficha — o bacon vendido sai do bacon comprado.
3. Ao **fechar a comanda**, o estoque baixa sozinho e o custo é gravado no item.
4. **Relatórios** mostram **CMV** e a margem real por produto.

Movimentações: **Entrada** (compra — se informar preço novo, atualiza o custo),
**Perda** (quebra) e **Ajuste** (define o saldo contado no inventário).
O estoque nunca é editado à mão, só por movimento — assim dá para auditar.

> **O custo é congelado no momento da venda** (`order_items.unit_cost`).
> Se a picanha subir amanhã, o CMV de hoje não muda — histórico é histórico.

> O estoque **pode ficar negativo** de propósito: travar a venda porque o cadastro
> está desatualizado atrapalharia mais o restaurante do que ajuda.

## Delivery

**Delivery → + Novo pedido**: digite o telefone e saia do campo — se o cliente já
pediu antes, nome e endereço vêm preenchidos. Monte o pedido (com adicionais),
informe a taxa de entrega e envie.

Fluxo: `⏳ na cozinha` → **Despachar** (escolhe o entregador) → `🛵 saiu` →
**Marcar entregue** → **Receber** (abre a comanda; aceita dinheiro com troco, Pix, cartão).

O KDS marca o pedido com a etiqueta **🛵 Delivery** e o nome do cliente — o preparo
é diferente (embala, não empratar). A taxa de entrega entra no total e o estoque
baixa no recebimento, igual a qualquer venda.

Entregadores são cadastrados pelo gerente em **Entregadores**.

## Fiscal (NFC-e modelo 65 · SEFAZ-RS · Simples Nacional)

⚠️ **O módulo gera a nota mas ainda NÃO transmite.** Isso é proposital: transmitir
exige coisas que só o lojista tem. O sistema nunca marca uma nota como "autorizada"
sem a SEFAZ ter autorizado — nota falsamente autorizada é pior que nota nenhuma.

### O que já funciona
- Cadastro do emitente, ambiente (homologação/produção), série e numeração
- **NCM / CFOP / CSOSN / origem por produto** (em Cardápio → botão *Fiscal*)
- **Chave de acesso de 44 dígitos** com dígito verificador (módulo 11) — validado
- Payload completo da NFC-e (itens com adicionais, taxas em `vOutro`, pagamentos, troco)
- Ciclo da nota: pendente → autorizada / rejeitada / cancelada
- Cancelamento com justificativa mínima de 15 caracteres (regra da SEFAZ)

### O que falta para emitir de verdade
1. **Certificado digital A1/A3** — instalado no provedor, nunca neste sistema
2. **CSC + ID do CSC** — gerados por você no portal da SEFAZ-RS
3. **CNPJ e IE** reais do Paladar
4. **Provedor de transmissão** (PlugNotas, Focus NFe, WebmaniaBR, Tecnospeed)
5. Conferir o **NCM de cada produto** com o contador
6. Testar tudo em **homologação** antes de virar para produção

> **Por que provedor e não SOAP direto na SEFAZ?** Dá para escrever o cliente cru
> (assinatura XMLDSig, contingência, inutilização). Não compensa: a regra fiscal muda,
> erro tem consequência legal e você ficaria refém de manutenção. O provedor mantém a
> conformidade por centavos/nota. O ponto de integração é **um só**: a função
> `transmit()` em `server/routes/fiscal.js`.

## Roadmap (próximas fases)
- [x] PDV Tablet do cliente (cardápio touch para o cliente pedir na mesa)
- [x] Comanda por mesa (abrir, adicionar, taxa de serviço, desconto, dividir, fechar)
- [x] KDS — tela da cozinha
- [x] Adicionais/opções estruturados (ponto da carne, extras com preço)
- [x] Estoque + ficha técnica + CMV
- [x] Delivery (cliente por telefone, taxa, entregador, status de rota)
- [x] Fiscal — estrutura, payload e ciclo da NFC-e (falta plugar o provedor)
- [ ] **Transmitir NFC-e** (implementar `transmit()` com o provedor escolhido)
- [ ] Integração iFood
- [ ] Fiscal (NFC-e / SAT) — depende de certificado digital e credenciamento SEFAZ
- [ ] Transferir itens/conta entre mesas
- [ ] Impressão de comanda/cupom
- [ ] Logo oficial do Paladar no lugar do emoji
- [ ] Delivery e integração de pagamento (Pix real)
```
