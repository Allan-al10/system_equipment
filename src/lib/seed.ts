import type { AppData, DefectEntry, Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  technicianName: '',
  companyName: '',
  phone: '',
  defaultWarrantyDays: 90,
};

interface SeedDefect {
  id: string;
  title: string;
  category: DefectEntry['category'];
  symptoms: string;
  causes: string;
  solution: string;
  tags: string[];
}

const SEED_DEFECTS: SeedDefect[] = [
  {
    id: 'seed-nao-liga',
    title: 'Impressora não liga',
    category: 'Energia',
    symptoms: 'Painel apagado, nenhum LED acende e não há ruído ao ligar.',
    causes:
      'Tomada ou cabo de força sem contato, fonte interna queimada, botão de liga/desliga travado ou fusível da placa aberto.',
    solution:
      'Testar tomada e cabo; conferir o botão; medir a saída da fonte; verificar o fusível e substituir a fonte ou a placa se necessário.',
    tags: ['não liga', 'fonte', 'energia', 'painel'],
  },
  {
    id: 'seed-luzes-piscando',
    title: 'Luzes piscando / erro geral',
    category: 'Energia',
    symptoms:
      'LEDs piscando em sequência, luz de erro fixa ou intermitente e impressora sem responder.',
    causes:
      'Atolamento, tampa aberta, cartucho ausente ou erro de hardware. A quantidade de piscadas costuma indicar o código do defeito.',
    solution:
      'Anotar a sequência de piscadas e consultar o manual do modelo; verificar papel, tampas e cartuchos; reiniciar. Se persistir, testar sensores e a placa controladora.',
    tags: ['luz piscando', 'led', 'erro', 'código'],
  },
  {
    id: 'seed-wifi',
    title: 'Erro de Wi-Fi / não conecta à rede',
    category: 'Conectividade',
    symptoms:
      'LED do Wi-Fi piscando, impressora não aparece na rede e o app não encontra o equipamento.',
    causes:
      'Senha incorreta, rede 5 GHz (muitas impressoras só aceitam 2,4 GHz), WPS desativado, IP alterado ou isolamento de clientes no roteador.',
    solution:
      'Reconfigurar a rede pelo painel ou app; usar 2,4 GHz; resetar a rede da impressora; testar WPS; reservar IP no roteador e atualizar o firmware.',
    tags: ['wifi', 'rede', 'conexão', '2.4ghz'],
  },
  {
    id: 'seed-scanner',
    title: 'Scanner não digitaliza / com defeito',
    category: 'Scanner',
    symptoms:
      'Erro ao digitalizar, faixa escura na cópia, imagem arrastada ou cabeça do scanner não se move.',
    causes:
      'Vidro sujo, cabo flat solto ou rompido, correia ou motor do scanner, cabeça CIS/CCD com defeito ou driver incorreto.',
    solution:
      'Limpar vidro e espelho; testar cópia pelo painel; verificar cabo flat e movimento da cabeça; reinstalar o driver; substituir o conjunto do scanner se necessário.',
    tags: ['scanner', 'digitalizar', 'cópia', 'faixa'],
  },
  {
    id: 'seed-atolamento',
    title: 'Atolamento de papel frequente',
    category: 'Papel',
    symptoms:
      'Papel prende na entrada ou no meio do percurso; erro de atolamento mesmo sem papel visível.',
    causes:
      'Rolete de tração gasto, sensor de papel sujo, fragmentos de papel, umidade ou gramatura fora da especificação.',
    solution:
      'Remover resíduos; limpar roletes e sensores; substituir o pickup roller; orientar o cliente a usar papel seco e dentro da gramatura.',
    tags: ['atolamento', 'papel', 'rolete', 'sensor'],
  },
  {
    id: 'seed-papel-nao-puxa',
    title: 'Papel não é puxado',
    category: 'Papel',
    symptoms:
      'O motor gira, mas o papel não entra, ou são puxadas várias folhas de uma vez.',
    causes:
      'Rolete ressecado, mola do pickup fraca, solenoide travado ou separador de papel gasto.',
    solution:
      'Limpar ou trocar os roletes; verificar mola e solenoide; substituir o kit de tração.',
    tags: ['papel', 'pickup', 'rolete', 'solenoide'],
  },
  {
    id: 'seed-faixas',
    title: 'Impressão com faixas, falhas ou manchas',
    category: 'Impressão',
    symptoms: 'Listras brancas, faixas escuras, manchas repetidas ou texto falhado.',
    causes:
      'Cabeçote entupido ou desalinhado, cartucho/toner com defeito, cilindro riscado ou fusor desgastado.',
    solution:
      'Executar limpeza e alinhamento; testar cartucho/toner novo; verificar cilindro e fusor; substituir o consumível defeituoso.',
    tags: ['faixas', 'manchas', 'cabeçote', 'toner'],
  },
  {
    id: 'seed-branco',
    title: 'Impressão sai em branco',
    category: 'Impressão',
    symptoms:
      'A impressora puxa o papel normalmente, mas a folha sai totalmente em branco.',
    causes:
      'Cartucho/toner vazio ou com lacre, cabeçote entupido, contatos elétricos sujos ou fusor sem aquecimento.',
    solution:
      'Verificar nível e vedação do consumível; limpar contatos; fazer limpeza de cabeçote; testar outro cartucho; verificar fusor.',
    tags: ['branco', 'cartucho', 'toner', 'fusor'],
  },
  {
    id: 'seed-cartucho',
    title: 'Cartucho ou tinta não reconhecido',
    category: 'Consumíveis',
    symptoms: 'Mensagem de cartucho incompatível ou ausente e LED de tinta piscando.',
    causes:
      'Contatos sujos, chip danificado, cartucho não original, firmware bloqueando ou tinta no contato.',
    solution:
      'Limpar os contatos com pano seco; reinstalar o cartucho; testar um cartucho original; verificar atualização de firmware; substituir o cartucho.',
    tags: ['cartucho', 'tinta', 'chip', 'reconhecido'],
  },
  {
    id: 'seed-ruido',
    title: 'Ruído excessivo ou carro travado',
    category: 'Mecânica',
    symptoms: 'Estalo, zumbido forte ou o carro do cabeçote trava em um dos lados.',
    causes:
      'Guia seca ou suja, obstrução no caminho, correia folgada, encoder strip sujo ou engrenagem quebrada.',
    solution:
      'Limpar e lubrificar a guia; remover obstruções; limpar o encoder strip; verificar correia e engrenagens; substituir a peça danificada.',
    tags: ['ruído', 'carro', 'travado', 'guia'],
  },
  {
    id: 'seed-usb',
    title: 'Falha de comunicação USB',
    category: 'Conectividade',
    symptoms:
      'O computador não reconhece a impressora, a impressão não sai ou aparece erro de porta USB.',
    causes:
      'Cabo USB defeituoso ou muito longo, porta USB ruim, driver incorreto ou spooler travado.',
    solution:
      'Testar outro cabo e outra porta; reinstalar o driver; reiniciar o spooler; testar em outro computador.',
    tags: ['usb', 'cabo', 'driver', 'spooler'],
  },
  {
    id: 'seed-fusor',
    title: 'Erro de fusor / aquecimento',
    category: 'Mecânica',
    symptoms: 'Erro de fusor no painel, impressora não aquece ou o toner sai borrado.',
    causes:
      'Fusor queimado, termistor com defeito, fonte de alta tensão ou aquecimento insuficiente.',
    solution:
      'Conferir o código de erro; testar continuidade do fusor e termistor; substituir o fusor; verificar a fonte de alta tensão.',
    tags: ['fusor', 'aquecimento', 'laser', 'termistor'],
  },
  {
    id: 'seed-tampa',
    title: 'Erro de tampa aberta',
    category: 'Mecânica',
    symptoms: 'A impressora acusa tampa aberta mesmo com todas as tampas fechadas.',
    causes: 'Sensor óptico sujo, aba quebrada ou chicote desconectado.',
    solution:
      'Limpar o sensor; verificar a aba e o encaixe; testar a continuidade do chicote e substituir o sensor se necessário.',
    tags: ['tampa', 'sensor', 'erro'],
  },
  {
    id: 'seed-linhas-scanner',
    title: 'Cópia ou digitalização com linhas',
    category: 'Scanner',
    symptoms:
      'Linhas verticais escuras ou coloridas na cópia/digitalização, sempre na mesma posição.',
    causes:
      'Vidro do scanner sujo, poeira no espelho ou pixels mortos na cabeça CIS/CCD.',
    solution:
      'Limpar vidro e espelho; testar em outra resolução; se as linhas persistirem, substituir a cabeça do scanner.',
    tags: ['linhas', 'scanner', 'vidro', 'cis'],
  },
  {
    id: 'seed-rede-nao-encontrada',
    title: 'Impressora não é encontrada na rede',
    category: 'Conectividade',
    symptoms:
      'A impressora está ligada e conectada, mas o computador ou celular não a encontra.',
    causes:
      'IP diferente, impressora em outra rede/VLAN, Bonjour/mDNS bloqueado ou firewall.',
    solution:
      'Imprimir a página de configuração de rede; conferir IP e máscara; testar ping; liberar a descoberta no firewall; cadastrar a impressora pelo IP.',
    tags: ['rede', 'ip', 'ping', 'descoberta'],
  },
];

export function createSeedDefects(now = new Date().toISOString()): DefectEntry[] {
  return SEED_DEFECTS.map((defect) => ({
    ...defect,
    createdAt: now,
    updatedAt: now,
  }));
}

export function createInitialData(): AppData {
  return {
    version: 1,
    orders: [],
    defects: createSeedDefects(),
    settings: { ...DEFAULT_SETTINGS },
  };
}
