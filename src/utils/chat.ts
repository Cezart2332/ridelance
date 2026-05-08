import type { ChatMessageDto } from '../services/chat.service';

export interface MessageGroup {
  date: string;
  messages: ChatMessageDto[];
}

export function groupMessagesByDate(messages: ChatMessageDto[]): MessageGroup[] {
  // First ensure they are sorted by date
  const sorted = [...messages].sort((a, b) => 
    new Date(a.sentAtUtc).getTime() - new Date(b.sentAtUtc).getTime()
  );

  const groups: MessageGroup[] = [];
  
  sorted.forEach(msg => {
    const date = new Date(msg.sentAtUtc);
    const dateStr = date.toLocaleDateString('ro-RO', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    // Check for "Today" or "Yesterday"
    const now = new Date();
    const today = now.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });

    let displayDate = dateStr;
    if (dateStr === today) displayDate = 'Azi';
    else if (dateStr === yesterdayStr) displayDate = 'Ieri';

    let group = groups.find(g => g.date === displayDate);
    if (!group) {
      group = { date: displayDate, messages: [] };
      groups.push(group);
    }
    group.messages.push(msg);
  });

  return groups;
}
