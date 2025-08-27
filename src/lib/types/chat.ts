export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    parentMessageId?: string;
}

export interface ChatHistory {
    id: string;
    title: string;
    timestamp: Date;
    lastMessage?: string;
    messageCount: number;
}

export interface Branch {
    id: string;
    name: string;
    messageCount: number;
    parentBranchId?: string;
    createdAt: Date;
}

export interface MessageBranch {
    messageId: string;
    branchCount: number;
}

export interface BranchData {
    branches: Branch[];
    branchMessages: Array<{
        branchId: string;
        messages: ChatMessage[];
    }>;
    messageBranches: MessageBranch[];
}
