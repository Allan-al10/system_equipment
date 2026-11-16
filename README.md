# TecInfo

Aplicativo de gestão de ordens de serviço para assistência técnica, construído com Expo Router.

## Requisitos

- Node.js 22.13 ou superior
- npm
- **Expo Go atualizado** no celular (versão mais recente, com suporte ao SDK 58)
- Celular e computador na mesma rede Wi-Fi (ou uso de túnel)

## Instalação

```bash
npm install
```

## Testar no Expo Go (versão mais recente)

O projeto está no **Expo SDK 58**, que é exatamente o SDK suportado pela versão mais recente do Expo Go. Todas as bibliotecas nativas usadas estão incluídas no Expo Go, então não é necessário gerar um development build.

1. Atualize o **Expo Go** na Google Play Store (Android) ou App Store (iOS). A versão precisa ser a mais recente, compatível com o SDK 58.
2. Faça login na sua conta Expo no terminal:

   ```bash
   npx expo login
   ```

3. Abra o Expo Go no celular e entre com **a mesma conta** (toque no avatar no canto superior direito). O login é obrigatório no Expo Go para iOS físico e recomendado no Android.
4. Inicie o servidor forçando o modo Expo Go:

   ```bash
   npm run start:go
   ```

5. Escaneie o QR code:
   - **Android:** abra o Expo Go e use a opção de escanear QR code.
   - **iOS:** use o app Câmera.

Se o celular não estiver na mesma rede do computador, use o túnel (requer login na conta Expo):

```bash
npm run start:go:tunnel
```

> Dica: se o QR code não conectar, rode `npx expo start --go --clear` para limpar o cache do Metro.

O Expo Go é indicado para desenvolvimento e testes. Para publicar o app ou usar um módulo nativo que não esteja incluído no Expo Go, será necessário criar um development build (`npx expo run:android`, `npx expo run:ios` ou `eas build --profile development`).

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run start` | Inicia o servidor de desenvolvimento (Expo Go por padrão) |
| `npm run start:go` | Inicia o servidor explicitamente em modo Expo Go |
| `npm run start:go:tunnel` | Inicia em modo Expo Go usando túnel |
| `npm run android` | Abre no Android (dispositivo ou emulador) |
| `npm run ios` | Abre no simulador iOS |
| `npm run web` | Abre no navegador |
| `npm run lint` | Executa o ESLint |
| `npm run typecheck` | Verifica os tipos TypeScript |
| `npm run doctor` | Diagnostica dependências e configuração do Expo |
| `npm run export:web` | Gera o export web |

## Verificações antes de concluir uma alteração

```bash
npm run lint
npm run typecheck
npm run doctor
```

Para checar se as dependências continuam compatíveis com o SDK:

```bash
npx expo install --check
```

## Pendências

O app reúne em **Pendências** dois tipos de acompanhamento:

- **Serviços atrasados:** toda OS com prazo de entrega vencido, ainda não entregue e não recusada.
- **Garantias a fazer:** marcação manual no detalhe da OS para retornos e serviços em garantia pendentes.

O prazo padrão de novas OS é definido em **Ajustes** (0 desativa o prazo automático) e pode ser ajustado em cada OS. O filtro **Pendências** fica disponível na lista de ordens, e o Início mostra um resumo com a quantidade de atrasos e garantias a fazer.

## Registros

A aba **Registros** reúne o histórico dos serviços que saíram do fluxo ativo, com uma ficha somente leitura contendo cliente, equipamento, defeito, diagnóstico, orçamento, serviço realizado, garantia, datas e histórico completo.

- **Entregues:** OS com status **Pronto** e entrega registrada. É o grupo usado para consultar o serviço em retornos e garantias.
- **Aguardando entrega:** OS com status **Pronto** ainda não entregues. Saem deste grupo e passam para **Entregues** quando a entrega é registrada.
- **Cancelada:** OS com status **Recusado**, com a data de cancelamento registrada.

A lista permite buscar por cliente, equipamento, número da OS, nº de série ou serviço e filtrar entre **Todos**, **Entregues**, **Aguardando entrega** e **Cancelados**. A busca pelo nº de série ajuda a localizar o histórico do equipamento em retornos e garantias. O botão **Ver registro** no detalhe de uma OS pronta ou cancelada abre a mesma ficha. Para alterar dados ou registrar a entrega, use **Abrir OS original** dentro do registro.

## Estrutura

- `src/app/` — rotas do Expo Router (telas e layouts)
- `src/components/` — componentes reutilizáveis
- `src/lib/` — armazenamento local, contexto de dados, formatação e utilitários
