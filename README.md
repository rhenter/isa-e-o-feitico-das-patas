# Isa e o Feitiço das Patas

Uma aventura de Isa e seu papai Fabiano, transformado em cachorro por um feitiço. Esta edição foi preparada para jogar no Safari do iPhone.

Para jogar no iPhone, acesse o jogo pelo Safari usando uma das opções abaixo: um servidor no computador pela rede Wi-Fi ou um site publicado em HTTPS. Abrir o HTML diretamente no app Arquivos não inicia o jogo no Safari.

## Jogar no Wi-Fi de casa com um computador

1. [Baixe o projeto em ZIP pelo GitHub](https://github.com/rhenter/isa-e-o-feitico-das-patas/archive/refs/heads/main.zip) no computador. Extraia o arquivo e abra a pasta `isa-e-o-feitico-das-patas-main`. Os arquivos precisam estar extraídos antes de continuar.
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

O funcionamento offline não é garantido. Mantenha a conexão com a rede durante o jogo.

Para atualizar uma versão já publicada, envie os arquivos atualizados da pasta `jogo` para a hospedagem.

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

A aventura conta com seis fases, um confronto com o chefe de pedra e uma batalha final contra a bruxa. Com o editor **Course Maker**, você também pode criar suas próprias fases e selecionar **Dupla local** para jogar com Isa e Luz.

A interface respeita as áreas reservadas da tela do iPhone, acompanha a rotação do aparelho e permite usar vários controles por toque ao mesmo tempo. Também inclui um ícone para a Tela de Início e uma trilha sonora que pode ser ativada ou desativada.

A lógica foi verificada por simulação. Ainda falta validação em um iPhone físico.

## Créditos

Este projeto foi criado com o **Course Maker**. Agradecemos aos responsáveis pela ferramenta utilizada na criação do jogo.

## Licença

Este repositório inclui a [licença MIT](LICENSE). Componentes e recursos de terceiros, quando presentes, continuam sujeitos às respectivas licenças e condições de uso. Os créditos ao Course Maker não substituem essas condições.
