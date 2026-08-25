<div align="center">
  <img
    src="./public/FaviconFribolos.png"
    alt="Logo do FriBolos"
    width="140"
  />

**# FriBolos**

Plataforma web para gerenciamento de confeitaria, encomendas e relacionamento com clientes.

[Acessar aplicação](https://fri-bolos.vercel.app/) • [Ver catálogo](https://fri-bolos.vercel.app/catalogo)

</div>

**## Sobre o projeto**

O FriBolos foi desenvolvido como projeto da disciplina de Princípios de Engenharia de Software.

A aplicação reúne uma página pública para apresentação da confeitaria, um portal exclusivo para clientes e um painel administrativo completo.

O sistema permite divulgar produtos, receber encomendas, solicitar orçamentos personalizados, processar pagamentos e acompanhar todas as etapas dos pedidos.

**## Áreas da aplicação**

**### Página pública**

Visitantes não autenticados podem:

* Conhecer a confeitaria;

* Visualizar produtos em destaque;

* Consultar avaliações de compras verificadas;

* Acessar perguntas frequentes;

* Consultar horários e informações de contato;

* Acessar o catálogo completo;

* Ler a Política de Privacidade e os Termos de Uso;

* Entrar ou criar uma conta para fazer encomendas.

**### Portal do cliente**

Clientes autenticados podem:

* Criar e acessar sua conta;

* Recuperar e atualizar a senha;

* Atualizar os dados do perfil e endereço;

* Visualizar e pesquisar produtos no catálogo;

* Filtrar produtos por categoria;

* Adicionar produtos ao carrinho;

* Personalizar produtos;

* Escolher entre entrega e retirada;

* Selecionar data e horário;

* Realizar pagamentos pela Stripe;

* Acompanhar os pedidos e suas etapas;

* Solicitar cancelamento;

* Solicitar reagendamento;

* Criar solicitações de orçamento;

* Aprovar ou recusar propostas;

* Avaliar pedidos entregues;

* Consultar notificações em tempo real.

**### Painel administrativo**

Administradores podem:

* Gerenciar produtos e categorias;

* Controlar produtos ativos, arquivados e em destaque;

* Organizar a ordem dos produtos em destaque;

* Atualizar o estoque;

* Acompanhar pedidos;

* Controlar as etapas de produção;

* Criar pedidos para clientes;

* Responder solicitações de orçamento;

* Aprovar cancelamentos e reagendamentos;

* Efetuar reembolsos;

* Gerenciar clientes;

* Consultar indicadores financeiros;

* Acompanhar relatórios e avaliações;

* Configurar dados, horários e funcionamento da confeitaria;

* Receber notificações em tempo real.

**## Tecnologias**

**### Front-end**

* React 19;

* TypeScript;

* Vinext;

* Vite;

* Next.js APIs compatíveis por meio do Vinext;

* CSS;

* Tailwind CSS.

**### Back-end e infraestrutura**

* Supabase;

* PostgreSQL;

* Supabase Authentication;

* Supabase Storage;

* Supabase Realtime;

* Supabase Edge Functions;

* Stripe;

* Vercel.

**### Testes e qualidade**

* Vitest;

* React Testing Library;

* Testing Library User Event;

* JSDOM;

* ESLint;

* TypeScript.

**## Testes automatizados**

O projeto possui mais de 400 testes automatizados, distribuídos entre testes unitários, testes de componentes e testes de hooks com integrações simuladas.

Entre os fluxos testados estão:

* Validação de senhas;

* Formatação e transformação de dados;

* Autenticação e restauração de sessão;

* Recuperação de senha;

* Catálogo e filtros;

* Carrinho de compras;

* Pagamentos;

* Entrega e retirada;

* Validações de endereço, data e horário;

* Pedidos administrativos;

* Atualização de estoque;

* Orçamentos;

* Cancelamentos, reagendamentos e reembolsos;

* Notificações e atualizações em tempo real;

* Avaliações;

* Configurações da loja;

* Aviso de armazenamento local.

Para executar os testes, utilize o comando `npm test`.

Para manter os testes em execução durante o desenvolvimento, utilize o comando `npm run test:watch`.

Para executar o teste de fumaça sobre o build de produção, utilize o comando `npm run test:smoke`.

**## Segurança e proteção de dados**

O sistema utiliza recursos de segurança do Supabase, incluindo:

* Autenticação de usuários;

* Controle de acesso baseado em funções;

* Políticas de Row Level Security;

* Funções SQL com permissões controladas;

* URLs temporárias para arquivos privados;

* Validação de dados no front-end e no banco;

* Proteção de rotas e operações administrativas;

* Limitação dos dados expostos publicamente.

O projeto também possui:

* Política de Privacidade;

* Termos de Uso;

* Aviso sobre armazenamento local;

* Limites de caracteres em campos de texto;

* Validações para valores, quantidades, datas e horários.

**## Banco de dados**

Os dados são persistidos no PostgreSQL por meio do Supabase.

A aplicação utiliza:

* Tabelas relacionais;

* Políticas RLS;

* Funções SQL;

* Triggers;

* Storage;

* Autenticação;

* Atualizações em tempo real;

* Funções RPC;

* Edge Functions.

As operações sensíveis são realizadas no banco ou em funções protegidas, evitando depender exclusivamente de validações no navegador.

**## Pagamentos**

Os pagamentos são processados pela Stripe.

A integração utiliza Supabase Edge Functions para criação das sessões de pagamento e processamento de reembolsos.

A confirmação dos pagamentos é feita por webhook, permitindo que o sistema atualize automaticamente o pedido após a resposta da Stripe.

**## SEO e páginas públicas**

O projeto possui:

* Metadados para mecanismos de busca;

* URLs canônicas;

* Metadados Open Graph;

* Metadados para Twitter Card;

* `robots.txt`;

* `sitemap.xml`;

* `llms.txt`;

* Verificação no Google Search Console;

* Página personalizada de erro 404;

* Política de Privacidade;

* Termos de Uso.

**## Requisitos**

Antes de iniciar, é necessário possuir:

* Node.js 22.13.0 ou superior;

* npm;

* Git;

* Um projeto configurado no Supabase;

* Uma conta Stripe para processamento de pagamentos.

**## Instalação**

1. Clone o repositório utilizando o comando `git clone https://github.com/BraidoLuis/FriBolos.git\`.

2. Entre na pasta do projeto utilizando o comando `cd FriBolos`.

3. Instale as dependências utilizando o comando `npm install`.

4. Crie o arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

`VITE_SUPABASE_URL=URL_DO_PROJETO_SUPABASE`

`VITE_SUPABASE_PUBLISHABLE_KEY=CHAVE_PUBLICAVEL_DO_SUPABASE`

5. Inicie o ambiente de desenvolvimento utilizando o comando `npm run dev`.

6. Abra no navegador o endereço exibido no terminal.

**## Scripts disponíveis**

| Comando                | Descrição                               |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Inicia o ambiente de desenvolvimento    |
| `npm run build`        | Gera o build de produção                |
| `npm run build:vercel` | Gera o build utilizado pela Vercel      |
| `npm run start`        | Inicia a aplicação pelo Vinext          |
| `npm test`             | Executa toda a suíte de testes          |
| `npm run test:watch`   | Executa os testes em modo de observação |
| `npm run test:smoke`   | Gera o build e testa o HTML renderizado |
| `npm run lint`         | Analisa o código com ESLint             |
| `npm run check`        | Executa lint, testes e teste de fumaça  |

**## Validação completa**

Antes de publicar alterações, execute o comando `npm run check`.

Esse comando executa:

1. Análise do código com ESLint;

2. Toda a suíte de testes do Vitest;

3. Build de produção;

4. Teste de fumaça do HTML renderizado.

**## Estrutura principal**

`FriBolos/`

`├── app/`

`│   ├── components/`

`│   │   ├── admin/`

`│   │   ├── auth/`

`│   │   ├── client/`

`│   │   └── public/`

`│   ├── contexts/`

`│   ├── hooks/`

`│   ├── lib/`

`│   ├── politica-de-privacidade/`

`│   ├── termos-de-uso/`

`│   ├── types/`

`│   ├── globals.css`

`│   ├── layout.tsx`

`│   ├── not-found.tsx`

`│   └── page.tsx`

`├── public/`

`├── tests/`

`├── worker/`

`├── package.json`

`├── vite.config.ts`

`├── vitest.config.ts`

`└── tsconfig.json`

**## Deploy**

A aplicação está publicada na Vercel:

https://fri-bolos.vercel.app/

O catálogo público pode ser acessado em:

https://fri-bolos.vercel.app/catalogo

**## Próximas evoluções**

Algumas melhorias planejadas para versões futuras:

* Testes E2E com Playwright;

* Imagem personalizada para compartilhamento em redes sociais;

* Dados estruturados para mecanismos de busca;

* Novas análises de acessibilidade;

* Otimizações adicionais de desempenho;

* Configuração de domínio próprio.
