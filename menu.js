// Firebase SDK imports and configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update, remove } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

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

// Country flags mapping
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

// Initialize user data
function initializeUser() {
    const userData = localStorage.getItem('pingNestUser');
    if (!userData) {
        window.location.href = 'auth.html';
        return;
    }

    currentUser = JSON.parse(userData);
    
    // Update user display
    document.getElementById('userName').textContent = currentUser.username;
    document.getElementById('userCountry').textContent = currentUser.country;
    document.getElementById('userFlag').textContent = countryFlags[currentUser.countryCode] || '🌍';
    document.getElementById('roomCreatorName').value = currentUser.username;

    // Update user's online status
    updateUserOnlineStatus();
}

// Update user online status
async function updateUserOnlineStatus() {
    try {
        await update(ref(database, `users/${currentUser.id}`), {
            isOnline: true,
            lastSeen: Date.now()
        });
    } catch (error) {
        console.error('Error updating online status:', error);
    }
}

// Track online users
function trackOnlineUsers() {
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
        const users = snapshot.val();
        if (users) {
            const onlineUsers = Object.values(users).filter(user => 
                user.isOnline && (Date.now() - user.lastSeen < 300000) // 5 minutes
            );
            document.getElementById('onlineCount').textContent = onlineUsers.length;
        } else {
            document.getElementById('onlineCount').textContent = '0';
        }
    });
}

// Show loader function
function showLoader() {
    document.body.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            z-index: 9999;
        ">
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
                margin-bottom: 20px;
            ">
                <div style="
                    width: 60px;
                    height: 50px;
                    --m: no-repeat linear-gradient(90deg, #000 70%, #0000 0);
                    -webkit-mask: 
                        var(--m) calc(0*100%/4) 100%/calc(100%/5) calc(1*100%/5),
                        var(--m) calc(1*100%/4) 100%/calc(100%/5) calc(2*100%/5),
                        var(--m) calc(2*100%/4) 100%/calc(100%/5) calc(3*100%/5),
                        var(--m) calc(3*100%/4) 100%/calc(100%/5) calc(4*100%/5),
                        var(--m) calc(4*100%/4) 100%/calc(100%/5) calc(5*100%/5);
                    background: linear-gradient(#3498db 0 0) left/0% 100% no-repeat #e0e0e0;
                    animation: l14 2s infinite steps(6);
                "></div>
                <div style="
                    height: 20px;
                    position: relative;
                    width: 140px;
                    text-align: center;
                ">
                    <div style="
                        position: absolute;
                        left: 0;
                        right: 0;
                        opacity: 0;
                        font-family: Arial, sans-serif;
                        font-size: 14px;
                        color: white;
                        animation: wordFade 3.6s infinite;
                        transform: translateY(5px);
                        animation-delay: 0s;
                    ">Connecting...</div>
                    <div style="
                        position: absolute;
                        left: 0;
                        right: 0;
                        opacity: 0;
                        font-family: Arial, sans-serif;
                        font-size: 14px;
                        color: white;
                        animation: wordFade 3.6s infinite;
                        transform: translateY(5px);
                        animation-delay: 1.2s;
                    ">Loading...</div>
                    <div style="
                        position: absolute;
                        left: 0;
                        right: 0;
                        opacity: 0;
                        font-family: Arial, sans-serif;
                        font-size: 14px;
                        color: white;
                        animation: wordFade 3.6s infinite;
                        transform: translateY(5px);
                        animation-delay: 2.4s;
                    ">Please wait...</div>
                </div>
            </div>
            <div style="
                position: absolute;
                bottom: 40px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
            ">
                <img src="https://i.postimg.cc/vcbWpYgn/file-0000000038e461f5a640567745c91ec2.png" alt="Ping Nest" style="
                    width: 30px;
                    height: 30px;
                ">
                <div style="
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.8);
                    letter-spacing: 0.5px;
                ">Ping Nest</div>
            </div>
        </div>
        <style>
            @keyframes l14 {
                100% { background-size: 120% 100%; }
            }
            @keyframes wordFade {
                0%, 20% { opacity: 0; transform: translateY(5px); }
                30%, 70% { opacity: 1; transform: translateY(0); }
                80%, 100% { opacity: 0; transform: translateY(-5px); }
            }
        </style>
    `;
}

// Global functions for navigation and popups - Define before DOMContentLoaded
function goToInternationalChat() {
    showLoader();
    setTimeout(() => {
        window.location.href = 'international-chat.html';
    }, 6000);
}

function showCreateRoomPopup() {
    document.getElementById('createRoomPopup').style.display = 'flex';
}

function showJoinRoomPopup() {
    document.getElementById('joinRoomPopup').style.display = 'flex';
}

function showCreateGroupPopup() {
    document.getElementById('createGroupPopup').style.display = 'flex';
}

function showJoinGroupPopup() {
    document.getElementById('joinGroupPopup').style.display = 'flex';
}

function closePopup(popupId) {
    document.getElementById(popupId).style.display = 'none';
    // Clear form errors
    const errorElements = document.querySelectorAll('.error');
    errorElements.forEach(el => el.textContent = '');
}

// Attach functions to window object for global access
window.goToInternationalChat = goToInternationalChat;
window.showCreateRoomPopup = showCreateRoomPopup;
window.showJoinRoomPopup = showJoinRoomPopup;
window.showCreateGroupPopup = showCreateGroupPopup;
window.showJoinGroupPopup = showJoinGroupPopup;
window.closePopup = closePopup;

// Form submissions
document.addEventListener('DOMContentLoaded', function() {
    initializeUser();
    trackOnlineUsers();

    // Create Room Form
    document.getElementById('createRoomForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const roomId = document.getElementById('roomId').value;
        const roomKey = document.getElementById('roomKey').value;
        
        if (!/^\d{6}$/.test(roomId)) {
            document.getElementById('roomIdError').textContent = 'Room ID must be exactly 6 digits';
            return;
        }
        
        if (!/^\d{7}$/.test(roomKey)) {
            document.getElementById('roomKeyError').textContent = 'Room Key must be exactly 7 digits';
            return;
        }

        try {
            const roomSnapshot = await get(ref(database, `rooms/${roomId}`));
            if (roomSnapshot.exists()) {
                document.getElementById('roomIdError').textContent = 'Room ID already exists';
                return;
            }

            const roomData = {
                id: roomId,
                key: roomKey,
                creator: currentUser.id,
                creatorName: currentUser.username,
                createdAt: Date.now(),
                members: {
                    [currentUser.id]: {
                        username: currentUser.username,
                        country: currentUser.country,
                        countryCode: currentUser.countryCode,
                        joinedAt: Date.now(),
                        isOnline: true
                    }
                }
            };

            await set(ref(database, `rooms/${roomId}`), roomData);
            
            localStorage.setItem('currentRoom', JSON.stringify({
                id: roomId,
                key: roomKey,
                isCreator: true
            }));

            showLoader();
            setTimeout(() => {
                window.location.href = 'private-room.html';
            }, 6000);

        } catch (error) {
            console.error('Error creating room:', error);
            alert('Error creating room. Please try again.');
        }
    });

    // Join Room Form
    document.getElementById('joinRoomForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const roomId = document.getElementById('joinRoomId').value;
        const roomKey = document.getElementById('joinRoomKey').value;
        
        if (!/^\d{6}$/.test(roomId)) {
            document.getElementById('joinRoomIdError').textContent = 'Room ID must be exactly 6 digits';
            return;
        }
        
        if (!/^\d{7}$/.test(roomKey)) {
            document.getElementById('joinRoomKeyError').textContent = 'Room Key must be exactly 7 digits';
            return;
        }

        try {
            const roomSnapshot = await get(ref(database, `rooms/${roomId}`));
            if (!roomSnapshot.exists()) {
                document.getElementById('joinRoomIdError').textContent = 'Room does not exist';
                return;
            }

            const roomData = roomSnapshot.val();
            if (roomData.key !== roomKey) {
                document.getElementById('joinRoomKeyError').textContent = 'Invalid room key';
                return;
            }

            await update(ref(database, `rooms/${roomId}/members/${currentUser.id}`), {
                username: currentUser.username,
                country: currentUser.country,
                countryCode: currentUser.countryCode,
                joinedAt: Date.now(),
                isOnline: true
            });
            
            localStorage.setItem('currentRoom', JSON.stringify({
                id: roomId,
                key: roomKey,
                isCreator: false
            }));

            showLoader();
            setTimeout(() => {
                window.location.href = 'private-room.html';
            }, 6000);

        } catch (error) {
            console.error('Error joining room:', error);
            alert('Error joining room. Please try again.');
        }
    });

    // Create Group Form
    document.getElementById('createGroupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const groupId = document.getElementById('groupId').value;
        const groupKey = document.getElementById('groupKey').value;
        
        if (!/^\d{6}$/.test(groupId)) {
            document.getElementById('groupIdError').textContent = 'Group ID must be exactly 6 digits';
            return;
        }
        
        if (!/^\d{7}$/.test(groupKey)) {
            document.getElementById('groupKeyError').textContent = 'Group Key must be exactly 7 digits';
            return;
        }

        try {
            const groupSnapshot = await get(ref(database, `groups/${groupId}`));
            if (groupSnapshot.exists()) {
                document.getElementById('groupIdError').textContent = 'Group ID already exists';
                return;
            }

            const groupData = {
                id: groupId,
                key: groupKey,
                admin: currentUser.id,
                adminName: currentUser.username,
                createdAt: Date.now(),
                members: {
                    [currentUser.id]: {
                        username: currentUser.username,
                        country: currentUser.country,
                        countryCode: currentUser.countryCode,
                        joinedAt: Date.now(),
                        isOnline: true,
                        isAdmin: true
                    }
                }
            };

            await set(ref(database, `groups/${groupId}`), groupData);
            
            localStorage.setItem('currentGroup', JSON.stringify({
                id: groupId,
                key: groupKey,
                isAdmin: true
            }));

            showLoader();
            setTimeout(() => {
                window.location.href = 'group-chat.html';
            }, 6000);

        } catch (error) {
            console.error('Error creating group:', error);
            alert('Error creating group. Please try again.');
        }
    });

    // Join Group Form
    document.getElementById('joinGroupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const groupId = document.getElementById('joinGroupId').value;
        const groupKey = document.getElementById('joinGroupKey').value;
        
        if (!/^\d{6}$/.test(groupId)) {
            document.getElementById('joinGroupIdError').textContent = 'Group ID must be exactly 6 digits';
            return;
        }
        
        if (!/^\d{7}$/.test(groupKey)) {
            document.getElementById('joinGroupKeyError').textContent = 'Group Key must be exactly 7 digits';
            return;
        }

        try {
            const groupSnapshot = await get(ref(database, `groups/${groupId}`));
            if (!groupSnapshot.exists()) {
                document.getElementById('joinGroupIdError').textContent = 'Group does not exist';
                return;
            }

            const groupData = groupSnapshot.val();
            if (groupData.key !== groupKey) {
                document.getElementById('joinGroupKeyError').textContent = 'Invalid group key';
                return;
            }

            await update(ref(database, `groups/${groupId}/members/${currentUser.id}`), {
                username: currentUser.username,
                country: currentUser.country,
                countryCode: currentUser.countryCode,
                joinedAt: Date.now(),
                isOnline: true,
                isAdmin: false
            });
            
            localStorage.setItem('currentGroup', JSON.stringify({
                id: groupId,
                key: groupKey,
                isAdmin: false
            }));

            showLoader();
            setTimeout(() => {
                window.location.href = 'group-chat.html';
            }, 6000);

        } catch (error) {
            console.error('Error joining group:', error);
            alert('Error joining group. Please try again.');
        }
    });

    // Handle user leaving page
    window.addEventListener('beforeunload', async () => {
        if (currentUser) {
            await update(ref(database, `users/${currentUser.id}`), {
                isOnline: false,
                lastSeen: Date.now()
            });
        }
    });
});
