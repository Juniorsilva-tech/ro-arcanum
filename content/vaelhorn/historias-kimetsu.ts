// ARCANUM · Histórias dos caçadores e de quem vive em volta deles (sessão
// 47, Fase 3). O ponto de partida é o cânone que o projeto importou
// (content/vaelhorn/kimetsu.ts), adaptado ao lugar onde eles estão aqui: a
// Casa Sem Nome na Névoa, a Mata de Corvos, a estrada do sal.
import type { HistoriaNpc } from '../../engine/types';

export const HISTORIAS_KIMETSU: Record<string, HistoriaNpc> = {
  tanjiro: {
    origem: 'Filho mais velho de carvoeiros de montanha. Desde que o pai morreu, descia à vila para vender carvão e sustentar a mãe e cinco irmãos.',
    ferida: 'Voltou de uma dessas descidas e encontrou a casa aberta e a família morta na neve, com uma só irmã respirando.',
    desejo: 'Levar Nezuko de volta para a casa da montanha e reconstruir o que dá para reconstruir.',
    medo: 'Chegar tarde outra vez.',
  },
  nezuko: {
    origem: 'Filha mais velha de Kie Kamado, a que cuidava dos irmãos menores quando o irmão descia à vila.',
    ferida: 'Sobreviveu à noite em que a família morreu e lembra de quase nada dela, só do cheiro do irmão chegando.',
    desejo: 'Que o irmão durma uma noite inteira sem acordar para olhar se ela está ali.',
    medo: 'Perder o irmão de vista numa multidão.',
  },
  giyu: {
    origem: 'Discípulo de Sakonji Urokodaki no morro da Torre do Vigia, recolhido depois que a irmã mais velha morreu.',
    ferida: 'A irmã o escondeu de um oni na véspera do próprio casamento e não sobreviveu à noite.',
    desejo: 'Merecer o lugar que ocupa entre os caçadores, coisa que ele acha que não merece.',
    medo: 'Que um discípulo novo de Urokodaki morra onde ele sobreviveu.',
  },
  gyomei: {
    origem: 'Monge cego de um templo de montanha antes de ser caçador. Pegou a espada tarde, com as mãos que tinha.',
    ferida: 'Aprendeu cedo que gente com medo acusa quem sobrevive, e passou uma temporada numa cela esperando uma sentença.',
    desejo: 'Que as crianças da Casa Sem Nome na Névoa cresçam sem precisar de espada.',
    medo: 'Desconfiar de uma criança.',
  },
  shinobu: {
    origem: 'Filha caçula de boticários. Aprendeu venenos na botica dos pais antes de aprender a segurar uma lâmina.',
    ferida: 'Os pais foram mortos por um oni dentro de casa, e as duas irmãs juraram, na mesma noite, caçar juntas.',
    desejo: 'Um veneno que nenhum oni aguente, testado em algo que não seja a irmã.',
    medo: 'Ver Kanae sair sozinha para caçar.',
  },
  kanae: {
    origem: 'A mais velha das Kocho, Hashira da Flor. Criou a irmã e escolheu a terceira num mercado de gente.',
    ferida: 'Viu os pais morrerem e decidiu, na mesma noite, ser gentil com qualquer oni que aceitasse gentileza.',
    desejo: 'Que um oni, um só, aceite ajuda antes de ela morrer.',
    medo: 'Que Shinobu se perca na raiva que esconde atrás do sorriso.',
  },
  kanao: {
    origem: 'Vendida pelos pais quando menina e comprada de volta pelas irmãs Kocho num mercado de gente. Criada na Casa Sem Nome na Névoa.',
    ferida: 'Aprendeu a não sentir nada, porque na casa dos pais sentir apanhava.',
    desejo: 'Decidir alguma coisa sozinha, uma vez, e descobrir que decidiu bem.',
    medo: 'Precisar escolher entre as duas irmãs.',
  },
  rengoku: {
    origem: 'Primogênito dos Rengoku, criado no dojo da família com os livros das Chamas e com um irmão caçula para cuidar.',
    ferida: 'Treinou sozinho, com os livros da família, depois que o pai fechou o dojo e a garrafa virou a companhia dele.',
    desejo: 'Que Senjuro ache um caminho próprio, com espada ou sem.',
    medo: 'Morrer antes de o pai responder uma carta.',
  },
  shinjuro: {
    origem: 'Cabeça dos Rengoku e ex-Hashira das Chamas. Treinou os dois filhos até o dia em que parou.',
    ferida: 'Largou o posto e a espada numa manhã, sem explicar a ninguém, e nunca mais conseguiu voltar ao dojo.',
    desejo: 'Que os filhos não morram tentando ser o que ele não conseguiu.',
    medo: 'Ser lembrado pelo que foi.',
  },
  muichiro: {
    origem: 'Descendente de uma linhagem antiga de espadachins. Cortava lenha nas montanhas até os caçadores o encontrarem.',
    ferida: 'Chegou à Casa Sem Nome ferido e em silêncio, e ninguém sabe direito de quê.',
    desejo: 'Lembrar de alguma coisa que valha a pena lembrar.',
    medo: 'Esquecer o nome de quem luta ao lado dele.',
  },
  mitsuri: {
    origem: 'Filha de uma família grande e comum de cidade, a mais forte de cinco irmãos desde que aprendeu a andar.',
    ferida: 'Cresceu ouvindo que era demais: comia demais, ria demais, pesava demais, queria demais.',
    desejo: 'Encontrar alguém que não ache nada disso demais.',
    medo: 'Ser deixada para trás por ser grande.',
  },
  obanai: {
    origem: 'Chegou aos caçadores menino, com uma cobra branca no ombro e sem dizer de onde vinha.',
    ferida: 'Tem uma cicatriz na boca que não deixa ninguém ver, e nunca come na frente dos outros.',
    desejo: 'Ser limpo o bastante, um dia, para ficar perto de Mitsuri sem vergonha.',
    medo: 'Ser tocado sem aviso.',
  },
  sanemi: {
    origem: 'Mais velho de sete irmãos de uma casa pobre, criado protegendo os menores de um pai violento.',
    ferida: 'Perdeu quase toda a família numa noite só e saiu dela com o irmão Genya e uma raiva que não passou.',
    desejo: 'Que Genya largue a espada e viva até ficar velho e chato.',
    medo: 'Ver Genya morrer na frente dele.',
  },
  genya: {
    origem: 'Irmão mais novo de Sanemi, sobrevivente da mesma noite. Entrou para os caçadores sem conseguir nenhuma respiração.',
    ferida: 'O corpo não aceitou respiração nenhuma, e ele aprendeu a lutar com arma de fogo, lâmina curta e teimosia.',
    desejo: 'Ouvir o irmão chamá-lo pelo nome, sem gritar.',
    medo: 'Ser mandado embora de novo.',
  },
  tengen: {
    origem: 'Filho de uma família de shinobi do sul. Fugiu de casa aos quinze com as três noivas que a família lhe deu.',
    ferida: 'Deixou para trás um irmão caçula que ficou com a casa e com o jeito da casa.',
    desejo: 'Uma vida espalhafatosa, longa e sem missão, com as três.',
    medo: 'Enterrar uma das três.',
  },
  zenitsu: {
    origem: 'Órfão, endividado aos dezesseis por uma mulher que fugiu com o dinheiro dele. Jigoro Kuwajima pagou a dívida e o levou para treinar.',
    ferida: 'Todo mundo que o treinou antes do mestre desistiu dele, e ele ainda acha que o mestre vai desistir.',
    desejo: 'Casar e viver o resto da vida sem ver um oni.',
    medo: 'Decepcionar o mestre, mais do que qualquer oni.',
  },
  inosuke: {
    origem: 'Criado por javalis na montanha, sem saber de pai nem de mãe. Usa a cabeça de um javali como máscara.',
    ferida: 'Aprendeu a falar tarde, com caçadores, e troca o nome de todo mundo até hoje.',
    desejo: 'Ser o mais forte e provar isso a cada pessoa que encontra.',
    medo: 'Não entender por que a gentileza dos outros o deixa fraco.',
  },
  kagaya: {
    origem: 'Chefe dos Ubuyashiki desde menino. Comanda os caçadores de dentro da Casa Sem Nome na Névoa.',
    ferida: 'A doença da família começou a comer o rosto dele aos dezenove, como começou no pai.',
    desejo: 'Ver o fim da caçada antes de fazer trinta anos.',
    medo: 'Deixar a doença para os filhos.',
  },
  amane: {
    origem: 'Filha de uma família de sacerdotes, escolhida para casar com o herdeiro dos Ubuyashiki.',
    ferida: 'Aceitou o casamento sabendo que ficaria viúva cedo, e ninguém perguntou se ela queria.',
    desejo: 'Que os cinco filhos cresçam sem a doença.',
    medo: 'Ficar sozinha na casa quando ele se for.',
  },
  urokodaki: {
    origem: 'Ex-Hashira da Água. Vive numa cabana no morro da Torre do Vigia, fora do vale, e treina discípulos para a prova da montanha.',
    ferida: 'Treinou discípulos por trinta anos e parou de contar quantos voltaram da primeira caçada.',
    desejo: 'Um discípulo que envelheça e venha visitá-lo de cabelo branco.',
    medo: 'Mandar outro menino para a montanha antes da hora.',
  },
  jigoro: {
    origem: 'Ex-Hashira do Trovão, com uma perna de pau desde a luta que o aposentou.',
    ferida: 'Treinou dois discípulos que se odiavam, e não conseguiu que um enxergasse o valor do outro.',
    desejo: 'Que os dois discípulos se entendam antes de ele morrer.',
    medo: 'Ter falhado com um dos dois.',
  },
  sabito: {
    origem: 'Discípulo de Urokodaki, órfão recolhido no morro e irmão de treino de Giyu.',
    ferida: 'Não voltou da montanha da prova, e Giyu voltou.',
    desejo: 'Que os discípulos novos voltem da montanha, todos eles.',
    medo: 'Ver outro menino subir a montanha despreparado.',
  },
  makomo: {
    origem: 'Discípula de Urokodaki, a menor da turma dela. Corrige postura e respiração no morro ao entardecer.',
    ferida: 'Ficou no morro depois da prova para ensinar o que ninguém teve tempo de ensinar a ela.',
    desejo: 'Ver uma aluna dela descer da montanha viva.',
    medo: 'Esquecer o rosto do mestre.',
  },
  tamayo: {
    origem: 'Médica de uma cidade que não existe mais. Vive escondida na Mina de Ferro abandonada, fora do vale, com um assistente.',
    ferida: 'Perdeu a família há mais tempo do que qualquer pessoa viva do vale consegue lembrar.',
    desejo: 'Desfazer a condição de oni em alguém, qualquer um.',
    medo: 'Ser encontrada por quem a fez.',
  },
  yushiro: {
    origem: 'Assistente de Tamayo há mais anos do que ele consegue contar. Pinta, cuida da casa e vigia a porta.',
    ferida: 'Não sabe mais contar os anos, e só se lembra de ter começado a contá-los perto dela.',
    desejo: 'Que Tamayo termine a pesquisa e descanse.',
    medo: 'Um mundo sem ela.',
  },
};
