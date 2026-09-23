# O Gaúcho — Desafio da Taça

Aplicativo Android do jogo promocional **O Gaúcho — Desafio da Taça**, usado em ativações e degustações no ponto de venda.

## Base atual

- Jogo: V52 aprovada
- Duração: 30 segundos
- Objetivo: 1.000 pontos
- App ID: `com.lsg.ogaucho.desafiodataca`
- Empacotamento: Capacitor 8.5.2
- Android: APK debug instalável gerado pelo GitHub Actions

## Gerar APK no GitHub

A cada `push` na branch `main`, o workflow **Build Android APK** é executado. O APK fica disponível em **Actions → execução mais recente → Artifacts → O-Gaucho-Desafio-da-Taca-APK**.

Também é possível executar manualmente em **Actions → Build Android APK → Run workflow**.

## Publicar o jogo na Vercel

Importe o repositório `nicolasgalana-dot/o-gaucho-desafio-da-taca`, usando a branch `main` e mantendo o **Root Directory** na raiz do repositório (`.`).

O arquivo `vercel.json` configura a publicação como site estático (**Other**) e usa `www` como pasta de saída. Os comandos de instalação e build ficam vazios: imagens, áudio e código já estão incluídos em `www/index.html`.

Após o deploy, a página inicial do endereço fornecido pela Vercel abre o jogo diretamente. A versão web pode ser acessada pelo navegador de Android, iPhone, iPad e computador.
