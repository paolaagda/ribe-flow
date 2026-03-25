// Dynamic message variation system
// Each type has 4-5 templates; getRandomMessage avoids consecutive repeats

type MessageContext = {
  parceiro?: string;
  nome?: string;
  hora?: string;
  data?: string;
};

const templates: Record<string, string[]> = {
  invite: [
    'Você foi convidado para uma visita com {parceiro}',
    'Novo convite: visita com {parceiro}',
    'Tem uma visita te esperando com {parceiro}',
    'Você foi incluído em uma agenda com {parceiro}',
    '{nome} te convidou para uma visita com {parceiro}',
  ],
  invite_detail: [
    '{nome} te convidou para uma visita com {parceiro} em {data} às {hora}',
    'Convite de {nome}: {parceiro} — {data} às {hora}',
    'Você foi chamado por {nome} para visitar {parceiro} em {data}',
    '{nome} agendou uma visita com {parceiro} e te incluiu — {data} às {hora}',
  ],
  accept: [
    'Você confirmou participação',
    'Presença confirmada',
    'Você agora faz parte da agenda',
    'Participação aceita com sucesso',
  ],
  reject: [
    'Você recusou o convite',
    'Participação cancelada',
    'Você não participará dessa visita',
    'Convite recusado',
  ],
  remove: [
    'Você foi removido da agenda',
    'Agenda removida do seu calendário',
    'Você saiu da agenda',
    'Participação encerrada',
  ],
  toast_invite: [
    'Novo convite recebido!',
    'Tem novidade na sua agenda!',
    'Alguém te chamou para uma visita!',
    'Convite pendente — confira!',
  ],
  empty_inbox: [
    'Tudo tranquilo por aqui',
    'Nenhuma novidade no momento',
    'Quando alguém te convidar, aparecerá aqui',
  ],
};

const lastUsedIndex: Record<string, number> = {};

function interpolate(template: string, context: MessageContext): string {
  return template
    .replace(/\{parceiro\}/g, context.parceiro || '')
    .replace(/\{nome\}/g, context.nome || '')
    .replace(/\{hora\}/g, context.hora || '')
    .replace(/\{data\}/g, context.data || '');
}

export function getRandomMessage(type: string, context: MessageContext = {}): string {
  const pool = templates[type];
  if (!pool || pool.length === 0) return '';

  let idx: number;
  do {
    idx = Math.floor(Math.random() * pool.length);
  } while (pool.length > 1 && idx === lastUsedIndex[type]);

  lastUsedIndex[type] = idx;
  return interpolate(pool[idx], context);
}

export function getEmptyStateMessage(): string {
  return getRandomMessage('empty_inbox');
}
