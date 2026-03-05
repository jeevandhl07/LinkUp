import { useInfiniteQuery } from "@tanstack/react-query";
import { messagesApi } from "../api/endpoints";

export const useMessages = (conversationId?: string) => {
  const query = useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) =>
      messagesApi.list(conversationId!, pageParam as string | undefined, 20),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(conversationId),
  });

  return { query };
};
