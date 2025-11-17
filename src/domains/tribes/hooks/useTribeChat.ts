import { useTribeChatMessages, useSendTribeMessage } from './useTribeChannels';
import { useTribeChatRealtime } from './useTribeRealtime';
import { useAppStore } from '@/store/appStore';

/**
 * Combined hook for tribe chat functionality
 */
export function useTribeChat(channelId: string) {
  const { user } = useAppStore();
  const { data: messages, isLoading } = useTribeChatMessages(channelId);
  const sendMessage = useSendTribeMessage();
  useTribeChatRealtime(channelId);

  const handleSendMessage = async (message: string) => {
    if (!user?.id || !channelId || !message.trim()) return;

    await sendMessage.mutateAsync({
      channel_id: channelId,
      user_id: user.id,
      message: message.trim(),
    });
  };

  return {
    messages: messages || [],
    isLoading,
    sendMessage: handleSendMessage,
    isSending: sendMessage.isPending,
  };
}

