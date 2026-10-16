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

## Publicar o jogo no GitHub Pages

Antes da primeira publicação, um administrador ou mantenedor deve abrir
[Settings → Pages](https://github.com/nicolasgalana-dot/o-gaucho-desafio-da-taca/settings/pages)
e selecionar **GitHub Actions** em **Build and deployment → Source**. O workflow já
existe; não é necessário criar outro pelo modelo sugerido pelo GitHub.

Depois, execute **Actions → Deploy web game to GitHub Pages → Run workflow**,
selecionando `main`. Novos pushes em `main` que alterem `www/**` ou o próprio
workflow também publicam o site automaticamente. O conteúdo publicado é a pasta
`www`, incluindo `www/index.html`, sem etapa de build.

O workflow usa `GITHUB_TOKEN` com `contents: read`, `pages: write` e
`id-token: write` para publicar em um site Pages já habilitado. Essas permissões
não permitem criar o site. Por isso, não use `enablement: true` com esse token.
Se **Configure Pages** informar `Not Found`, confira a configuração inicial acima;
aumentar `contents` para `write`, como no workflow de APK, não resolve essa falha.

Valide que **Configure Pages**, **Upload game** e **Deploy** terminam com sucesso.
O endereço após a publicação é
<https://nicolasgalana-dot.github.io/o-gaucho-desafio-da-taca/>.

## Publicar o jogo na Vercel

Importe o repositório `nicolasgalana-dot/o-gaucho-desafio-da-taca`, usando a branch `main` e mantendo o **Root Directory** na raiz do repositório (`.`).

O arquivo `vercel.json` configura a publicação como site estático (**Other**) e usa `www` como pasta de saída. Os comandos de instalação e build ficam vazios: imagens, áudio e código já estão incluídos em `www/index.html`.

Após o deploy, a página inicial do endereço fornecido pela Vercel abre o jogo diretamente. A versão web pode ser acessada pelo navegador de Android, iPhone, iPad e computador.
