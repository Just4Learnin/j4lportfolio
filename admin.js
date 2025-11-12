import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, addDoc, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Your web app's Firebase configuration
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let projects = [];
let logs = [];
let skills = [];

let isAdmin = false;
let currentEditId = null;
let currentEditType = null;
let currentEditIndex = null;
let logViewMode = 'list';

async function loadData() {
    try {
        // Load projects
        const projectsSnapshot = await getDocs(collection(db, "projects"));
        projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Load logs (journal entries) ordered by timestamp descending (newest first)
        const logsQuery = query(collection(db, "logs"), orderBy("timestamp", "desc"));
        const logsSnapshot = await getDocs(logsQuery);
        logs = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Load skills
        const skillsSnapshot = await getDocs(collection(db, "skills"));
        skills = skillsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log(`Loaded ${projects.length} projects, ${logs.length} journal entries, and ${skills.length} skills from Firebase`);
        renderAll();
    } catch (error) {
        console.error("Error loading data from Firestore:", error);
        console.log("Falling back to hardcoded data...");
        // Load hardcoded data as a fallback
        loadHardcodedData();
        renderAll();
    }
}

function renderProjects() {
    try {
        const carousel = document.getElementById('projectsCarousel');
        if (!carousel) {
            console.warn('Projects carousel not found');
            return;
        }
        carousel.innerHTML = projects.map(p => `
            <div class="carousel-item project-card" data-id="${p.id}">
                ${isAdmin ? `
                <div class="edit-controls">
                    <button class="edit-btn" onclick="editProject(${p.id})">Edit</button>
                    <button class="edit-btn delete-btn" onclick="deleteProject(${p.id})">Delete</button>
                </div>
                ` : ''}
                ${p.image ? `<img src="${p.image}" alt="${p.title}" class="project-image">` : ''}
                <h3 class="project-title">${p.title}</h3>
                <p class="project-description">${p.description}</p>
                <div class="project-tech">
                    ${p.tech.map(t => `<span class="tech-tag">${t}</span>`).join('')}
                </div>
                <div class="project-links">
                    ${p.links.map(l => `<a href="${l.url}" class="project-link">${l.text} →</a>`).join('')}
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error rendering projects:', err);
    }
}

function renderSkills() {
    try {
        const skillsGrid = document.getElementById('skillsGrid');
        if (!skillsGrid) {
            console.warn('Skills grid not found');
            return;
        }
        skillsGrid.innerHTML = skills.map(category => `
            <div class="skill-category" data-id="${category.id}">
                ${isAdmin ? `
                <div class="edit-controls">
                    <button class="edit-btn" onclick="editSkillCategory(${category.id})">Edit</button>
                    <button class="edit-btn delete-btn" onclick="deleteSkillCategory(${category.id})">Delete</button>
                </div>
                ` : ''}
                <h3 class="collapsible-header" onclick="toggleCollapsible(this)">
                    ${category.category}
                </h3>
                <div class="collapsible-content">
                    <ul class="skill-list-items">
                        ${category.items.map((item, index) => `
                            <li>
                                ${item}
                                ${isAdmin ? `
                                <div class="skill-item-controls">
                                    <button class="edit-btn" onclick="editSkillItem(${category.id}, ${index})">Edit</button>
                                    <button class="edit-btn delete-btn" onclick="deleteSkillItem(${category.id}, ${index})">Delete</button>
                                </div>
                                ` : ''}
                            </li>
                        `).join('')}
                    </ul>
                    ${isAdmin ? `
                    <button class="btn" style="margin-top: 1rem; padding: 0.5rem 1rem;" onclick="addNewSkillItem(${category.id})">+ Add Skill</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error rendering skills:', err);
    }
}

function renderLogs() {
    try {
        const logEntries = document.getElementById('logEntries');
        if (!logEntries) {
            console.warn('Log entries container not found');
            return;
        }
        logEntries.innerHTML = logs.map(l => `
            <div class="log-entry" data-id="${l.id}">
                ${isAdmin ? `
                <div class="edit-controls">
                    <button class="edit-btn" onclick="editLog(${l.id})">Edit</button>
                    <button class="edit-btn delete-btn" onclick="deleteLog(${l.id})">Delete</button>
                </div>
                ` : ''}
                <div class="log-date">${l.date}</div>
                <h3 class="log-title">${l.title}</h3>
                <div class="log-content">${l.content}</div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error rendering logs:', err);
    }
}

function renderAll() {
    renderProjects();
    renderSkills();
    renderLogs();
}

function loadHardcodedData() {
    projects = [
        {
            id: 1,
            title: "\u{1F4D6} Bible Audio App",
            description: "A web application that loops through the Holy Bible in audio format. This project provides an accessible way to listen to scripture with continuous playback functionality.",
            tech: ["JavaScript", "HTML5", "CSS3", "Web Audio API", "Audio Processing"],
            links: [
                { text: "View Details", url: "https://github.com/Just4Learnin/Bible-audio-project" },
                { text: "Live Demo", url: "https://just4learnin.github.io/Bible-audio-project/" }
            ],
            image: ""
        },
        {
            id: 2,
            title: "\u{26A1} Koromi Themed Media Player",
            description: "Created a custom media player with Koromi elements. Currently it streams and plays mp3 files locally. Still working out some kinks though. Download is below.",
            tech: ["ESP32", "Arduino", "MQTT", "Node.js", "React", "RaspberryPi"],
            links: [
                { text: "View Details", url: "https://github.com/Just4Learnin/kuromi-music-player" },
                { text: "Live Demo", url: "https://just4learnin.github.io/kuromi-music-player/" }
            ],
            image: ""
        },
        {
            id: 3,
            title: "\u{1F916} LoraAssistant Project",
            description: "An AI-powered assistant project creating an AI based after Lora Croft. This project demonstrates advanced AI/ML concepts with practical applications for intelligent assistance. it will be added to GitHub once i am happy with it",
            tech: ["Python", "AI/ML", "LLM", "Machine Learning"],
            links: [
                { text: "Coming Soon", url: "#" },
                { text: "Coming Soon", url: "#" }
            ],
            image: ""
        },
        {
            id: 4,
            title: "\u{2615} OnlyBeanz App",
            description: "A custom application project focused on creating an engaging user experience. Built with modern web technologies and designed for scalability and performance. This is a a swipe based app for all you feline beanz lovers!",
            tech: ["JavaScript", "HTML5", "CSS3", "Web Development"],
            links: [
                { text: "View Details", url: "https://github.com/Just4Learnin/Bible-audio-project" },
                { text: "GitHub", url: "https://github.com/Just4Learnin/onlybeanz" }
            ],
            image: ""
        },
        {
            id: 5,
           title: "\u{1F3AE} Retro Pi Gaming System",
            description: "Built a custom retro gaming console using Raspberry Pi 4, featuring over 1000 classic games from multiple console generations with wireless controllers.",
            tech: ["Raspberry Pi", "RetroPie", "Linux", "3D Printing", "Electronics"],
            links: [
                { text: "View Details", url: "https://retropie.org.uk/docs/First-Installation/" },
                { text: "View Details", url: "https://retropie.org.uk/docs/First-Installation/" }
            ],
            image: ""
        },
        {
            id: 6,
           title: "\u{1F3E0} Home Lab",
            description: "Coming soon.",
            tech: ["Proxmox", "Docker", "Kubernetes", "pfSense", "Grafana"],
            links: [
                { text: "View Details", url: "#" },
                { text: "Documentation", url: "https://www.youtube.com/watch?v=xvFZjo5PgG0" }
            ],
            image: ""
        },
        {
            id: 7,
            title: "\u{1F4CA} Network Monitoring Dashboard",
            description: "coming soon.",
            tech: ["Python", "Flask", "InfluxDB", "Grafana", "Docker"],
            links: [
                { text: "View Details", url: "#" },
                { text: "Live Demo", url: "https://www.youtube.com/watch?v=xvFZjo5PgG0" }
            ],
            image: ""
        },
        {
            id: 8,
            title: "\u{1F4B0} Personal Finance Application",
            description: "coming soon.",
            tech: ["#"],
            links: [
                { text: "View Details", url: "#" },
                { text: "Live Demo", url: "https://www.youtube.com/watch?v=xvFZjo5PgG0" }
            ],
            image: ""
        }
    ];
    logs = [
        {
            id: 1,
            date: " November, 2025",
            title: "Portfolio website / environment creation",
            content: "Successfully created HTML script to edit this portfolio website with the help of Claude.ai. Much better than ChatGPT... After about 6 hours of studying I have a small understanding of the structure of HTML. It's exciting until it's not... But I think I'm learning and retaining some of the information. There will be more to come and I'll show some photos and other media to add to this webpage. Thank you again, this whole site will be a work in progress, however I am excited to be learning. Not only learning but applying some of what I learned. Next time devlog-exit... UPDATE: ive continued to add to this webpage and the changes can be found on my GitHub. still need to add a backend"
        },
        {
            id: 2,
            date: "September, 2025",
            title: "Retro Pi Case Design Iteration 3",
            content: "Completed the three different iterations of the custom Retro Pi design and setup. This version features improved airflow with fans, better cable management, and an integrated personal system for home improvement."
        },
        {
            id: 3,
            date: "September, 2025",
            title: "Completion of Custom MediaPlayer",
            content: "Completed basic HTML courses and began CSS basics on freecodeacademy.com and utilized this information to complete a multimedia project to create an executable program to play music from desktop and mobile platforms. Along with online resources I was able to create a cool media player with a Koromi style theme. The link is listed here. This is an ongoing process that I look forward to adding on. This project was overall fun and I am attempting to create these projects with as little use of AI to ensure I retain information."
        },
        {
            id: 4,
            date: "November, 2025",
            title: "\u{2615} OnlyBeanz App",
            content: "Started creation of a custom web-application project focused on creating an engaging user experience. Built with modern web technologies and designed for scalability and performance. This is a a swipe based app for all you feline beanz lovers!"
        }
    ];
    skills = [
        {
            id: 1,
            category: "Technical Support & Systems",
            items: [
                "Technical Troubleshooting & Support",
                "System Administration (macOS, Windows, Linux)",
                "Network Configuration & Connectivity",
                "Hardware / Software Diagnostics",
                "IT Documentation & Process Improvement"
            ]
        },
        {
            id: 2,
            category: "Cloud & Infrastructure",
            items: [
                "AWS (in progress)",
                "Azure (in progress)",
                "CompTIA Network+ (goal)",
                "AWS Cloud Practitioner (goal)"
            ]
        },
        {
            id: 3,
            category: "Programming & Web Development",
            items: [
                "Python",
                "JavaScript",
                "HTML5",
                "CSS3",
                "Responsive Design",
                "UI/UX Principles",
                "DOM Manipulation",
                "Event Handling",
                "Real-time Updates"
            ]
        },
        {
            id: 4,
            category: "AI/ML & Concepts",
            items: [
                "Large Language Models (LLMs)",
                "LLM Inference (Ollama)",
                "Speech-to-Text (STT)",
                "Text-to-Speech (TTS)",
                "CLI Development"
            ]
        },
        {
            id: 5,
            category: "CSS Techniques",
            items: [
                "Flexbox",
                "3D Transforms",
                "CSS Variables",
                "Media Queries"
            ]
        },
        {
            id: 6,
            category: "Web APIs",
            items: [
                "Web Audio API",
                "File API",
                "Local Storage"
            ]
        },
        {
            id: 7,
            category: "Tools & Ecosystems",
            items: [
                "Conda",
                "pip",
                "git",
                "nltk",
                "PyAudio",
                "webrtcvad",
                "pyttsx3",
                "SpeechRecognition"
            ]
        },
        {
            id: 8,
            category: "Engineering Practices",
            items: [
                "Problem Solving",
                "Debugging",
                "Troubleshooting",
                "Dependency Management",
                "Asynchronous Programming",
                "Performance Optimization",
                "Technical Documentation",
                "Agile Methodologies"
            ]
        },
        {
            id: 9,
            category: "Professional & Soft Skills",
            items: [
                "Team Leadership",
                "Mentoring",
                "Cross-functional Communication",
                "Customer Experience Optimization",
                "Analytical Thinking",
                "Attention to Detail",
                "Continuous Learning",
                "Adaptability",
                "Resourcefulness"
            ]
        }
    ];
}

onAuthStateChanged(auth, user => {
    if (user) {
        isAdmin = true;
        document.body.classList.add('edit-mode');
        document.getElementById('adminBar').classList.add('active');
    } else {
        isAdmin = false;
        document.body.classList.remove('edit-mode');
        document.getElementById('adminBar').classList.remove('active');
    }
    renderAll();
});

function toggleAdmin() {
    if (isAdmin) {
        signOut(auth);
    } else {
        document.getElementById('loginModal').classList.add('active');
    }
}

async function login() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        closeModal();
        alert('Successfully logged in with Firebase!');
    } catch (error) {
        console.error('Firebase login error:', error);
        alert('Login failed: ' + error.message);
    }
}

function exitAdmin() {
    signOut(auth);
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    const adminEmail = document.getElementById('adminEmail');
    const adminPassword = document.getElementById('adminPassword');
    if (adminEmail) adminEmail.value = '';
    if (adminPassword) adminPassword.value = '';
}

async function saveChanges() {
    try {
        for (const project of projects) {
            await setDoc(doc(db, "projects", project.id.toString()), project);
        }
        for (const log of logs) {
            await setDoc(doc(db, "logs", log.id.toString()), log);
        }
        for (const skill of skills) {
            await setDoc(doc(db, "skills", skill.id.toString()), skill);
        }
        alert('All changes saved successfully!');
    } catch (error) {
        console.error("Error saving changes to Firestore:", error);
        alert('Error saving changes. See console for details.');
    }
}

// Add new journal entry to Firebase
async function addNewJournalEntry(title, content) {
    try {
        const newEntry = {
            date: new Date().toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
            }),
            title: title,
            content: content,
            timestamp: new Date()
        };
        
        const docRef = await addDoc(collection(db, "logs"), newEntry);
        newEntry.id = docRef.id;
        logs.push(newEntry);
        renderAll();
        alert('Journal entry saved successfully!');
        return docRef.id;
    } catch (error) {
        console.error("Error adding journal entry:", error);
        alert('Error saving journal entry. See console for details.');
    }
}

// Add new project to Firebase
async function addNewProject(projectData) {
    try {
        const docRef = await addDoc(collection(db, "projects"), projectData);
        projectData.id = docRef.id;
        projects.push(projectData);
        renderAll();
        alert('Project saved successfully!');
        return docRef.id;
    } catch (error) {
        console.error("Error adding project:", error);
        alert('Error saving project. See console for details.');
    }
}

// Update existing entry in Firebase
async function updateEntry(collectionName, id, data) {
    try {
        await updateDoc(doc(db, collectionName, id), data);
        alert('Entry updated successfully!');
    } catch (error) {
        console.error("Error updating entry:", error);
        alert('Error updating entry. See console for details.');
    }
}

// Edit existing project
function editProject(id) {
    try {
        const project = projects.find(p => p.id == id);
        if (!project) {
            console.warn(`Project with ID ${id} not found`);
            return;
        }
        currentEditId = id;
        currentEditType = 'project';
        
        const editModalTitle = document.getElementById('editModalTitle');
        const editModalContent = document.getElementById('editModalContent');
        if (!editModalTitle || !editModalContent) {
            console.warn('Edit modal elements not found');
            return;
        }
        
        editModalTitle.textContent = 'Edit Project';
        editModalContent.innerHTML = `
            <div class="form-group">
                <label>Title</label>
                <input type="text" id="editTitle" value="${project.title}">
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="editDescription">${project.description}</textarea>
            </div>
            <div class="form-group">
                <label>Technologies (comma-separated)</label>
                <input type="text" id="editTech" value="${project.tech.join(', ')}">
            </div>
            <div class="form-group">
                <label>Image URL</label>
                <input type="text" id="editImage" value="${project.image || ''}">
            </div>
            <div class="form-group">
                <label>Project Links</label>
                ${project.links.map((link, index) => `
                    <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #333; border-radius: 5px;">
                        <input type="text" id="editLinkText${index}" value="${link.text}" placeholder="Link Text" style="margin-bottom: 5px; width: 100%;">
                        <input type="text" id="editLinkUrl${index}" value="${link.url}" placeholder="Link URL" style="width: 100%;">
                    </div>
                `).join('')}
            </div>
        `;
        
        const editModal = document.getElementById('editModal');
        if (editModal) editModal.classList.add('active');
    } catch (err) {
        console.error('Error in editProject:', err);
    }
}

// Delete existing project
async function deleteProject(id) {
    try {
        if (confirm('Are you sure you want to delete this project?')) {
            // Delete from Firebase
            await deleteDoc(doc(db, "projects", id.toString()));
            // Remove from local array
            projects = projects.filter(p => p.id != id);
            renderAll();
            alert('Project deleted successfully!');
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('Error deleting project. See console for details.');
    }
}

// Edit existing log entry
function editLog(id) {
    try {
        const log = logs.find(l => l.id == id);
        if (!log) {
            console.warn(`Log with ID ${id} not found`);
            return;
        }
        currentEditId = id;
        currentEditType = 'log';
        
        const editModalTitle = document.getElementById('editModalTitle');
        const editModalContent = document.getElementById('editModalContent');
        if (!editModalTitle || !editModalContent) {
            console.warn('Edit modal elements not found');
            return;
        }
        
        editModalTitle.textContent = 'Edit Log Entry';
        editModalContent.innerHTML = `
            <div class="form-group">
                <label>Date</label>
                <input type="text" id="editDate" value="${log.date}">
            </div>
            <div class="form-group">
                <label>Title</label>
                <input type="text" id="editTitle" value="${log.title}">
            </div>
            <div class="form-group">
                <label>Content</label>
                <textarea id="editContent" style="min-height: 150px;">${log.content}</textarea>
            </div>
        `;
        
        const editModal = document.getElementById('editModal');
        if (editModal) editModal.classList.add('active');
    } catch (err) {
        console.error('Error in editLog:', err);
    }
}

// Delete existing log entry
async function deleteLog(id) {
    try {
        if (confirm('Are you sure you want to delete this log entry?')) {
            // Delete from Firebase
            await deleteDoc(doc(db, "logs", id.toString()));
            // Remove from local array
            logs = logs.filter(l => l.id != id);
            renderAll();
            alert('Log entry deleted successfully!');
        }
    } catch (error) {
        console.error('Error deleting log entry:', error);
        alert('Error deleting log entry. See console for details.');
    }
}

// Add new log entry
function addNewLog() {
    try {
        const newId = Date.now(); // Use timestamp as ID
        const today = new Date().toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
        
        const newLog = {
            id: newId,
            date: today,
            title: "New Log Entry",
            content: "Write your log entry content here...",
            timestamp: new Date()
        };
        
        logs.unshift(newLog);
        renderAll();
        editLog(newId);
    } catch (err) {
        console.error('Error in addNewLog:', err);
    }
}

// Edit skill category
function editSkillCategory(id) {
    try {
        const category = skills.find(s => s.id == id);
        if (!category) {
            console.warn(`Skill category with ID ${id} not found`);
            return;
        }
        currentEditId = id;
        currentEditType = 'skill-category';
        
        const editModalTitle = document.getElementById('editModalTitle');
        const editModalContent = document.getElementById('editModalContent');
        if (!editModalTitle || !editModalContent) {
            console.warn('Edit modal elements not found');
            return;
        }
        
        editModalTitle.textContent = 'Edit Skill Category';
        editModalContent.innerHTML = `
            <div class="form-group">
                <label>Category Name</label>
                <input type="text" id="editCategoryName" value="${category.category}">
            </div>
        `;
        
        const editModal = document.getElementById('editModal');
        if (editModal) editModal.classList.add('active');
    } catch (err) {
        console.error('Error in editSkillCategory:', err);
    }
}

// Delete skill category
async function deleteSkillCategory(id) {
    try {
        if (confirm('Are you sure you want to delete this skill category?')) {
            // Delete from Firebase
            await deleteDoc(doc(db, "skills", id.toString()));
            // Remove from local array
            skills = skills.filter(s => s.id != id);
            renderAll();
            alert('Skill category deleted successfully!');
        }
    } catch (error) {
        console.error('Error deleting skill category:', error);
        alert('Error deleting skill category. See console for details.');
    }
}

// Add new skill category
function addNewSkillCategory() {
    try {
        const newId = Date.now(); // Use timestamp as ID
        const newCategory = {
            id: newId,
            category: "New Skill Category",
            items: []
        };
        skills.push(newCategory);
        renderAll();
        editSkillCategory(newId);
    } catch (err) {
        console.error('Error in addNewSkillCategory:', err);
    }
}

// Edit skill item
function editSkillItem(categoryId, itemIndex) {
    try {
        const category = skills.find(s => s.id == categoryId);
        if (!category || !category.items[itemIndex]) {
            console.warn(`Skill item not found`);
            return;
        }
        currentEditId = categoryId;
        currentEditIndex = itemIndex;
        currentEditType = 'skill-item';
        
        const editModalTitle = document.getElementById('editModalTitle');
        const editModalContent = document.getElementById('editModalContent');
        if (!editModalTitle || !editModalContent) {
            console.warn('Edit modal elements not found');
            return;
        }
        
        editModalTitle.textContent = 'Edit Skill Item';
        editModalContent.innerHTML = `
            <div class="form-group">
                <label>Skill Name</label>
                <input type="text" id="editSkillItem" value="${category.items[itemIndex]}">
            </div>
        `;
        
        const editModal = document.getElementById('editModal');
        if (editModal) editModal.classList.add('active');
    } catch (err) {
        console.error('Error in editSkillItem:', err);
    }
}

// Delete skill item
async function deleteSkillItem(categoryId, itemIndex) {
    try {
        if (confirm('Are you sure you want to delete this skill?')) {
            const category = skills.find(s => s.id == categoryId);
            if (category) {
                category.items.splice(itemIndex, 1);
                // Update in Firebase
                await updateDoc(doc(db, "skills", categoryId.toString()), category);
                renderAll();
                alert('Skill item deleted successfully!');
            }
        }
    } catch (error) {
        console.error('Error deleting skill item:', error);
        alert('Error deleting skill item. See console for details.');
    }
}

// Add new skill item
function addNewSkillItem(categoryId) {
    try {
        const category = skills.find(s => s.id == categoryId);
        if (!category) {
            console.warn(`Skill category with ID ${categoryId} not found`);
            return;
        }
        category.items.push("New Skill");
        renderAll();
        editSkillItem(categoryId, category.items.length - 1);
    } catch (err) {
        console.error('Error in addNewSkillItem:', err);
    }
}

// Save edit function (handles all types)
async function saveEdit() {
    try {
        if (currentEditType === 'project') {
            const project = projects.find(p => p.id == currentEditId);
            if (!project) {
                console.warn(`Project with ID ${currentEditId} not found`);
                return;
            }
            const editTitle = document.getElementById('editTitle');
            const editDescription = document.getElementById('editDescription');
            const editTech = document.getElementById('editTech');
            const editImage = document.getElementById('editImage');
            if (!editTitle || !editDescription || !editTech || !editImage) {
                console.warn('Edit form elements not found');
                return;
            }
            
            // Update local data
            project.title = editTitle.value;
            project.description = editDescription.value;
            project.tech = editTech.value.split(',').map(t => t.trim());
            project.image = editImage.value;
            
            // Update links
            project.links = project.links.map((link, index) => {
                const textElement = document.getElementById(`editLinkText${index}`);
                const urlElement = document.getElementById(`editLinkUrl${index}`);
                return {
                    text: textElement ? textElement.value : link.text,
                    url: urlElement ? urlElement.value : link.url
                };
            });
            
            // Update in Firebase
            await updateDoc(doc(db, "projects", currentEditId.toString()), project);
            
            renderAll();
            closeModal();
            alert('Project updated successfully!');
            
        } else if (currentEditType === 'log') {
            const log = logs.find(l => l.id == currentEditId);
            if (!log) {
                console.warn(`Log with ID ${currentEditId} not found`);
                return;
            }
            const editDate = document.getElementById('editDate');
            const editTitle = document.getElementById('editTitle');
            const editContent = document.getElementById('editContent');
            if (!editDate || !editTitle || !editContent) {
                console.warn('Edit form elements not found');
                return;
            }
            
            // Update local data
            log.date = editDate.value;
            log.title = editTitle.value;
            log.content = editContent.value;
            
            // Update in Firebase
            await updateDoc(doc(db, "logs", currentEditId.toString()), log);
            
            renderAll();
            closeModal();
            alert('Log entry updated successfully!');
            
        } else if (currentEditType === 'skill-category') {
            const category = skills.find(s => s.id == currentEditId);
            if (!category) {
                console.warn(`Skill category with ID ${currentEditId} not found`);
                return;
            }
            const editCategoryName = document.getElementById('editCategoryName');
            if (!editCategoryName) {
                console.warn('Edit form elements not found');
                return;
            }
            
            // Update local data
            category.category = editCategoryName.value;
            
            // Update in Firebase
            await updateDoc(doc(db, "skills", currentEditId.toString()), category);
            
            renderAll();
            closeModal();
            alert('Skill category updated successfully!');
            
        } else if (currentEditType === 'skill-item') {
            const category = skills.find(s => s.id == currentEditId);
            if (!category) {
                console.warn(`Skill category with ID ${currentEditId} not found`);
                return;
            }
            const editSkillItem = document.getElementById('editSkillItem');
            if (!editSkillItem) {
                console.warn('Edit form elements not found');
                return;
            }
            
            // Update local data
            category.items[currentEditIndex] = editSkillItem.value;
            
            // Update in Firebase
            await updateDoc(doc(db, "skills", currentEditId.toString()), category);
            
            renderAll();
            closeModal();
            alert('Skill item updated successfully!');
        }
        
        // Reset current edit variables
        currentEditId = null;
        currentEditType = null;
        currentEditIndex = null;
        
    } catch (error) {
        console.error('Error in saveEdit:', error);
        alert('Error saving changes. See console for details.');
    }
}

// Attach functions to the window object to make them accessible from the HTML
window.toggleAdmin = toggleAdmin;
window.login = login;
window.exitAdmin = exitAdmin;
window.closeModal = closeModal;
window.saveChanges = saveChanges;
window.addNewJournalEntry = addNewJournalEntry;
window.addNewProject = addNewProject;
window.updateEntry = updateEntry;

// Edit functions for existing items
window.editProject = editProject;
window.deleteProject = deleteProject;
window.editLog = editLog;
window.deleteLog = deleteLog;
window.addNewLog = addNewLog;
window.editSkillCategory = editSkillCategory;
window.deleteSkillCategory = deleteSkillCategory;
window.addNewSkillCategory = addNewSkillCategory;
window.editSkillItem = editSkillItem;
window.deleteSkillItem = deleteSkillItem;
window.addNewSkillItem = addNewSkillItem;
window.saveEdit = saveEdit;

// Add toggleCollapsible function for skills
function toggleCollapsible(element) {
    try {
        const content = element.nextElementSibling;
        if (content) {
            content.classList.toggle('active');
            element.classList.toggle('active');
        }
    } catch (err) {
        console.error('Error in toggleCollapsible:', err);
    }
}

// Render functions
window.renderProjects = renderProjects;
window.renderSkills = renderSkills;
window.renderLogs = renderLogs;
window.renderAll = renderAll;
window.toggleCollapsible = toggleCollapsible;

// Initial data load
loadData();