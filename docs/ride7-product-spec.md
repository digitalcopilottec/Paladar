# RIDE7 - Especificacao do Produto

## Visao

RIDE7 e uma plataforma de mobilidade urbana para transporte particular, com operacao inicial no Rio Grande do Sul e arquitetura preparada para expansao nacional.

O produto conecta passageiros, motoristas parceiros e administradores com foco em seguranca, simplicidade, atendimento regional e confiabilidade.

## Publicos

- Passageiros que precisam solicitar corridas com rapidez e seguranca.
- Motoristas parceiros que desejam controlar ganhos e disponibilidade.
- Administradores que precisam operar usuarios, documentos, corridas, tarifas, suporte e financeiro.

## Stack Recomendada

- App mobile: Flutter
- Backend: Firebase
- Banco de dados: Cloud Firestore
- Autenticacao: Firebase Authentication
- SMS/OTP: Firebase Auth Phone ou provedor SMS integrado via Cloud Functions
- Mapas: Google Maps SDK
- Notificacoes: Firebase Cloud Messaging
- Arquivos: Firebase Storage
- Regras de negocio: Cloud Functions
- Painel admin: Flutter Web, React ou app web dedicado com Firebase Admin SDK em ambiente seguro

## Modulos do Passageiro

### Cadastro e Login

- Nome completo
- CPF
- E-mail
- Celular
- Senha
- Login por e-mail ou telefone
- Recuperacao de senha
- OTP via SMS para validar celular

Login futuro:

- Google
- Apple ID
- WhatsApp
- Instagram

### Corridas

- Solicitar corrida em poucos toques
- Origem automatica via GPS
- Edicao de origem e destino
- Motoristas proximos em tempo real
- Estimativa de valor
- Estimativa de chegada
- Tempo estimado de viagem
- Acompanhamento no mapa
- Compartilhamento de viagem
- Historico completo

### Pagamentos

- PIX
- Cartao de credito
- Cartao de debito
- Dinheiro
- Carteira digital futura

### Seguranca

- Celular verificado
- Motorista validado
- Historico completo
- Rota compartilhavel
- Botao de emergencia
- Registro de localizacao durante a corrida
- Identificacao antes do embarque:
  - Foto do motorista
  - Foto do veiculo
  - Placa
  - Modelo
  - Cor
  - Avaliacao media

### Avaliacoes

- Nota de 1 a 5 estrelas
- Comentario opcional
- Historico de avaliacoes
- Media publica do motorista
- Denuncia de comportamento inadequado

## Modulos do Motorista

### Cadastro

- Nome
- CPF
- CNH
- Documento do veiculo
- Foto do veiculo
- Selfie para validacao
- Comprovante de residencia
- Conta bancaria ou chave PIX

### Operacao

- Ficar online/offline
- Aceitar corridas
- Recusar corridas
- Navegacao integrada
- Historico financeiro
- Ganhos diarios
- Ganhos semanais
- Ganhos mensais
- Avaliacoes recebidas

## Painel Administrativo

- Gestao de passageiros
- Gestao de motoristas
- Aprovacao de documentos
- Controle de corridas
- Controle financeiro
- Relatorios
- Mapa em tempo real
- Configuracao de tarifas
- Promocoes e cupons
- Sistema de suporte

## Modelo Inicial do Firestore

```text
users/{userId}
  role: passenger | driver | admin
  fullName
  cpf
  email
  phone
  phoneVerified
  createdAt
  status

passengerProfiles/{userId}
  favoritePlaces[]
  paymentMethods[]
  ratingAverage

driverProfiles/{userId}
  cnh
  pixKey
  bankAccount
  approvalStatus
  online
  ratingAverage
  dailyEarnings
  weeklyEarnings
  monthlyEarnings

vehicles/{vehicleId}
  driverId
  model
  color
  plate
  vehiclePhotoUrl
  documentUrl
  approvalStatus

rides/{rideId}
  passengerId
  driverId
  status
  origin
  destination
  estimatedFare
  finalFare
  estimatedArrivalMinutes
  estimatedTripMinutes
  paymentMethod
  createdAt
  startedAt
  completedAt

rideLocations/{rideId}/points/{pointId}
  lat
  lng
  recordedAt

reviews/{reviewId}
  rideId
  fromUserId
  toUserId
  rating
  comment
  createdAt

supportTickets/{ticketId}
  userId
  rideId
  priority
  status
  message
  createdAt

promotions/{promotionId}
  code
  discountType
  value
  active
  startsAt
  endsAt
```

## Fluxo MVP

1. Passageiro cria conta e valida telefone.
2. Passageiro define origem/destino.
3. Sistema calcula estimativa de corrida.
4. Motoristas proximos recebem chamada.
5. Motorista aceita.
6. Passageiro ve dados do motorista e veiculo.
7. Corrida e acompanhada em tempo real.
8. Pagamento e registrado.
9. Passageiro e motorista avaliam a viagem.
10. Admin acompanha a operacao no painel.

## Roadmap

### MVP

- Autenticacao por e-mail, telefone e OTP
- Cadastro de passageiro
- Cadastro de motorista com documentos
- Solicitar corrida
- Aceite de motorista
- Mapa em tempo real
- PIX, cartao e dinheiro como opcoes
- Avaliacao
- Painel admin basico

### Fase 2

- Carteira digital
- Cupons e promocoes
- Chat
- Login social
- Relatorios avancados
- Notificacoes inteligentes

### Fase 3

- Programa de fidelidade
- Assinaturas
- IA para otimizacao de corridas
- Expansao para novas cidades e estados
- Integracoes financeiras avancadas
