# FriBolos

Sistema web para gerenciamento de confeitaria, desenvolvido como projeto da disciplina de Princípios de Engenharia de Software.

O sistema possui áreas separadas para clientes e administradores, com autenticação, catálogo, pedidos, orçamentos, pagamentos e gerenciamento da confeitaria.

## Tecnologias

* React
* TypeScript
* Vinext/Vite
* CSS
* Supabase
* Stripe

## Requisitos

* Node.js 20 ou superior
* npm
* Git Bash no Windows
* Projeto configurado no Supabase
* Conta Stripe para processamento de pagamentos

## Instalação

1. Clone o repositório utilizando o comando `git clone https://github.com/BraidoLuis/FriBolos.git`.
2. Entre na pasta do projeto utilizando o comando `cd FriBolos`.
3. Instale as dependências utilizando o comando `npm install`.
4. Configure o arquivo `.env.local` com as variáveis necessárias para conexão com o Supabase.
5. Inicie o ambiente de desenvolvimento utilizando o comando `npm run dev`.
6. Abra no navegador o endereço exibido no terminal.

## Validação

Para verificar o código, execute o comando `npm run lint`.

Para gerar o build de produção, execute o comando `npm run build`.

No Windows, esses comandos devem ser executados pelo Git Bash porque os scripts de validação utilizam Bash.

## Funcionalidades do cliente

* Cadastro, login e recuperação de senha
* Atualização do perfil e endereço
* Visualização do catálogo
* Carrinho de compras
* Personalização de produtos
* Solicitação e aprovação de orçamentos
* Pagamento seguro pela Stripe
* Escolha entre entrega e retirada
* Acompanhamento dos pedidos
* Solicitação de cancelamento e reagendamento
* Avaliação de pedidos entregues
* Central de notificações

## Funcionalidades administrativas

* Gerenciamento de produtos e estoque
* Controle de pedidos e produção
* Criação de pedidos para clientes
* Gerenciamento de orçamentos
* Aprovação de cancelamentos e reagendamentos
* Reembolso de pagamentos
* Gerenciamento de clientes
* Indicadores financeiros
* Relatórios e avaliações
* Configurações da confeitaria
* Central de notificações

## Banco de dados

Os dados são persistidos no Supabase. O sistema utiliza autenticação, PostgreSQL, Storage, políticas RLS, funções SQL, triggers e atualizações em tempo real.

## Pagamentos

Os pagamentos são processados pela Stripe por meio de Supabase Edge Functions e webhook para confirmação automática.
