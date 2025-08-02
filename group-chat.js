// Firebase SDK imports and configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, get, update, off } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAN_Fmk_Y6fNPnnPYlnFHAkttw-SioWzmU",
    authDomain: "world-chat-f42a9.firebaseapp.com",
    databaseURL: "https://world-chat-f42a9-default-rtdb.firebaseio.com",
    projectId: "world-chat-f42a9",
    storageBucket: "world-chat-f42a9.firebasestorage.app",
    messagingSenderId: "1086213718761",
    appId: "1:1086213718761:web:829f1691b2b61cad9ba678",
    measurementId: "G-GV1HSDP8XW"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let currentUser = null;
let currentGroup = null;
let membersListener = null;
let messagesListener = null;
let activeTab = 'chat';

const countryFlags = {
    'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺', 'DE': '🇩🇪',
    'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱', 'BE': '🇧🇪',
    'CH': '🇨🇭', 'AT': '🇦🇹', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰',
    'FI': '🇫🇮', 'PL': '🇵🇱', 'CZ': '🇨🇿', 'HU': '🇭🇺', 'SK': '🇸🇰',
    'SI': '🇸🇮', 'HR': '🇭🇷', 'RS': '🇷🇸', 'BG': '🇧🇬', 'RO': '🇷🇴',
    'GR': '🇬🇷', 'TR': '🇹🇷', 'RU': '🇷🇺', 'UA': '🇺🇦', 'BY': '🇧🇾',
    'LT': '🇱🇹', 'LV': '🇱🇻', 'EE': '🇪🇪', 'JP': '🇯🇵', 'KR': '🇰🇷',
    'CN': '🇨🇳', 'IN': '🇮🇳', 'ID': '🇮🇩', 'TH': '🇹🇭', 'VN': '🇻🇳',
    'PH': '🇵🇭', 'MY': '🇲🇾', 'SG': '🇸🇬', 'BR': '🇧🇷', 'AR': '🇦🇷',
    'MX': '🇲🇽', 'CL': '🇨🇱', 'CO': '🇨🇴', 'PE': '🇵🇪', 'VE': '🇻🇪',
    'ZA': '🇿🇦', 'EG': '🇪🇬', 'NG': '🇳🇬', 'KE': '🇰🇪', 'MA': '🇲🇦',
    'IL': '🇮🇱', 'SA': '🇸🇦', 'AE': '🇦🇪', 'IR': '🇮🇷', 'IQ': '🇮🇶',
    'PK': '🇵🇰', 'BD': '🇧🇩', 'LK': '🇱🇰', 'NP': '🇳🇵', 'AF': '🇦🇫'
};

function initializeGroup() {
    const userData = localStorage.getItem('pingNestUser');
    const groupData = localStorage.getItem('currentGroup');
    
    if (!userData || !groupData) {
        window.location.href = 'menu.html';
        return;
    }

    currentUser = JSON.parse(userData);
    currentGroup = JSON.parse(groupData);

    document.getElementById('groupId').textContent = currentGroup.id;
    
    // Add system message about group creation/joining
    if (currentGroup.isAdmin) {
        addSystemMessage(`You created group #${currentGroup.id}`);
    } else {
        addSystemMessage(`${currentUser.username} joined the group`);
        // Also add to Firebase for other members to see
        addJoinLeaveMessage(`${currentUser.username} joined the group`);
    }

    listenToMembers();
    listenToMessages();
}

function listenToMembers() {
    const membersRef = ref(database, `groups/${currentGroup.id}/members`);
    membersListener = onValue(membersRef, (snapshot) => {
        const members = snapshot.val();
        updateMemberStats(members);
        displayMembers(members);
    });
}

function updateMemberStats(members) {
    if (!members) {
        document.getElementById('memberCount').textContent = '0';
        document.getElementById('totalMembers').textContent = '0';
        document.getElementById('onlineMembers').textContent = '0';
        return;
    }

    const memberArray = Object.values(members);
    const onlineMembers = memberArray.filter(m => m.isOnline && (Date.now() - (m.lastSeen || 0) < 300000));
    
    document.getElementById('memberCount').textContent = memberArray.length;
    document.getElementById('totalMembers').textContent = memberArray.length;
    document.getElementById('onlineMembers').textContent = onlineMembers.length;
}

function displayMembers(members) {
    const membersList = document.getElementById('membersList');
    membersList.innerHTML = '';

    if (!members) return;

    const memberArray = Object.entries(members).map(([id, member]) => ({id, ...member}));
    memberArray.sort((a, b) => {
        // Sort by admin first, then by online status, then by name
        if (a.isAdmin && !b.isAdmin) return -1;
        if (!a.isAdmin && b.isAdmin) return 1;
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return a.username.localeCompare(b.username);
    });

    memberArray.forEach(member => {
        const memberEl = createMemberElement(member);
        membersList.appendChild(memberEl);
    });
}

function createMemberElement(member) {
    const memberEl = document.createElement('div');
    memberEl.className = 'member-item';

    const flag = countryFlags[member.countryCode] || '🌍';
    const isOnline = member.isOnline && (Date.now() - (member.lastSeen || 0) < 300000);
    const canRemove = currentGroup.isAdmin && member.id !== currentUser.id && !member.isAdmin;

    memberEl.innerHTML = `
        <div class="member-info">
            <span class="country-flag">${flag}</span>
            <div class="member-details">
                <div class="member-name">
                    ${member.username}
                    ${member.isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}
                </div>
                <div class="member-country">${member.country}</div>
            </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
            <div class="online-status ${isOnline ? 'online' : ''}"></div>
            ${canRemove ? `<button class="remove-btn" onclick="removeMember('${member.id}', '${member.username}')">Remove</button>` : ''}
        </div>
    `;

    return memberEl;
}

function listenToMessages() {
    const messagesRef = ref(database, `groups/${currentGroup.id}/messages`);
    messagesListener = onValue(messagesRef, (snapshot) => {
        const messages = snapshot.val();
        displayMessages(messages);
    });
}

function displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    const systemMessages = container.querySelectorAll('.system-message');
    
    // Keep system messages
    const systemMessagesArray = Array.from(systemMessages);
    container.innerHTML = '';
    systemMessagesArray.forEach(msg => container.appendChild(msg));

    if (!messages) return;

    const messageArray = Object.entries(messages).map(([id, msg]) => ({id, ...msg}));
    messageArray.sort((a, b) => a.timestamp - b.timestamp);

    messageArray.forEach(message => {
        if (message.type === 'system') {
            addSystemMessage(message.content);
        } else {
            const messageEl = createMessageElement(message);
            container.appendChild(messageEl);
        }
    });

    container.scrollTop = container.scrollHeight;
}

function createMessageElement(message) {
    const messageEl = document.createElement('div');
    const isOwn = message.userId === currentUser.id;
    messageEl.className = `message ${isOwn ? 'own' : 'other'}`;

    const flag = countryFlags[message.countryCode] || '🌍';
    const time = new Date(message.timestamp).toLocaleTimeString();

    messageEl.innerHTML = `
        <div class="message-header">
            <span class="country-flag">${flag}</span>
            <span class="username">${message.username}</span>
            ${message.isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">${message.content}</div>
    `;

    return messageEl;
}

function addSystemMessage(text) {
    const container = document.getElementById('messagesContainer');
    const systemMsg = document.createElement('div');
    systemMsg.className = 'system-message';
    systemMsg.textContent = text;
    container.appendChild(systemMsg);
    container.scrollTop = container.scrollHeight;
}

async function addJoinLeaveMessage(text) {
    try {
        const messageData = {
            type: 'system',
            content: text,
            timestamp: Date.now()
        };
        await push(ref(database, `groups/${currentGroup.id}/messages`), messageData);
    } catch (error) {
        console.error('Error adding system message:', error);
    }
}

window.switchTab = function(tabName) {
    activeTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (tabName === 'chat') {
        document.querySelector('.tab:first-child').classList.add('active');
        document.getElementById('chatTab').classList.add('active');
    } else {
        document.querySelector('.tab:last-child').classList.add('active');
        document.getElementById('membersTab').classList.add('active');
    }
};

window.sendMessage = async function() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    if (!content) return;

    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;

    try {
        const messageData = {
            userId: currentUser.id,
            username: currentUser.username,
            country: currentUser.country,
            countryCode: currentUser.countryCode,
            content: content,
            timestamp: Date.now(),
            isAdmin: currentGroup.isAdmin,
            type: 'message'
        };

        await push(ref(database, `groups/${currentGroup.id}/messages`), messageData);
        input.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Error sending message. Please try again.');
    } finally {
        sendBtn.disabled = false;
    }
};

window.removeMember = async function(memberId, memberName) {
    if (!currentGroup.isAdmin) return;
    
    if (confirm(`Are you sure you want to remove ${memberName} from the group?`)) {
        try {
            // Remove member from group
            await remove(ref(database, `groups/${currentGroup.id}/members/${memberId}`));
            
            // Add system message
            await addJoinLeaveMessage(`${memberName} was removed from the group`);
        } catch (error) {
            console.error('Error removing member:', error);
            alert('Error removing member. Please try again.');
        }
    }
};

window.showLeavePopup = function() {
    document.getElementById('leavePopup').style.display = 'flex';
};

window.closeLeavePopup = function() {
    document.getElementById('leavePopup').style.display = 'none';
};

window.confirmLeave = async function() {
    try {
        // Add leave message before removing user
        await addJoinLeaveMessage(`${currentUser.username} left the group`);
        
        // Remove user from group members
        await remove(ref(database, `groups/${currentGroup.id}/members/${currentUser.id}`));
        
        // Clean up listeners
        if (membersListener) off(ref(database, `groups/${currentGroup.id}/members`), 'value', membersListener);
        if (messagesListener) off(ref(database, `groups/${currentGroup.id}/messages`), 'value', messagesListener);
        
        // Clear group data
        localStorage.removeItem('currentGroup');
        
        // Go back to menu
        window.location.href = 'menu.html';
    } catch (error) {
        console.error('Error leaving group:', error);
        alert('Error leaving group. Please try again.');
    }
};

window.goBack = function() {
    confirmLeave();
};

// Enter key to send message
document.addEventListener('DOMContentLoaded', function() {
    initializeGroup();
    
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});

// Handle user leaving
window.addEventListener('beforeunload', async () => {
    if (currentUser && currentGroup) {
        await update(ref(database, `groups/${currentGroup.id}/members/${currentUser.id}`), {
            isOnline: false,
            lastSeen: Date.now()
        });
    }
});
