import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { ConversationDto, MessageDto, SendMessageRequest } from '@/types';

export function useConversations(includeArchived = false) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['conversations', includeArchived],
    queryFn: async () => {
      const res = await api.get<ConversationDto[]>(`/conversations${includeArchived ? '?archived=true' : ''}`);
      return res.data;
    },
    enabled: !!token,
    refetchInterval: 10000,
  });
}

export function useArchiveConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      await api.post(`/conversations/${id}/archive?archive=${archive}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMessages(bookingId: string) {
  return useQuery({
    queryKey: ['messages', bookingId],
    queryFn: async () => {
      const res = await api.get<MessageDto[]>(`/conversations/${bookingId}/messages`);
      return res.data;
    },
    enabled: !!bookingId,
    refetchInterval: 3000,
  });
}

export function useSendMessage(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SendMessageRequest) => {
      const res = await api.post<MessageDto>(`/conversations/${bookingId}/messages`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
    },
  });
}

export function useEditMessage(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, body }: { messageId: string; body: string }) => {
      const res = await api.patch<MessageDto>(`/messages/${messageId}`, { body });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useDeleteMessage(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: string) => {
      await api.delete(`/messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useSendImageMessage(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<MessageDto>(
        `/conversations/${bookingId}/messages/image`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
    },
  });
}

export function useMarkConversationRead(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post(`/conversations/${bookingId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
    },
  });
}

export function useUnreadMessageCount() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: async () => {
      const res = await api.get<number>('/conversations/unread-count');
      return res.data;
    },
    enabled: !!token,
    refetchInterval: 15000,
  });
}

/** Get or create the admin support conversation for the current user. */
export function useGetOrCreateSupportConversation(enabled: boolean) {
  return useQuery({
    queryKey: ['support-conversation'],
    queryFn: async () => {
      const res = await api.get<import('@/types').ConversationDto>('/support/conversation');
      return res.data;
    },
    enabled,
    staleTime: 30000,
  });
}
