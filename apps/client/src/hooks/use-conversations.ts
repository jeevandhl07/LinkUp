import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { conversationsApi } from "../api/endpoints";
import { Conversation } from "../types/models";

export const useConversations = () => {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => (await conversationsApi.list()).conversations
  });

  const createDirect = useMutation({
    mutationFn: (userId: string) => conversationsApi.createDirect(userId),
    onSuccess: (data) => {
      queryClient.setQueryData<Conversation[]>(["conversations"], (prev = []) => {
        const exists = prev.some((c) => c._id === data.conversation._id);
        return exists ? prev : [data.conversation, ...prev];
      });
    }
  });

  const createGroup = useMutation({
    mutationFn: (payload: { title: string; avatarUrl?: string; memberIds: string[] }) => conversationsApi.createGroup(payload),
    onSuccess: (data) => {
      queryClient.setQueryData<Conversation[]>(["conversations"], (prev = []) => [data.conversation, ...prev]);
    }
  });

  return { listQuery, createDirect, createGroup };
};