# 🌳 Git-Like Branching Conversation System

This document describes the implementation of a Git-like branching system for conversations, where users can navigate between different conversation paths seamlessly.

## 🎯 **Core Concept**

Think of conversations like Git repositories:
- **Default view**: Shows one linear branch (like `main` branch)
- **Branching**: When editing/regenerating, new branches appear
- **Navigation**: Users can hop between branches or see the full tree
- **History**: Original messages are never overwritten

## 🏗️ **Architecture Overview**

```
Conversation Root
 └─ User: Hi
     └─ Bot: Hello!
         ├─ User: Tell me more
         │    └─ Bot: Sure...
         └─ [Regenerated Bot Response]
              └─ User: Thanks
```

### **Database Schema**
```sql
-- Messages table with tree structure
CREATE TABLE message (
    id TEXT PRIMARY KEY,
    chatId TEXT NOT NULL,
    parentId TEXT, -- References message.id for tree structure
    role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    chunkCitations JSONB, -- Optional RAG citations
    createdAt TIMESTAMP DEFAULT NOW()
);

-- Branch table for optional grouping
CREATE TABLE branch (
    id TEXT PRIMARY KEY,
    chatId TEXT NOT NULL,
    name TEXT,
    parentBranchId TEXT, -- References branch.id for hierarchy
    isActive BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT NOW()
);
```

## 🔄 **User Experience Flow**

### **1. Normal Chat Mode (Linear View)**
- User sees one conversation path
- Messages appear in chronological order
- Branch indicator shows when alternatives exist
- "Show Tree" button to explore all branches

### **2. Tree View Mode**
- Hierarchical visualization of all conversation paths
- Click any message to switch to that branch
- Visual indicators for branching points
- "Switch to Linear" to return to normal view

### **3. Branch Navigation**
- Click branch indicator → switch to that path
- Linear view updates to show selected branch
- Seamless transition between views

## 🛠️ **API Endpoints**

### **1. Linear Branch Navigation**
```typescript
// GET /api/chat/linear-branch?chatId={id}&leafId={messageId}
// Walks from root to specific message (Git-like)
WITH RECURSIVE message_path AS (
  SELECT id, chatId, parentId, role, content, "createdAt", 0 as depth
  FROM message 
  WHERE id = $leafId AND chatId = $chatId
  
  UNION ALL
  
  SELECT m.id, m.chatId, m.parentId, m.role, m.content, m."createdAt", mp.depth + 1
  FROM message m
  INNER JOIN message_path mp ON m.id = mp.parentId
  WHERE m.chatId = $chatId
)
SELECT * FROM message_path ORDER BY depth DESC
```

### **2. Full Tree Structure**
```typescript
// GET /api/chat/linear-branch?chatId={id}
// Returns all messages for tree visualization
SELECT * FROM message WHERE chatId = $chatId ORDER BY "createdAt"
```

### **3. Message Editing (Creates Branches)**
```typescript
// PUT /api/chat/message
// Creates new message branch, preserves original
{
  messageId: string,
  content: string
}
```

### **4. Response Regeneration**
```typescript
// POST /api/chat/regenerate
// Generates new AI response, creates sibling branch
{
  messageId: string
}
```

## 🎨 **Frontend Components**

### **ConversationTree.svelte**
- Main tree visualization component
- Builds tree structure from flat message list
- Handles branch selection and navigation
- Recursive rendering for nested messages

### **MessageNode.svelte**
- Individual message display component
- Supports recursive rendering (`<svelte:self>`)
- Edit and regenerate actions
- Branch indicators and collapsible sections

### **Chat Interface**
- **View Toggle**: Linear ↔ Tree
- **Branch Indicators**: Show available alternatives
- **Navigation**: Click to switch branches
- **Seamless Transitions**: Between views and branches

## 🔧 **Implementation Details**

### **Tree Building Algorithm**
```typescript
function buildConversationTree(messages: any[]) {
  const messageMap = new Map();
  const rootMessages: any[] = [];
  
  // First pass: create message map and identify roots
  messages.forEach(msg => {
    messageMap.set(msg.id, {
      ...msg,
      children: [],
      isBranchPoint: false
    });
    
    if (!msg.parentId) {
      rootMessages.push(msg);
    }
  });
  
  // Second pass: build parent-child relationships
  messages.forEach(msg => {
    if (msg.parentId) {
      const parent = messageMap.get(msg.parentId);
      if (parent) {
        parent.children.push(msg);
        
        // Check for branching points
        if (parent.children.length > 1) {
          parent.isBranchPoint = true;
        }
      }
    }
  });
  
  return {
    rootMessages: rootMessages.map(msg => messageMap.get(msg.id)),
    messageMap: Object.fromEntries(messageMap)
  };
}
```

### **Branch Detection**
```typescript
function hasBranches(): boolean {
  if (!activeChat?.messages) return false;
  
  const messageMap = new Map();
  activeChat.messages.forEach(msg => {
    messageMap.set(msg.id, { ...msg, children: [] });
  });
  
  // Check for branching points
  activeChat.messages.forEach(msg => {
    if (msg.parentId) {
      const parent = messageMap.get(msg.parentId);
      if (parent) {
        parent.children.push(msg);
      }
    }
  });
  
  return Array.from(messageMap.values()).some(msg => msg.children.length > 1);
}
```

## 🚀 **Key Features**

### **1. Seamless Branch Navigation**
- Click any message → switch to that conversation path
- Linear view updates to show selected branch
- No page reloads or complex state management

### **2. Visual Branch Indicators**
- Branch count display in linear view
- Tree view shows all available paths
- Clear visual hierarchy with indentation

### **3. Preserved History**
- Original messages never overwritten
- Each edit/regeneration creates new branch
- Full conversation tree always accessible

### **4. Dual View Modes**
- **Linear**: Traditional chat experience
- **Tree**: Full conversation exploration
- Easy switching between modes

## 🎯 **Usage Examples**

### **Scenario 1: Message Editing**
```
1. User asks: "What is JavaScript?"
2. AI responds: "JavaScript is a programming language..."
3. User edits to: "What is TypeScript?"
4. System creates new branch with edited question
5. AI generates new response for TypeScript
6. Both conversations preserved
```

### **Scenario 2: Response Regeneration**
```
1. User asks: "Explain async/await"
2. AI responds: "Async/await is a way to handle..."
3. User clicks regenerate
4. AI generates alternative explanation
5. Both responses available in tree view
6. User can switch between explanations
```

### **Scenario 3: Branch Navigation**
```
1. User sees linear conversation
2. Branch indicator shows "3 branches available"
3. User clicks "Show Tree"
4. Tree view reveals all conversation paths
5. User clicks on alternative response
6. Linear view updates to show selected branch
```

## 🔄 **State Management**

### **Active Branch Tracking**
- `activeBranchId`: Currently selected message/branch
- `viewMode`: Current view (linear/tree)
- Automatic updates when switching branches

### **Message Refresh**
- Tree view loads full conversation structure
- Linear view shows selected branch path
- Real-time updates after edits/regenerations

## 🚦 **Future Enhancements**

### **1. Advanced Branching**
- Named conversation branches
- Branch merging capabilities
- Branch comparison tools

### **2. Collaboration Features**
- Shared conversation branches
- Branch sharing and forking
- Collaborative editing

### **3. Analytics and Insights**
- Branch usage statistics
- Conversation flow analysis
- Popular branching patterns

## 🧪 **Testing Scenarios**

### **Manual Testing Checklist**
1. ✅ Create new conversation
2. ✅ Send message and get AI response
3. ✅ Edit user message → verify new branch
4. ✅ Regenerate AI response → verify sibling branch
5. ✅ Switch between linear and tree views
6. ✅ Click branch indicators → verify navigation
7. ✅ Verify original messages preserved

### **API Testing**
- ✅ Linear branch navigation
- ✅ Full tree loading
- ✅ Message editing with branching
- ✅ Response regeneration
- ✅ Error handling and fallbacks

## 📝 **Implementation Notes**

### **Backward Compatibility**
- System gracefully handles missing branch tables
- Fallback to linear conversations
- All tree operations are optional

### **Performance Considerations**
- Recursive CTE for efficient tree traversal
- Lazy loading of branch data
- Optimized tree building algorithms

### **Error Handling**
- Graceful fallbacks for missing data
- User-friendly error messages
- Automatic recovery from failures

## 🔗 **Related Files**

- `src/lib/components/ConversationTree.svelte` - Main tree component
- `src/lib/components/MessageNode.svelte` - Message node component
- `src/routes/api/chat/linear-branch/+server.ts` - Linear branch API
- `src/routes/api/chat/message/+server.ts` - Message editing API
- `src/routes/api/chat/regenerate/+server.ts` - Response regeneration API
- `src/routes/chat/+page.svelte` - Updated chat interface
- `src/lib/server/db/schema.ts` - Database schema

## 🎉 **Benefits**

### **For Users**
- **No Lost Conversations**: All paths preserved
- **Easy Exploration**: Switch between alternatives
- **Intuitive Navigation**: Git-like branching familiar to developers
- **Rich Context**: See full conversation structure

### **For Developers**
- **Clean Architecture**: Tree-based data model
- **Scalable Design**: Handles complex conversation flows
- **Maintainable Code**: Clear separation of concerns
- **Extensible System**: Easy to add new features

This Git-like branching system transforms conversations from simple linear chats into rich, explorable conversation trees, giving users the power to navigate their AI interactions like they navigate code repositories.
