import { supabase } from '@/core/database/supabase';
import { Tables, TablesInsert, TablesUpdate } from '@/core/database/database.types';

export type TribeChannel = Tables<'tribe_channels'>;
export type TribeChannelInsert = TablesInsert<'tribe_channels'>;
export type TribeChannelUpdate = TablesUpdate<'tribe_channels'>;

export type TribeChatMessage = Tables<'tribe_chat_messages'>;
export type TribeChatMessageInsert = TablesInsert<'tribe_chat_messages'>;

export interface TribeChatMessageWithAuthor extends TribeChatMessage {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  channel_name: string;
}

export class TribeChannelService {
  /**
   * Get channels for a tribe
   */
  static async getTribeChannels(tribeId: string): Promise<TribeChannel[]> {
    try {
      const { data, error } = await supabase
        .from('tribe_channels')
        .select('*')
        .eq('tribe_id', tribeId)
        .order('type', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tribe channels:', error);
      throw error;
    }
  }

  /**
   * Get channel by ID
   */
  static async getChannel(channelId: string): Promise<TribeChannel | null> {
    try {
      const { data, error } = await supabase
        .from('tribe_channels')
        .select('*')
        .eq('id', channelId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching channel:', error);
      return null;
    }
  }

  /**
   * Create a new channel
   */
  static async createChannel(channelData: TribeChannelInsert): Promise<TribeChannel> {
    try {
      const { data, error } = await supabase
        .from('tribe_channels')
        .insert(channelData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  }

  /**
   * Update channel
   */
  static async updateChannel(channelId: string, updates: TribeChannelUpdate): Promise<TribeChannel> {
    try {
      const { data, error } = await supabase
        .from('tribe_channels')
        .update(updates)
        .eq('id', channelId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating channel:', error);
      throw error;
    }
  }

  /**
   * Delete channel
   */
  static async deleteChannel(channelId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tribe_channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting channel:', error);
      throw error;
    }
  }

  /**
   * Get messages for a channel
   */
  static async getChannelMessages(channelId: string, limit = 50): Promise<TribeChatMessageWithAuthor[]> {
    try {
      const { data, error } = await supabase
        .from('tribe_chat_messages_with_author')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as TribeChatMessageWithAuthor[];
    } catch (error) {
      console.error('Error fetching channel messages:', error);
      throw error;
    }
  }

  /**
   * Send a message to a channel
   */
  static async sendMessage(messageData: TribeChatMessageInsert): Promise<TribeChatMessage> {
    try {
      const { data, error } = await supabase
        .from('tribe_chat_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
}

