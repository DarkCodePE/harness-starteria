import React from 'react';
import type { CopilotMessageDto } from '../domain/copilot.types';
import { CopilotMessageList } from './CopilotMessageList';

export function CopilotConversation({ messages }: { messages: CopilotMessageDto[] }) {
  return <CopilotMessageList messages={messages} />;
}

