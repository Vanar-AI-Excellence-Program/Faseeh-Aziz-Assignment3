# 🌳 Tree-Based Conversation System

This document describes the new tree-based conversation system that allows for branching conversations, message editing, and AI response regeneration.

## 🚀 Features

### 1. **Conversation Tree Structure**
- **Parent-Child Relationships**: Each message can have a parent message, creating a tree structure
- **Branching Support**: Multiple responses can branch from the same message
- **No Message Overwriting**: Original messages are preserved when creating branches

### 2. **Message Editing**
- **User Message Editing**: Users can edit their messages, creating new branches
- **Branch Creation**: Each edit creates a new message node with the same parent
- **History Preservation**: Original messages remain intact

### 3. **AI Response Regeneration**
- **Response Regeneration**: Users can regenerate AI responses from any user message
- **New Branches**: Each regeneration creates a new branch with a different response
- **Multiple Perspectives**: Allows exploring different AI responses to the same question

### 4. **Dual View Modes**
- **Linear View**: Traditional chat interface showing messages in chronological order
- **Tree View**: Hierarchical view showing conversation branches and relationships

## 🏗️ Architecture

### Database Schema
```sql
-- Messages table with tree support
CREATE TABLE message (
    id TEXT PRIMARY KEY,
    chatId TEXT NOT NULL,
    parentMessageId TEXT REFERENCES message(id), -- Tree structure
    branchId TEXT, -- Optional branch grouping
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT NOW()
);

-- Branch table for conversation branches
CREATE TABLE branch (
    id TEXT PRIMARY KEY,
    chatId TEXT NOT NULL,
    name TEXT,
    parentBranchId TEXT REFERENCES branch(id),
    isActive BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

#### 1. **Message Editing** - `PUT /api/chat/message`
- Creates new message branches when editing
- Preserves original message structure
- Supports tree-based conversation flow

#### 2. **Response Regeneration** - `POST /api/chat/regenerate`
- Generates new AI responses from user messages
- Creates new conversation branches
- Integrates with OpenAI and Google AI APIs

#### 3. **Conversation Tree** - `GET /api/chat/conversation-tree`
- Returns structured conversation tree
- Shows parent-child relationships
- Identifies branching points

## 🎯 Usage Examples

### 1. **Editing a Message**
```
User: "What is JavaScript?"
AI: "JavaScript is a programming language..."

User edits: "What is TypeScript?"
→ Creates new branch with edited question
→ AI generates new response for TypeScript
→ Original JavaScript conversation preserved
```

### 2. **Regenerating AI Response**
```
User: "Explain async/await"
AI: "Async/await is a way to handle..."

User clicks regenerate
→ AI generates alternative explanation
→ Creates new branch with different response
→ Both responses available for comparison
```

### 3. **Branching Conversations**
```
User: "How do I build a React app?"
AI: "You can use Create React App..."

User: "What about Next.js?"
→ Creates new branch for Next.js discussion
→ Original React conversation continues separately
→ User can switch between branches
```

## 🔧 Implementation Details

### Frontend Components

#### `ConversationTree.svelte`
- Main tree visualization component
- Handles tree structure building
- Manages branch selection and navigation

#### `MessageNode.svelte`
- Individual message display component
- Supports recursive rendering for nested messages
- Includes edit and regenerate actions

### Backend Logic

#### Message Branching
```typescript
// When editing a message
function editMessage(messageId: string, newContent: string) {
  const originalMsg = getMessage(messageId);
  
  // Create new message with same parent
  const newMsg = createMessage({
    content: newContent,
    parentMessageId: originalMsg.parentMessageId,
    chatId: originalMsg.chatId
  });
  
  return newMsg;
}
```

#### Response Regeneration
```typescript
// When regenerating AI response
function regenerateResponse(messageId: string) {
  const userMsg = getMessage(messageId);
  
  // Generate new AI response
  const newResponse = await generateAIResponse(userMsg.content);
  
  // Create new message branch
  const newMsg = createMessage({
    content: newResponse,
    parentMessageId: messageId,
    role: 'assistant'
  });
  
  return newMsg;
}
```

## 🎨 UI Features

### View Toggle
- **Linear View**: Traditional chat layout
- **Tree View**: Hierarchical conversation structure
- Smooth transitions between views

### Branch Indicators
- Visual indicators for branching points
- Branch count display
- Collapsible branch sections

### Message Actions
- Edit button for user messages
- Regenerate button for AI responses
- Branch navigation buttons

## 🔄 State Management

### Active Branch Tracking
- Tracks currently active conversation branch
- Updates UI to highlight active path
- Maintains branch selection across view changes

### Message Refresh
- Automatically refreshes conversation tree after edits
- Updates branch information in real-time
- Maintains conversation state consistency

## 🚦 Future Enhancements

### 1. **Advanced Branching**
- Named conversation branches
- Branch merging capabilities
- Branch comparison tools

### 2. **Collaboration Features**
- Shared conversation branches
- Branch sharing and forking
- Collaborative editing

### 3. **Analytics and Insights**
- Branch usage statistics
- Conversation flow analysis
- Popular branching patterns

## 🧪 Testing

### Manual Testing
1. Create a new conversation
2. Send a message and get AI response
3. Edit the user message
4. Verify new branch is created
5. Regenerate AI response
6. Switch between branches
7. Toggle between linear and tree views

### API Testing
- Test message editing endpoint
- Test response regeneration
- Test conversation tree loading
- Verify branch creation and management

## 📝 Notes

- The system gracefully handles cases where branch tables don't exist
- Fallback to linear conversations for backward compatibility
- All tree operations are optional and don't break existing functionality
- Message editing and regeneration create new branches without overwriting history

## 🔗 Related Files

- `src/lib/components/ConversationTree.svelte` - Main tree component
- `src/lib/components/MessageNode.svelte` - Message node component
- `src/routes/api/chat/message/+server.ts` - Message editing API
- `src/routes/api/chat/regenerate/+server.ts` - Response regeneration API
- `src/routes/api/chat/conversation-tree/+server.ts` - Tree structure API
- `src/routes/chat/+page.svelte` - Updated chat interface
