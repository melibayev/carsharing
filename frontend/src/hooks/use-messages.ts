import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ConversationDto, MessageDto, SendMessageRequest } from '@/types';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await api.get<ConversationDto[]>('/conversations');
      return res.data;
    },
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const res = await api.get<MessageDto[]>(`/conversations/${conversationId}/messages`);
      return res.data;
    },
    enabled: !!conversationId,
    refetchInterval: 5000,
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SendMessageRequest) => {
      const res = await api.post<MessageDto>(`/conversations/${conversationId}/messages`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
