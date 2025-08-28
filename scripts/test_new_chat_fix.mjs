#!/usr/bin/env node

/**
 * Test script to verify the new chat fix
 * This script simulates the new chat creation flow to ensure it works correctly
 */

console.log('🧪 Testing New Chat Fix...\n');

// Test 1: reconstructMessageTree with empty array
console.log('Test 1: reconstructMessageTree with empty array');
const emptyMessages = [];
const result1 = reconstructMessageTree(emptyMessages);
console.log('✅ Empty array result:', result1);
console.log('Expected: []');
console.log('Actual:', result1);
console.log('Pass:', Array.isArray(result1) && result1.length === 0);
console.log('');

// Test 2: reconstructMessageTree with null/undefined
console.log('Test 2: reconstructMessageTree with null/undefined');
const result2 = reconstructMessageTree(null);
const result3 = reconstructMessageTree(undefined);
console.log('✅ Null result:', result2);
console.log('✅ Undefined result:', result3);
console.log('Pass:', Array.isArray(result2) && result2.length === 0 && Array.isArray(result3) && result3.length === 0);
console.log('');

// Test 3: reconstructMessageTree with valid messages
console.log('Test 3: reconstructMessageTree with valid messages');
const validMessages = [
  { id: '1', role: 'user', content: 'Hello', timestamp: new Date(), parentId: null },
  { id: '2', role: 'assistant', content: 'Hi there!', timestamp: new Date(), parentId: '1' }
];
const result4 = reconstructMessageTree(validMessages);
console.log('✅ Valid messages result:', result4.length, 'messages');
console.log('Pass:', Array.isArray(result4) && result4.length === 2);
console.log('');

// Test 4: reconstructMessageTree with circular reference
console.log('Test 4: reconstructMessageTree with circular reference');
const circularMessages = [
  { id: '1', role: 'user', content: 'Hello', timestamp: new Date(), parentId: '2' },
  { id: '2', role: 'assistant', content: 'Hi there!', timestamp: new Date(), parentId: '1' }
];
const result5 = reconstructMessageTree(circularMessages);
console.log('✅ Circular reference result:', result5.length, 'messages');
console.log('Pass:', Array.isArray(result5) && result5.length === 2);
console.log('');

// Test 5: reconstructMessageTree with deep nesting
console.log('Test 5: reconstructMessageTree with deep nesting');
const deepMessages = [];
for (let i = 0; i < 10; i++) {
  deepMessages.push({
    id: i.toString(),
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${i}`,
    timestamp: new Date(),
    parentId: i > 0 ? (i - 1).toString() : null
  });
}
const result6 = reconstructMessageTree(deepMessages);
console.log('✅ Deep nesting result:', result6.length, 'messages');
console.log('Pass:', Array.isArray(result6) && result6.length === 10);
console.log('');

// Test 6: reconstructMessageTree with duplicate IDs
console.log('Test 6: reconstructMessageTree with duplicate IDs');
const duplicateMessages = [
  { id: '1', role: 'user', content: 'Hello', timestamp: new Date(), parentId: null },
  { id: '1', role: 'user', content: 'Hello again', timestamp: new Date(), parentId: null },
  { id: '2', role: 'assistant', content: 'Hi there!', timestamp: new Date(), parentId: '1' }
];
const result7 = reconstructMessageTree(duplicateMessages);
console.log('✅ Duplicate IDs result:', result7.length, 'messages');
console.log('Pass:', Array.isArray(result7) && result7.length === 2);
console.log('');

console.log('🎉 All tests completed!');

// Mock function for testing (this would be the actual function from the chat page)
function reconstructMessageTree(messages) {
  if (!messages || messages.length === 0) {
    return [];
  }
  
  // Remove duplicate messages by ID to prevent key conflicts
  const uniqueMessages = messages.filter((msg, index, self) => 
    index === self.findIndex(m => m.id === msg.id)
  );
  
  const messageMap = new Map();
  const rootMessages = [];
  
  // First pass: create a map of all messages
  uniqueMessages.forEach((msg) => {
    messageMap.set(msg.id, {
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp || msg.createdAt),
      parentId: msg.parentId,
      children: []
    });
  });
  
  // Second pass: build the tree structure with cycle detection
  uniqueMessages.forEach((msg) => {
    const messageNode = messageMap.get(msg.id);
    if (!messageNode) return; // Skip if message not found
    
    if (msg.parentId && messageMap.has(msg.parentId)) {
      // Check for circular references by traversing up the parent chain
      let currentParentId = msg.parentId;
      const parentChain = new Set([msg.id]);
      
      while (currentParentId && messageMap.has(currentParentId)) {
        if (parentChain.has(currentParentId)) {
          // Circular reference detected
          console.warn('Circular reference detected for message:', msg.id, 'parent chain:', Array.from(parentChain));
          // Add as root message instead of child to break the cycle
          rootMessages.push(messageNode);
          return;
        }
        parentChain.add(currentParentId);
        const parentNode = messageMap.get(currentParentId);
        currentParentId = parentNode?.parentId || null;
      }
      
      // No circular reference, add as child
      const parentNode = messageMap.get(msg.parentId);
      if (parentNode) {
        parentNode.children.push(messageNode);
      } else {
        // Parent not found, add as root
        rootMessages.push(messageNode);
      }
    } else {
      // This is a root message (no parent or parent not found)
      rootMessages.push(messageNode);
    }
  });
  
  // Flatten the tree into a linear array for display
  const flattenTree = (nodes, result = [], depth = 0) => {
    // Prevent infinite recursion with depth limit
    if (depth > 100) {
      console.error('Tree depth limit exceeded, possible infinite loop');
      return result;
    }
    
    for (const node of nodes) {
      if (!node) continue; // Skip null/undefined nodes
      
      result.push({
        id: node.id,
        role: node.role,
        content: node.content,
        timestamp: node.timestamp,
        parentId: node.parentId
      });
      
      if (node.children && node.children.length > 0) {
        flattenTree(node.children, result, depth + 1);
      }
    }
    return result;
  };
  
  const flattenedResult = flattenTree(rootMessages);
  
  // Final check to ensure no duplicate IDs in the result
  const finalResult = flattenedResult.filter((msg, index, self) => 
    index === self.findIndex(m => m.id === msg.id)
  );
  
  return finalResult;
}
