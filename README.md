# Isa e o Feitiço das Patas

As Aventuras de Papai Fabiano e sua filhinha Isa, em uma edição preparada para o Safari no iPhone.

O pacote não é um aplicativo IPA da App Store. Abrir o ZIP ou o HTML no app Arquivos não instala nem executa esta edição como jogo no Safari.

## Jogar no Wi-Fi de casa com um computador

1. Extraia o ZIP no computador; não deixe os arquivos dentro do ZIP.
2. Instale o [Python 3](https://www.python.org/downloads/), se necessário.
3. Inicie o servidor:
   - **Windows:** abra `INICIAR-NO-WINDOWS.bat`.
   - **Mac:** execute no Terminal, dentro da pasta do projeto:

     ```sh
     python3 jogar-no-wifi.py
     ```

4. Mantenha o computador e o iPhone na mesma rede Wi-Fi.
5. No Safari do iPhone, digite um dos endereços exibidos na janela do computador.
6. Toque em **Começar aventura**. Vire o iPhone na horizontal para ter mais espaço.
7. Deixe a janela do computador aberta enquanto joga. Para encerrar o servidor, pressione `Ctrl+C`.

A rede precisa permitir a comunicação entre os aparelhos. Se o Windows solicitar, permita o Python na rede privada. Essa opção funciona enquanto o computador está ligado e não gera um link público.

## Publicar em HTTPS e adicionar à Tela de Início

A pasta `jogo` contém os arquivos prontos para uma hospedagem de site estático. Depois de publicar em HTTPS:

1. Abra o endereço no Safari do iPhone.
2. Toque em **Compartilhar** e em **Adicionar à Tela de Início**.
3. Se aparecer a opção **Abrir como App da Web**, ative-a.

Esta edição não promete funcionamento offline: mantenha acesso à rede.

A publicação atualizada no Sites ficou bloqueada pelo ambiente. O pacote não atualiza automaticamente o jogo disponível no link online anterior.

## Controles na tela

| Controle | Ação |
| --- | --- |
| ◀ / ▶ | Andar |
| ↑ | Pular; toque outra vez no ar para salto duplo |
| Giro | Atacar e quebrar cápsulas |
| AU! | Latido, suporte e ressonadores |
| RAIO | Ataque da montaria, liberada ao completar a barra de oito estrelas |
| Ⅱ | Pausar |
| ♪ | Ativar ou desativar o som |

## Conteúdo e suporte ao iPhone

Esta versão inclui as seis fases, o chefe de pedra, a bruxa final reforçada e o **Course Maker**. No criador, escolha **Dupla local** para jogar com Isa e Luz.

Também inclui área segura para iPhone, tela que acompanha a rotação, multitoque, ícone de Tela de Início e trilha controlada por Web Audio.

A lógica foi verificada por simulação. Ainda falta validação em um iPhone físico.
