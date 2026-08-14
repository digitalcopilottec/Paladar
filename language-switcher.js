const RIDE7_LANGUAGE_KEY = "ride7_language";

const languageFlags = {
  en: "flag-us",
  es: "flag-es",
  "pt-BR": "flag-br",
  "pt-PT": "flag-pt",
};

const languageNames = {
  en: "English",
  es: "Español",
  "pt-BR": "Português Brasil",
  "pt-PT": "Português Portugal",
};

const messages = {
  "Ride7 inicio": {
    en: "Ride7 home",
    es: "Inicio Ride7",
    "pt-PT": "Início Ride7",
  },
  Navegacao: {
    en: "Navigation",
    es: "Navegación",
    "pt-PT": "Navegação",
  },
  Passageiro: { en: "Passenger", es: "Pasajero", "pt-PT": "Passageiro" },
  Motorista: { en: "Driver", es: "Conductor", "pt-PT": "Motorista" },
  "Como funciona": { en: "How it works", es: "Cómo funciona", "pt-PT": "Como funciona" },
  Experiencia: { en: "Experience", es: "Experiencia", "pt-PT": "Experiência" },
  Beneficios: { en: "Benefits", es: "Beneficios", "pt-PT": "Benefícios" },
  Planos: { en: "Plans", es: "Planes", "pt-PT": "Planos" },
  Solucao: { en: "Solution", es: "Solución", "pt-PT": "Solução" },
  Admin: { en: "Admin", es: "Admin", "pt-PT": "Admin" },
  Entrar: { en: "Sign in", es: "Entrar", "pt-PT": "Entrar" },
  "Criar conta": { en: "Create account", es: "Crear cuenta", "pt-PT": "Criar conta" },
  "Mobilidade urbana no Rio Grande do Sul": {
    en: "Urban mobility in Rio Grande do Sul",
    es: "Movilidad urbana en Rio Grande do Sul",
    "pt-PT": "Mobilidade urbana no Rio Grande do Sul",
  },
  "Seu caminho. Sua escolha.": {
    en: "Your route. Your choice.",
    es: "Tu camino. Tu elección.",
    "pt-PT": "O teu caminho. A tua escolha.",
  },
  "SEU CAMINHO. SUA ESCOLHA.": {
    en: "YOUR ROUTE. YOUR CHOICE.",
    es: "TU CAMINO. TU ELECCIÓN.",
    "pt-PT": "O TEU CAMINHO. A TUA ESCOLHA.",
  },
  "Corridas, MotoTaxi e tele entrega com seguranca, negociacao de valor e acompanhamento em tempo real no mapa.": {
    en: "Rides, MotoTaxi and delivery with safety, fare negotiation and real-time map tracking.",
    es: "Viajes, MotoTaxi y entregas con seguridad, negociación de precio y seguimiento en tiempo real.",
    "pt-PT": "Viagens, MotoTaxi e entregas com segurança, negociação de valor e acompanhamento em tempo real no mapa.",
  },
  "Pedir carona": { en: "Request a ride", es: "Pedir viaje", "pt-PT": "Pedir boleia" },
  "Dirigir com Ride7": { en: "Drive with Ride7", es: "Conducir con Ride7", "pt-PT": "Conduzir com Ride7" },
  Seguranca: { en: "Safety", es: "Seguridad", "pt-PT": "Segurança" },
  "Motoristas verificados e rota compartilhavel.": {
    en: "Verified drivers and shareable route.",
    es: "Conductores verificados y ruta compartible.",
    "pt-PT": "Motoristas verificados e rota partilhável.",
  },
  "Negocie valor": { en: "Negotiate fare", es: "Negocia el precio", "pt-PT": "Negocie o valor" },
  "Escolha o preco e receba proposta.": {
    en: "Choose a price and receive an offer.",
    es: "Elige un precio y recibe una propuesta.",
    "pt-PT": "Escolha o preço e receba uma proposta.",
  },
  MotoTaxi: { en: "MotoTaxi", es: "MotoTaxi", "pt-PT": "MotoTáxi" },
  "Agilidade com piloto cadastrado.": {
    en: "Fast trips with a registered rider.",
    es: "Agilidad con conductor registrado.",
    "pt-PT": "Agilidade com piloto registado.",
  },
  Suporte: { en: "Support", es: "Soporte", "pt-PT": "Suporte" },
  "Atendimento rapido para usuarios.": {
    en: "Fast support for users.",
    es: "Atención rápida para usuarios.",
    "pt-PT": "Atendimento rápido para utilizadores.",
  },
  "Uma jornada simples, com informacao clara em cada etapa": {
    en: "A simple journey, with clear information at every step",
    es: "Un recorrido simple, con información clara en cada etapa",
    "pt-PT": "Uma jornada simples, com informação clara em cada etapa",
  },
  "A Ride7 combina cotacao antecipada, motoristas verificados, pagamento flexivel e suporte regional para deixar a chamada facil mesmo para quem usa pouco tecnologia.": {
    en: "Ride7 combines upfront estimates, verified drivers, flexible payments and regional support so requesting a ride stays easy for everyone.",
    es: "Ride7 combina cotización anticipada, conductores verificados, pagos flexibles y soporte regional para que pedir un viaje sea fácil para todos.",
    "pt-PT": "A Ride7 combina cotação antecipada, motoristas verificados, pagamento flexível e suporte regional para tornar o pedido simples mesmo para quem usa pouca tecnologia.",
  },
  "Informe origem e destino": { en: "Enter pickup and destination", es: "Indica origen y destino", "pt-PT": "Indique origem e destino" },
  "Use GPS, digite o endereco ou peca ajuda pelo WhatsApp quando estiver disponivel.": {
    en: "Use GPS, type the address or ask for WhatsApp help when available.",
    es: "Usa GPS, escribe la dirección o pide ayuda por WhatsApp cuando esté disponible.",
    "pt-PT": "Use GPS, escreva o endereço ou peça ajuda pelo WhatsApp quando estiver disponível.",
  },
  "Escolha o servico": { en: "Choose the service", es: "Elige el servicio", "pt-PT": "Escolha o serviço" },
  "Carro, Ride7 Plus, MotoTaxi, tele entrega, agendamento e viagens para empresas.": {
    en: "Car, Ride7 Plus, MotoTaxi, delivery, scheduled rides and company trips.",
    es: "Auto, Ride7 Plus, MotoTaxi, entregas, reservas y viajes para empresas.",
    "pt-PT": "Carro, Ride7 Plus, MotoTáxi, entregas, agendamento e viagens para empresas.",
  },
  "Veja preco e negocie": { en: "See price and negotiate", es: "Ve el precio y negocia", "pt-PT": "Veja o preço e negocie" },
  "O app mostra valor base, range dinamico e proposta simples para aceitar ou ajustar.": {
    en: "The app shows a base fare, dynamic range and a simple offer to accept or adjust.",
    es: "La app muestra precio base, rango dinámico y una propuesta simple para aceptar o ajustar.",
    "pt-PT": "A app mostra valor base, intervalo dinâmico e proposta simples para aceitar ou ajustar.",
  },
  "Acompanhe em tempo real": { en: "Track in real time", es: "Sigue en tiempo real", "pt-PT": "Acompanhe em tempo real" },
  "Motorista, veiculo, placa, rota, pagamento e compartilhamento ficam na mesma tela.": {
    en: "Driver, vehicle, plate, route, payment and sharing stay on one screen.",
    es: "Conductor, vehículo, placa, ruta, pago y compartir están en la misma pantalla.",
    "pt-PT": "Motorista, veículo, matrícula, rota, pagamento e partilha ficam no mesmo ecrã.",
  },
  "Experiencia premium": { en: "Premium experience", es: "Experiencia premium", "pt-PT": "Experiência premium" },
  "Do cadastro verificado ao destino, tudo parece claro": {
    en: "From verified signup to destination, everything feels clear",
    es: "Desde el registro verificado hasta el destino, todo es claro",
    "pt-PT": "Do registo verificado ao destino, tudo fica claro",
  },
  "O Ride7 prioriza uma jornada simples para todas as idades: login seguro, GPS, estimativa de valor, acompanhamento de corridas, MotoTaxi, entregas e historico completo.": {
    en: "Ride7 prioritizes a simple journey for every age: secure login, GPS, fare estimate, ride tracking, MotoTaxi, deliveries and full history.",
    es: "Ride7 prioriza una experiencia simple para todas las edades: login seguro, GPS, estimación, seguimiento, MotoTaxi, entregas e historial completo.",
    "pt-PT": "A Ride7 prioriza uma jornada simples para todas as idades: início de sessão seguro, GPS, estimativa, acompanhamento, MotoTáxi, entregas e histórico completo.",
  },
  "Chegue com seguranca desde o embarque": {
    en: "Arrive safely from pickup",
    es: "Llega con seguridad desde el embarque",
    "pt-PT": "Chegue com segurança desde o embarque",
  },
  "Motorista identificado, carro confirmado e viagem acompanhada em tempo real.": {
    en: "Identified driver, confirmed car and trip tracked in real time.",
    es: "Conductor identificado, auto confirmado y viaje seguido en tiempo real.",
    "pt-PT": "Motorista identificado, carro confirmado e viagem acompanhada em tempo real.",
  },
  "Solicite agora": { en: "Request now", es: "Solicita ahora", "pt-PT": "Pedir agora" },
  "Encontre seu RIDE7": { en: "Find your RIDE7", es: "Encuentra tu RIDE7", "pt-PT": "Encontre o seu RIDE7" },
  "Metodo de pagamento": { en: "Payment method", es: "Método de pago", "pt-PT": "Método de pagamento" },
  "Total estimado": { en: "Estimated total", es: "Total estimado", "pt-PT": "Total estimado" },
  "Confirmar Ride7": { en: "Confirm Ride7", es: "Confirmar Ride7", "pt-PT": "Confirmar Ride7" },
  "Nova busca": { en: "New search", es: "Nueva búsqueda", "pt-PT": "Nova pesquisa" },
  "RIDE7 em movimento": { en: "RIDE7 in motion", es: "RIDE7 en movimiento", "pt-PT": "RIDE7 em movimento" },
  "Veja a experiencia do aplicativo em cenas reais": {
    en: "See the app experience in real scenes",
    es: "Mira la experiencia de la app en escenas reales",
    "pt-PT": "Veja a experiência da app em cenas reais",
  },
  "Os videos ficam em uma area dedicada para apresentar embarque, tele entrega e MotoTaxi sem carregar demais a primeira tela.": {
    en: "Videos stay in a dedicated area to show pickup, delivery and MotoTaxi without overloading the first screen.",
    es: "Los videos quedan en un área dedicada para mostrar embarque, entrega y MotoTaxi sin sobrecargar la primera pantalla.",
    "pt-PT": "Os vídeos ficam numa área dedicada para apresentar embarque, entregas e MotoTáxi sem pesar o primeiro ecrã.",
  },
  Embarque: { en: "Pickup", es: "Embarque", "pt-PT": "Embarque" },
  "Passageiro entrando no RIDE7": { en: "Passenger entering RIDE7", es: "Pasajero entrando en RIDE7", "pt-PT": "Passageiro a entrar no RIDE7" },
  "Um recorte premium da experiencia de chegada do motorista e inicio da viagem.": {
    en: "A premium glimpse of driver arrival and trip start.",
    es: "Un vistazo premium de la llegada del conductor y el inicio del viaje.",
    "pt-PT": "Um recorte premium da chegada do motorista e início da viagem.",
  },
  "Tele entrega": { en: "Delivery", es: "Entrega", "pt-PT": "Entrega" },
  "Entrega de produtos e lanches": { en: "Product and snack delivery", es: "Entrega de productos y snacks", "pt-PT": "Entrega de produtos e lanches" },
  "Pedido acompanhado em tempo real, com entregador cadastrado e pagamento direto no app.": {
    en: "Order tracked in real time, with registered courier and in-app payment.",
    es: "Pedido seguido en tiempo real, con repartidor registrado y pago en la app.",
    "pt-PT": "Pedido acompanhado em tempo real, com estafeta registado e pagamento direto na app.",
  },
  "Corrida de moto com agilidade": { en: "Fast motorcycle ride", es: "Viaje en moto con agilidad", "pt-PT": "Viagem de moto com agilidade" },
  "Uma opcao rapida para deslocamentos curtos, com piloto cadastrado e viagem acompanhada.": {
    en: "A fast option for short trips, with a registered rider and tracked route.",
    es: "Una opción rápida para trayectos cortos, con conductor registrado y viaje monitoreado.",
    "pt-PT": "Uma opção rápida para deslocações curtas, com piloto registado e viagem acompanhada.",
  },
  "Cadastro com OTP": { en: "OTP signup", es: "Registro con OTP", "pt-PT": "Registo com OTP" },
  "Validacao por SMS, login por e-mail ou telefone e recuperacao de senha.": {
    en: "SMS validation, email or phone login and password recovery.",
    es: "Validación por SMS, login por email o teléfono y recuperación de contraseña.",
    "pt-PT": "Validação por SMS, início de sessão por e-mail ou telefone e recuperação de palavra-passe.",
  },
  "Seguranca reforcada": { en: "Enhanced safety", es: "Seguridad reforzada", "pt-PT": "Segurança reforçada" },
  "Parceiros selecionados": { en: "Selected partners", es: "Socios seleccionados", "pt-PT": "Parceiros selecionados" },
  "Atendimento regional": { en: "Regional support", es: "Atención regional", "pt-PT": "Atendimento regional" },
  "Ecossistema Ride7": { en: "Ride7 ecosystem", es: "Ecosistema Ride7", "pt-PT": "Ecossistema Ride7" },
  "Escolha como se mover e ganhe beneficios em cada uso": {
    en: "Choose how to move and earn benefits every time",
    es: "Elige cómo moverte y gana beneficios en cada uso",
    "pt-PT": "Escolha como se mover e ganhe benefícios em cada utilização",
  },
  "Carona de carro": { en: "Car ride", es: "Viaje en auto", "pt-PT": "Boleia de carro" },
  "Carona de moto": { en: "Motorcycle ride", es: "Viaje en moto", "pt-PT": "Boleia de moto" },
  Entregas: { en: "Deliveries", es: "Entregas", "pt-PT": "Entregas" },
  "Viagem agendada": { en: "Scheduled trip", es: "Viaje programado", "pt-PT": "Viagem agendada" },
  "Ride7 Empresas": { en: "Ride7 Business", es: "Ride7 Empresas", "pt-PT": "Ride7 Empresas" },
  "Operacao regional": { en: "Regional operation", es: "Operación regional", "pt-PT": "Operação regional" },
  "Meu Cashback": { en: "My cashback", es: "Mi cashback", "pt-PT": "O meu cashback" },
  "Programa de beneficios": { en: "Benefits program", es: "Programa de beneficios", "pt-PT": "Programa de benefícios" },
  "Escolha seu plano": { en: "Choose your plan", es: "Elige tu plan", "pt-PT": "Escolha o seu plano" },
  "Assinaturas para parceiros e Clube Premium para clientes": {
    en: "Subscriptions for partners and Premium Club for riders",
    es: "Suscripciones para socios y Club Premium para clientes",
    "pt-PT": "Assinaturas para parceiros e Clube Premium para clientes",
  },
  Mensal: { en: "Monthly", es: "Mensual", "pt-PT": "Mensal" },
  Semestral: { en: "Semiannual", es: "Semestral", "pt-PT": "Semestral" },
  Anual: { en: "Annual", es: "Anual", "pt-PT": "Anual" },
  Moto: { en: "Motorcycle", es: "Moto", "pt-PT": "Moto" },
  Carro: { en: "Car", es: "Auto", "pt-PT": "Carro" },
  Entrega: { en: "Delivery", es: "Entrega", "pt-PT": "Entrega" },
  Cliente: { en: "Client", es: "Cliente", "pt-PT": "Cliente" },
  "Plano Moto": { en: "Motorcycle Plan", es: "Plan Moto", "pt-PT": "Plano Moto" },
  "Plano Carro": { en: "Car Plan", es: "Plan Auto", "pt-PT": "Plano Carro" },
  "Plano Entrega": { en: "Delivery Plan", es: "Plan Entrega", "pt-PT": "Plano Entrega" },
  "Clube Premium": { en: "Premium Club", es: "Club Premium", "pt-PT": "Clube Premium" },
  Contratar: { en: "Subscribe", es: "Contratar", "pt-PT": "Contratar" },
  "Plano recomendado": { en: "Recommended plan", es: "Plan recomendado", "pt-PT": "Plano recomendado" },
  "Entrar no clube": { en: "Join the club", es: "Entrar al club", "pt-PT": "Entrar no clube" },
  "Plataforma Ride7": { en: "Ride7 Platform", es: "Plataforma Ride7", "pt-PT": "Plataforma Ride7" },
  "App de passageiro, Driver parceiro, entregas e painel administrativo": {
    en: "Passenger app, partner Driver app, deliveries and admin dashboard",
    es: "App de pasajero, Driver socio, entregas y panel administrativo",
    "pt-PT": "App de passageiro, Driver parceiro, entregas e painel administrativo",
  },
  Pagamentos: { en: "Payments", es: "Pagos", "pt-PT": "Pagamentos" },
  "Cadastre seus cartões e escolha como pagar": {
    en: "Add your cards and choose how to pay",
    es: "Registra tus tarjetas y elige cómo pagar",
    "pt-PT": "Registe os seus cartões e escolha como pagar",
  },
  "Cadastro rapido": { en: "Quick signup", es: "Registro rápido", "pt-PT": "Registo rápido" },
  "Entre tambem por canais sociais": {
    en: "Sign in with social channels too",
    es: "Entra también con canales sociales",
    "pt-PT": "Entre também por canais sociais",
  },
  "Baixe o aplicativo": { en: "Download the app", es: "Descarga la app", "pt-PT": "Descarregue a app" },
  "Disponivel para Android e iOS": {
    en: "Available for Android and iOS",
    es: "Disponible para Android e iOS",
    "pt-PT": "Disponível para Android e iOS",
  },
  "Baixar no": { en: "Get it on", es: "Disponible en", "pt-PT": "Obter no" },
  "Baixar na": { en: "Download on the", es: "Descargar en", "pt-PT": "Descarregar na" },
  "Modo motorista": { en: "Driver mode", es: "Modo conductor", "pt-PT": "Modo motorista" },
  "Ganhe com corridas, MotoTaxi e entregas no RS": {
    en: "Earn with rides, MotoTaxi and deliveries in RS",
    es: "Gana con viajes, MotoTaxi y entregas en RS",
    "pt-PT": "Ganhe com viagens, MotoTáxi e entregas no RS",
  },
  "Nova chamada": { en: "New request", es: "Nueva solicitud", "pt-PT": "Nova chamada" },
  Recusar: { en: "Decline", es: "Rechazar", "pt-PT": "Recusar" },
  Aceitar: { en: "Accept", es: "Aceptar", "pt-PT": "Aceitar" },
  "Operacao e gestao": { en: "Operations and management", es: "Operación y gestión", "pt-PT": "Operação e gestão" },
  "Painel para controlar passageiros, motoristas e corridas": {
    en: "Dashboard to manage passengers, drivers and trips",
    es: "Panel para controlar pasajeros, conductores y viajes",
    "pt-PT": "Painel para controlar passageiros, motoristas e viagens",
  },
  "Viagem acompanhada do inicio ao fim": {
    en: "Trip tracked from start to finish",
    es: "Viaje acompañado de inicio a fin",
    "pt-PT": "Viagem acompanhada do início ao fim",
  },
  "Rota compartilhavel": { en: "Shareable route", es: "Ruta compartible", "pt-PT": "Rota partilhável" },
  "Perfil verificado": { en: "Verified profile", es: "Perfil verificado", "pt-PT": "Perfil verificado" },
  "Ajuda rapida": { en: "Fast help", es: "Ayuda rápida", "pt-PT": "Ajuda rápida" },
  "Codigo de embarque": { en: "Pickup code", es: "Código de embarque", "pt-PT": "Código de embarque" },
  "Pagamento protegido": { en: "Protected payment", es: "Pago protegido", "pt-PT": "Pagamento protegido" },
  "Atendimento humano": { en: "Human support", es: "Atención humana", "pt-PT": "Atendimento humano" },
  "Preparado para crescer": { en: "Ready to grow", es: "Listo para crecer", "pt-PT": "Preparado para crescer" },
  "RIDE7 nasce regional e escalavel para todo o Brasil": {
    en: "RIDE7 starts regional and scales across Brazil",
    es: "RIDE7 nace regional y escalable para todo Brasil",
    "pt-PT": "RIDE7 nasce regional e escalável para todo o Brasil",
  },
  "Comecar agora": { en: "Start now", es: "Empezar ahora", "pt-PT": "Começar agora" },
  "Ver demo do app": { en: "See app demo", es: "Ver demo de la app", "pt-PT": "Ver demo da app" },
  "Mobilidade urbana regional, segura e preparada para escala nacional.": {
    en: "Regional, safe urban mobility ready for national scale.",
    es: "Movilidad urbana regional, segura y preparada para escala nacional.",
    "pt-PT": "Mobilidade urbana regional, segura e preparada para escala nacional.",
  },
  "Acesso do passageiro": { en: "Passenger access", es: "Acceso del pasajero", "pt-PT": "Acesso do passageiro" },
  "Acesso do motorista": { en: "Driver access", es: "Acceso del conductor", "pt-PT": "Acesso do motorista" },
  "Entre para pedir sua carona": { en: "Sign in to request your ride", es: "Entra para pedir tu viaje", "pt-PT": "Entre para pedir a sua boleia" },
  "Entre para dirigir com Ride7": { en: "Sign in to drive with Ride7", es: "Entra para conducir con Ride7", "pt-PT": "Entre para conduzir com Ride7" },
  "Crie sua conta de passageiro": { en: "Create your passenger account", es: "Crea tu cuenta de pasajero", "pt-PT": "Crie a sua conta de passageiro" },
  "Cadastre-se como motorista": { en: "Sign up as a driver", es: "Regístrate como conductor", "pt-PT": "Registe-se como motorista" },
  "Use e-mail ou celular com senha. Depois você acessa o aplicativo do cliente.": {
    en: "Use email or phone with password. Then you access the passenger app.",
    es: "Usa email o celular con contraseña. Después accedes a la app del cliente.",
    "pt-PT": "Use e-mail ou telemóvel com palavra-passe. Depois acede à app do cliente.",
  },
  "Crie seu acesso, envie documentos e depois acompanhe chamadas no Ride7 Driver.": {
    en: "Create your access, send documents and then follow requests in Ride7 Driver.",
    es: "Crea tu acceso, envía documentos y luego sigue solicitudes en Ride7 Driver.",
    "pt-PT": "Crie o seu acesso, envie documentos e depois acompanhe chamadas no Ride7 Driver.",
  },
  "Cadastre-se": { en: "Sign up", es: "Registrarse", "pt-PT": "Registar-se" },
  "Acesso demo": { en: "Demo access", es: "Acceso demo", "pt-PT": "Acesso demo" },
  "Preencher": { en: "Fill in", es: "Rellenar", "pt-PT": "Preencher" },
  "E-mail ou celular": { en: "Email or phone", es: "Email o celular", "pt-PT": "E-mail ou telemóvel" },
  Senha: { en: "Password", es: "Contraseña", "pt-PT": "Palavra-passe" },
  "voce@email.com": { en: "you@email.com", es: "tu@email.com", "pt-PT": "voce@email.com" },
  "Digite sua senha": { en: "Enter your password", es: "Escribe tu contraseña", "pt-PT": "Introduza a sua palavra-passe" },
  "Entrar no app cliente": { en: "Enter passenger app", es: "Entrar en app cliente", "pt-PT": "Entrar na app cliente" },
  "Entrar no Driver": { en: "Enter Driver", es: "Entrar en Driver", "pt-PT": "Entrar no Driver" },
  "Criar conta e entrar": { en: "Create account and enter", es: "Crear cuenta y entrar", "pt-PT": "Criar conta e entrar" },
  "Cadastrar e continuar": { en: "Sign up and continue", es: "Registrarse y continuar", "pt-PT": "Registar e continuar" },
  "Sou passageiro": { en: "I am a passenger", es: "Soy pasajero", "pt-PT": "Sou passageiro" },
  "Quero dirigir": { en: "I want to drive", es: "Quiero conducir", "pt-PT": "Quero conduzir" },
  Voltar: { en: "Back", es: "Volver", "pt-PT": "Voltar" },
  "Nome completo": { en: "Full name", es: "Nombre completo", "pt-PT": "Nome completo" },
  "Confira o login e senha demo para continuar.": {
    en: "Check the demo login and password to continue.",
    es: "Revisa el login y la contraseña demo para continuar.",
    "pt-PT": "Confirme o login e a palavra-passe demo para continuar.",
  },
  Menu: { en: "Menu", es: "Menú", "pt-PT": "Menu" },
  "3 veiculos cadastrados perto de voce": {
    en: "3 registered vehicles near you",
    es: "3 vehículos registrados cerca de ti",
    "pt-PT": "3 veículos registados perto de si",
  },
  "Local de partida": { en: "Pickup point", es: "Punto de partida", "pt-PT": "Local de partida" },
  "Carregando RIDE7...": { en: "Loading RIDE7...", es: "Cargando RIDE7...", "pt-PT": "A carregar RIDE7..." },
  "Carregando RIDE7 Driver...": { en: "Loading RIDE7 Driver...", es: "Cargando RIDE7 Driver...", "pt-PT": "A carregar RIDE7 Driver..." },
  "Cadastro pendente": { en: "Signup pending", es: "Registro pendiente", "pt-PT": "Registo pendente" },
  "Para onde vamos hoje?": { en: "Where are we going today?", es: "¿A dónde vamos hoy?", "pt-PT": "Para onde vamos hoje?" },
  "Seu Cashback": { en: "Your cashback", es: "Tu cashback", "pt-PT": "O seu cashback" },
  "Seus Pontos": { en: "Your points", es: "Tus puntos", "pt-PT": "Os seus pontos" },
  "Proxima recompensa": { en: "Next reward", es: "Próxima recompensa", "pt-PT": "Próxima recompensa" },
  "Ofertas para voce": { en: "Offers for you", es: "Ofertas para ti", "pt-PT": "Ofertas para si" },
  Patrocinado: { en: "Sponsored", es: "Patrocinado", "pt-PT": "Patrocinado" },
  Publicidade: { en: "Advertisement", es: "Publicidad", "pt-PT": "Publicidade" },
  Conhecer: { en: "Learn more", es: "Conocer", "pt-PT": "Conhecer" },
  "Ver oferta": { en: "See offer", es: "Ver oferta", "pt-PT": "Ver oferta" },
  Carona: { en: "Ride", es: "Viaje", "pt-PT": "Boleia" },
  "Escolha o veiculo": { en: "Choose the vehicle", es: "Elige el vehículo", "pt-PT": "Escolha o veículo" },
  Origem: { en: "Pickup", es: "Origen", "pt-PT": "Origem" },
  Destino: { en: "Destination", es: "Destino", "pt-PT": "Destino" },
  "Confirmar viagem": { en: "Confirm trip", es: "Confirmar viaje", "pt-PT": "Confirmar viagem" },
  "Procurando motorista": { en: "Searching for driver", es: "Buscando conductor", "pt-PT": "A procurar motorista" },
  "Procurando veiculo cadastrado": { en: "Searching for registered vehicle", es: "Buscando vehículo registrado", "pt-PT": "A procurar veículo registado" },
  "Corrida confirmada": { en: "Ride confirmed", es: "Viaje confirmado", "pt-PT": "Viagem confirmada" },
  "Motorista aceitou": { en: "Driver accepted", es: "Conductor aceptó", "pt-PT": "Motorista aceitou" },
  "Confirmar embarque": { en: "Confirm pickup", es: "Confirmar embarque", "pt-PT": "Confirmar embarque" },
  "Viagem iniciada": { en: "Trip started", es: "Viaje iniciado", "pt-PT": "Viagem iniciada" },
  "Viagem em andamento": { en: "Trip in progress", es: "Viaje en curso", "pt-PT": "Viagem em andamento" },
  "Nova corrida": { en: "New ride", es: "Nuevo viaje", "pt-PT": "Nova viagem" },
  "Escolha a moto": { en: "Choose the motorcycle", es: "Elige la moto", "pt-PT": "Escolha a moto" },
  "Procurando mototaxista": { en: "Searching for MotoTaxi rider", es: "Buscando mototaxista", "pt-PT": "A procurar mototaxista" },
  "MotoTaxi confirmado": { en: "MotoTaxi confirmed", es: "MotoTaxi confirmado", "pt-PT": "MotoTáxi confirmado" },
  "MotoTaxi em andamento": { en: "MotoTaxi in progress", es: "MotoTaxi en curso", "pt-PT": "MotoTáxi em andamento" },
  "Escolha o tipo de entrega": { en: "Choose delivery type", es: "Elige el tipo de entrega", "pt-PT": "Escolha o tipo de entrega" },
  Retirada: { en: "Pickup", es: "Retiro", "pt-PT": "Recolha" },
  "Solicitar entrega": { en: "Request delivery", es: "Solicitar entrega", "pt-PT": "Pedir entrega" },
  "Procurando entregador": { en: "Searching for courier", es: "Buscando repartidor", "pt-PT": "A procurar estafeta" },
  "Entrega confirmada": { en: "Delivery confirmed", es: "Entrega confirmada", "pt-PT": "Entrega confirmada" },
  "Entregador aceitou": { en: "Courier accepted", es: "Repartidor aceptó", "pt-PT": "Estafeta aceitou" },
  "Entrega em andamento": { en: "Delivery in progress", es: "Entrega en curso", "pt-PT": "Entrega em andamento" },
  "Nova entrega": { en: "New delivery", es: "Nueva entrega", "pt-PT": "Nova entrega" },
  "Negociar direto com motorista": { en: "Negotiate directly with driver", es: "Negociar directo con el conductor", "pt-PT": "Negociar diretamente com o motorista" },
  "Base sugerida": { en: "Suggested base", es: "Base sugerida", "pt-PT": "Base sugerida" },
  "Ou digite o valor": { en: "Or type the amount", es: "O escribe el valor", "pt-PT": "Ou introduza o valor" },
  "Escolher Ride7": { en: "Choose Ride7", es: "Elegir Ride7", "pt-PT": "Escolher Ride7" },
  "Pagamento selecionado": { en: "Payment selected", es: "Pago seleccionado", "pt-PT": "Pagamento selecionado" },
  "Cancelar busca": { en: "Cancel search", es: "Cancelar búsqueda", "pt-PT": "Cancelar pesquisa" },
  "Motorista fez uma proposta": { en: "Driver sent an offer", es: "El conductor hizo una propuesta", "pt-PT": "Motorista fez uma proposta" },
  "Aceitar proposta": { en: "Accept offer", es: "Aceptar propuesta", "pt-PT": "Aceitar proposta" },
  "Buscar outro motorista": { en: "Find another driver", es: "Buscar otro conductor", "pt-PT": "Procurar outro motorista" },
  "Compartilhar viagem": { en: "Share trip", es: "Compartir viaje", "pt-PT": "Partilhar viagem" },
  "Encerrar demo": { en: "End demo", es: "Cerrar demo", "pt-PT": "Encerrar demo" },
  "Sistema de cadastro": { en: "Signup system", es: "Sistema de registro", "pt-PT": "Sistema de registo" },
  "Cadastro do motorista": { en: "Driver signup", es: "Registro del conductor", "pt-PT": "Registo do motorista" },
  "Preencha os dados obrigatorios e envie documentos para liberar o modo online.": {
    en: "Fill in required data and send documents to unlock online mode.",
    es: "Completa los datos obligatorios y envía documentos para liberar el modo online.",
    "pt-PT": "Preencha os dados obrigatórios e envie documentos para libertar o modo online.",
  },
  "Parceiros em destaque": { en: "Featured partners", es: "Socios destacados", "pt-PT": "Parceiros em destaque" },
  "Enviar para aprovacao": { en: "Send for approval", es: "Enviar para aprobación", "pt-PT": "Enviar para aprovação" },
  "Conta aprovada": { en: "Account approved", es: "Cuenta aprobada", "pt-PT": "Conta aprovada" },
  "Pronto para receber corridas": { en: "Ready to receive rides", es: "Listo para recibir viajes", "pt-PT": "Pronto para receber viagens" },
  "Tudo pronto?": { en: "All set?", es: "¿Todo listo?", "pt-PT": "Tudo pronto?" },
  "Voce esta online": { en: "You are online", es: "Estás online", "pt-PT": "Está online" },
  "Voce esta offline": { en: "You are offline", es: "Estás offline", "pt-PT": "Está offline" },
  "Ficar offline": { en: "Go offline", es: "Desconectarse", "pt-PT": "Ficar offline" },
  "Ficar online": { en: "Go online", es: "Conectarse", "pt-PT": "Ficar online" },
  "Conta e documentos": { en: "Account and documents", es: "Cuenta y documentos", "pt-PT": "Conta e documentos" },
  "Nova corrida disponivel": { en: "New ride available", es: "Nuevo viaje disponible", "pt-PT": "Nova viagem disponível" },
  "Aceitar corrida": { en: "Accept ride", es: "Aceptar viaje", "pt-PT": "Aceitar viagem" },
  "Chamada para negociar valor": { en: "Request to negotiate fare", es: "Solicitud para negociar precio", "pt-PT": "Chamada para negociar valor" },
  "Cliente quer negociar": { en: "Client wants to negotiate", es: "Cliente quiere negociar", "pt-PT": "Cliente quer negociar" },
  "Aceitar valor sugerido": { en: "Accept suggested fare", es: "Aceptar valor sugerido", "pt-PT": "Aceitar valor sugerido" },
  "Proposta enviada": { en: "Offer sent", es: "Propuesta enviada", "pt-PT": "Proposta enviada" },
  "Aguardando resposta": { en: "Waiting for answer", es: "Esperando respuesta", "pt-PT": "A aguardar resposta" },
  "Finalizar demonstracao": { en: "Finish demo", es: "Finalizar demo", "pt-PT": "Finalizar demonstração" },
  "Monetizacao Ride7": { en: "Ride7 monetization", es: "Monetización Ride7", "pt-PT": "Monetização Ride7" },
  "Repasses claros para corridas e planos": {
    en: "Clear splits for rides and plans",
    es: "Repartos claros para viajes y planes",
    "pt-PT": "Repasses claros para viagens e planos",
  },
  "Configure quanto fica com o motorista, plataforma e coproducao. No Firebase/Admin estes percentuais viram campos editaveis por cidade e servico.": {
    en: "Set what goes to the driver, platform and co-production. In Firebase/Admin these percentages become editable fields by city and service.",
    es: "Configura cuánto va al conductor, plataforma y coproducción. En Firebase/Admin estos porcentajes serán campos editables por ciudad y servicio.",
    "pt-PT": "Configure quanto fica com o motorista, plataforma e coprodução. No Firebase/Admin estes percentuais passam a campos editáveis por cidade e serviço.",
  },
  "Repasse liquido da corrida": { en: "Net ride payout", es: "Pago neto del viaje", "pt-PT": "Repasse líquido da viagem" },
  "Operacao, suporte e tecnologia": { en: "Operations, support and technology", es: "Operación, soporte y tecnología", "pt-PT": "Operação, suporte e tecnologia" },
  "Comissao comercial/parceiro": { en: "Commercial/partner commission", es: "Comisión comercial/socio", "pt-PT": "Comissão comercial/parceiro" },
  "Divisao da corrida": { en: "Ride split", es: "División del viaje", "pt-PT": "Divisão da viagem" },
  "Motorista recebe 75%": { en: "Driver receives 75%", es: "Conductor recibe 75%", "pt-PT": "Motorista recebe 75%" },
  "Plataforma 18%": { en: "Platform 18%", es: "Plataforma 18%", "pt-PT": "Plataforma 18%" },
  "Coproducao 7%": { en: "Co-production 7%", es: "Coproducción 7%", "pt-PT": "Coprodução 7%" },
  Plataforma: { en: "Platform", es: "Plataforma", "pt-PT": "Plataforma" },
  Coproducao: { en: "Co-production", es: "Coproducción", "pt-PT": "Coprodução" },
  mensal: { en: "monthly", es: "mensual", "pt-PT": "mensal" },
  "Planos e assinaturas": { en: "Plans and subscriptions", es: "Planes y suscripciones", "pt-PT": "Planos e assinaturas" },
  "Como direcionar no sistema real": { en: "How to route in the real system", es: "Cómo dirigirlo en el sistema real", "pt-PT": "Como direcionar no sistema real" },
  "Ao confirmar pagamento, grave uma transacao com: valor_total, motorista_valor, plataforma_valor, coproducao_valor, tipo_servico, cidade, plano e status de repasse.": {
    en: "When payment is confirmed, save a transaction with: total_value, driver_value, platform_value, coproduction_value, service_type, city, plan and payout_status.",
    es: "Al confirmar el pago, guarda una transacción con: valor_total, valor_conductor, valor_plataforma, valor_coproduccion, tipo_servicio, ciudad, plan y estado_de_reparto.",
    "pt-PT": "Ao confirmar pagamento, grave uma transação com: valor_total, motorista_valor, plataforma_valor, coproducao_valor, tipo_servico, cidade, plano e estado de repasse.",
  },
  "Voltar ao painel": { en: "Back to dashboard", es: "Volver al panel", "pt-PT": "Voltar ao painel" },
  Monetizacao: { en: "Monetization", es: "Monetización", "pt-PT": "Monetização" },
  "Veja o repasse por corrida e por plano antes de operar.": {
    en: "See the split per ride and per plan before operating.",
    es: "Mira el reparto por viaje y por plan antes de operar.",
    "pt-PT": "Veja o repasse por viagem e por plano antes de operar.",
  },
  "Ver comissoes": { en: "See commissions", es: "Ver comisiones", "pt-PT": "Ver comissões" },
};

const phraseKeys = Object.keys(messages);
const translationLookup = phraseKeys.reduce((lookup, key) => {
  const values = { "pt-BR": key, ...messages[key] };
  Object.entries(values).forEach(([language, value]) => {
    lookup[language] ||= {};
    lookup[language][normalizeText(value)] = key;
  });
  return lookup;
}, {});

const languageFromUrl = new URLSearchParams(window.location.search).get("lang");
let activeLanguage = languageFlags[languageFromUrl] ? languageFromUrl : localStorage.getItem(RIDE7_LANGUAGE_KEY) || "pt-BR";
let isApplyingLanguage = false;

function normalizeText(text) {
  return String(text).replace(/\s+/g, " ").trim();
}

function preserveSpacing(original, translated) {
  const leading = String(original).match(/^\s*/)?.[0] || "";
  const trailing = String(original).match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
}

function translatedValue(canonical, language = activeLanguage) {
  return language === "pt-BR" ? canonical : messages[canonical]?.[language] || canonical;
}

function findCanonical(text) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return null;
  }

  for (const language of Object.keys(translationLookup)) {
    if (translationLookup[language][normalized]) {
      return translationLookup[language][normalized];
    }
  }

  return null;
}

function applyTextPatterns(text, language = activeLanguage) {
  let output = text;

  if (language !== "pt-BR") {
    const passwordWord = translatedValue("Senha", language);
    output = output.replace(/Senha:/g, `${passwordWord}:`);
  } else {
    output = output.replace(/Password:|Contraseña:|Palavra-passe:/g, "Senha:");
  }

  return output;
}

function translateTextNode(node, language = activeLanguage) {
  const canonical = findCanonical(node.nodeValue);
  if (canonical) {
    const translated = translatedValue(canonical, language);
    if (normalizeText(node.nodeValue) !== normalizeText(translated)) {
      node.nodeValue = preserveSpacing(node.nodeValue, translated);
    }
    return;
  }

  const patterned = applyTextPatterns(node.nodeValue, language);
  if (patterned !== node.nodeValue) {
    node.nodeValue = patterned;
  }
}

function translateAttributes(element, language = activeLanguage) {
  ["aria-label", "title", "placeholder", "alt", "value"].forEach((attribute) => {
    if (!element.hasAttribute(attribute)) {
      return;
    }

    if (attribute === "value" && element.matches("input, textarea")) {
      return;
    }

    const value = element.getAttribute(attribute);
    const canonical = findCanonical(value);
    if (canonical) {
      element.setAttribute(attribute, translatedValue(canonical, language));
      return;
    }

    const patterned = applyTextPatterns(value, language);
    if (patterned !== value) {
      element.setAttribute(attribute, patterned);
    }
  });
}

function translateHeroDisplay(language = activeLanguage) {
  document.querySelectorAll(".hero-display").forEach((element) => {
    const text = normalizeText(element.textContent).toUpperCase();
    if (text !== "SEU CAMINHO. SUA ESCOLHA." && !findCanonical(text)) {
      return;
    }

    const translated = translatedValue("SEU CAMINHO. SUA ESCOLHA.", language);
    const [first = translated, second = ""] = translated.split(".").map((part) => part.trim()).filter(Boolean);
    element.innerHTML = `${first}.<br /><strong>${second}.</strong>`;
  });
}

function translatePage(language = activeLanguage) {
  isApplyingLanguage = true;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest("script, style, svg, video")) {
        return NodeFilter.FILTER_REJECT;
      }
      return normalizeText(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  nodes.forEach((node) => translateTextNode(node, language));
  document.querySelectorAll("[aria-label], [title], [placeholder], [alt], [value]").forEach((element) => {
    translateAttributes(element, language);
  });
  translateHeroDisplay(language);

  isApplyingLanguage = false;
}

function setRide7Language(language) {
  const selectedLanguage = language || "pt-BR";
  activeLanguage = selectedLanguage;
  localStorage.setItem(RIDE7_LANGUAGE_KEY, selectedLanguage);
  document.documentElement.lang = selectedLanguage;

  document.querySelectorAll("[data-language-switcher]").forEach((switcher) => {
    switcher.querySelectorAll("[data-lang]").forEach((button) => {
      button.classList.toggle("active", button.dataset.lang === selectedLanguage);
      button.setAttribute("aria-pressed", String(button.dataset.lang === selectedLanguage));
    });
    switcher.querySelectorAll("[data-current-flag]").forEach((flag) => {
      flag.className = `flag ${languageFlags[selectedLanguage] || "flag-br"}`;
    });
    switcher.querySelectorAll("[data-current-language]").forEach((label) => {
      label.textContent = languageNames[selectedLanguage] || languageNames["pt-BR"];
    });
    switcher.classList.remove("open");
  });

  translatePage(selectedLanguage);
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-language-trigger]");
  if (trigger) {
    const switcher = trigger.closest("[data-language-switcher]");
    const isOpen = switcher.classList.contains("open");
    document.querySelectorAll("[data-language-switcher].open").forEach((item) => item.classList.remove("open"));
    switcher.classList.toggle("open", !isOpen);
    return;
  }

  const button = event.target.closest("[data-lang]");

  if (button) {
    setRide7Language(button.dataset.lang);
    return;
  }

  document.querySelectorAll("[data-language-switcher].open").forEach((item) => item.classList.remove("open"));
});

const languageObserver = new MutationObserver(() => {
  if (isApplyingLanguage) {
    return;
  }
  window.requestAnimationFrame(() => translatePage(activeLanguage));
});

languageObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true,
});

setRide7Language(activeLanguage);
