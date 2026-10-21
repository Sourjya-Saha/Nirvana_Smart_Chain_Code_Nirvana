import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import io from 'socket.io-client';
import { ElevenTheme } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const ChatComponent = ({ userId, cartId, role, onClose, existingSocket }: any) => {
  const [socket, setSocket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const messageQueue = useRef(new Set());
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const getRoleBadgeColor = (userRole: string) => {
    switch (userRole?.toLowerCase()) {
      case 'manufacturer':
        return '#C084FC';
      case 'wholesaler':
        return '#34D399';
      case 'retailer':
        return '#F472B6';
      case 'driver':
        return '#38BDF8';
      case 'distributor':
        return '#FBBF24';
      default:
        return 'rgba(255, 255, 255, 0.5)';
    }
  };

  useEffect(() => {
    console.log('Initializing chat socket with:', { userId, cartId, role, hasExistingSocket: !!existingSocket });
    
    let activeSocket = existingSocket;
    let didCreateSocket = false;

    if (!activeSocket) {
      activeSocket = io('http://192.168.10.101:8000', {
        query: { user_id: userId, cart_id: cartId, role },
        transports: ['websocket'],
        reconnection: true,
      });
      didCreateSocket = true;
    }

    const onConnect = () => {
      console.log('Chat socket connected successfully');
      setIsConnected(true);
      activeSocket.emit('request-chat-history', { cart_id: cartId });
    };

    const onChatHistory = (data: any) => {
      console.log('Received chat history:', data);
      if (data?.history) {
        setMessages(data.history);
        messageQueue.current.clear();
        data.history.forEach((msg: any) => {
          messageQueue.current.add(${msg.sender_id}-);
        });
      }
    };

    const onNewMessage = (message: any) => {
      console.log('New message received:', message);
      const messageId = ${message.sender_id}-;
      if (!messageQueue.current.has(messageId)) {
        messageQueue.current.add(messageId);
        setMessages(prev => [...prev, message]);
      }
    };

    const onConnectError = (error: any) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    };

    activeSocket.on('connect', onConnect);
    activeSocket.on('chat-history', onChatHistory);
    activeSocket.on('new-message', onNewMessage);
    activeSocket.on('connect_error', onConnectError);

    if (activeSocket.connected) {
      setIsConnected(true);
      activeSocket.emit('request-chat-history', { cart_id: cartId });
    }

    setSocket(activeSocket);

    return () => {
      console.log('ChatComponent unmounting, cleaning up listeners');
      activeSocket.off('connect', onConnect);
      activeSocket.off('chat-history', onChatHistory);
      activeSocket.off('new-message', onNewMessage);
      activeSocket.off('connect_error', onConnectError);
      if (didCreateSocket) {
        activeSocket.disconnect();
      }
    };
  }, [userId, cartId, role, existingSocket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !socket) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    console.log('Sending message:', {
      cart_id: cartId,
      content: messageInput.trim()
    });

    socket.emit('send-message', {
      cart_id: cartId,
      content: messageInput.trim()
    });

    setMessageInput('');
    setCharCount(0);
  };

  const handleInputChange = (text: string) => {
    if (text.length <= 200) {
      setMessageInput(text);
      setCharCount(text.length);
    }
  };

  const formatTime = (timestamp: string | number | Date) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const isNewDay = (message: any, index: number) => {
    if (index === 0) return true;
    const currentDate = new Date(message.timestamp).toDateString();
    const prevDate = new Date(messages[index - 1].timestamp).toDateString();
    return currentDate !== prevDate;
  };

  const isUserMessage = (message: any) => {
    return message.sender_id === userId || message.role === role;
  };

  const MessageBubble = ({ message, isUser }: { message: any; isUser: boolean }) => {
    const roleColor = getRoleBadgeColor(message.role);

    return (
      <Animated.View 
        style={[
          styles.messageBubbleContainer,
          isUser ? styles.userBubbleContainer : styles.otherBubbleContainer,
          { opacity: fadeAnim }
        ]}
      >
        <View style={[
          styles.glassMessageCard,
          isUser ? styles.userGlassCard : styles.otherGlassCard
        ]}>
          {!isUser && (
            <View style={styles.senderHeader}>
              <View style={[styles.avatarCircle, { backgroundColor: `${roleColor}25`, borderColor: roleColor }]}>
                <Text style={[styles.avatarInitials, { color: roleColor }]}>
                  {message.sender_name ? message.sender_name[0].toUpperCase() : '?'}
                </Text>
              </View>
              <Text style={styles.senderName}>{message.sender_name || 'Node'}</Text>
              <View style={[styles.roleBadge, { backgroundColor: `${roleColor}18` }]}>
                <Text style={[styles.roleBadgeText, { color: roleColor }]}>
                  {message.role?.toUpperCase() || 'NODE'}
                </Text>
              </View>
            </View>
          )}

          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.otherMessageText]}>
            {message.content}
          </Text>

          <View style={styles.messageFooter}>
            <Text style={[styles.timestampText, isUser && styles.userTimestampText]}>
              {formatTime(message.timestamp)}
            </Text>
            {isUser && (
              <Ionicons name="checkmark-done" size={13} color="#34D399" style={styles.checkIcon} />
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />
      
      {/* Whitish Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Chat Room</Text>
            <View style={styles.badgeRow}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>#{cartId || 'Active'}</Text>
              </View>
              <View style={styles.connectionBadge}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: isConnected ? '#10B981' : '#EF4444' }
                ]} />
                <Text style={styles.statusText}>
                  {isConnected ? 'Live' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={18} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Message List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => (
          <React.Fragment key={message.id || `${message.sender_id}-${message.timestamp}-${index}`}>
            {isNewDay(message, index) && (
              <View style={styles.dateDivider}>
                <Text style={styles.dateText}>
                  {new Date(message.timestamp).toLocaleDateString([], { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </Text>
              </View>
            )}
            <MessageBubble 
              message={message} 
              isUser={isUserMessage(message)} 
            />
          </React.Fragment>
        ))}
      </ScrollView>

      {/* Whitish Input Bar */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type message..."
            placeholderTextColor="rgba(15, 23, 42, 0.4)"
            value={messageInput}
            onChangeText={handleInputChange}
            multiline
            maxLength={200}
          />
          <TouchableOpacity
            style={[
              styles.glassSendButton,
              (!messageInput.trim() || !isConnected) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!messageInput.trim() || !isConnected}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="arrow-up" 
              size={18} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
    letterSpacing: 0.6,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontFamily: ElevenTheme.typography.displayFamily,
    fontSize: 22,
    fontWeight: '300',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconPlate: {
    width: 50,
    height: 50,
    borderRadius: 9999,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: ElevenTheme.typography.displayFamily,
    fontSize: 20,
    fontWeight: '300',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: 0.15,
  },
  dateDivider: {
    alignItems: 'center',
    marginVertical: 14,
  },
  dateText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.6,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  messageBubbleContainer: {
    marginVertical: 2,
    maxWidth: '84%',
  },
  userBubbleContainer: {
    alignSelf: 'flex-end',
  },
  otherBubbleContainer: {
    alignSelf: 'flex-start',
  },
  glassMessageCard: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  userGlassCard: {
    backgroundColor: '#2563EB',
    borderWidth: 1,
    borderColor: '#1D4ED8',
  },
  otherGlassCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  senderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  avatarCircle: {
    width: 20,
    height: 20,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 10,
    fontWeight: '700',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.15,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#0F172A',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 6,
  },
  timestampText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '400',
  },
  userTimestampText: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  checkIcon: {
    marginLeft: 2,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 4,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    maxHeight: 90,
    paddingVertical: 6,
    letterSpacing: 0.15,
  },
  glassSendButton: {
    width: 34,
    height: 34,
    borderRadius: 9999,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.35,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  charCount: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  footerNote: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 0.6,
  },
});

export default ChatComponent;