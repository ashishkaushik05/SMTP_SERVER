// Global variables
let currentPage = 1;
let totalPages = 1;
let token = localStorage.getItem('token');
let currentUser = null;

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const emailsView = document.getElementById('emailsView');
const emailDetailView = document.getElementById('emailDetailView');
const profileView = document.getElementById('profileView');
const navbarNav = document.getElementById('navbarNav');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initApp();

  // Form submissions
  document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
  document.getElementById('registerFormElement').addEventListener('submit', handleRegister);

  // Navigation
  document.getElementById('emailsLink').addEventListener('click', showEmailsView);
  document.getElementById('profileLink').addEventListener('click', showProfileView);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('showRegisterBtn').addEventListener('click', () => {
    loginForm.classList.add('d-none');
    registerForm.classList.remove('d-none');
  });
  document.getElementById('showLoginBtn').addEventListener('click', () => {
    registerForm.classList.add('d-none');
    loginForm.classList.remove('d-none');
  });
  document.getElementById('backToEmailsBtn').addEventListener('click', showEmailsView);

  // Email actions
  document.getElementById('searchBtn').addEventListener('click', searchEmails);
});

// Initialize the application
function initApp() {
  if (token) {
    // User is logged in, load emails
    getCurrentUser();
    showEmailsView();
  } else {
    // User is not logged in, show login form
    showLoginView();
  }
}

// API Calls
async function apiCall(endpoint, method = 'GET', data = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`/api/${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'API request failed');
    }

    return result;
  } catch (error) {
    console.error('API Error:', error);
    if (error.message === 'Not authorized to access this route') {
      // Token expired or invalid, log out
      handleLogout();
    }
    throw error;
  }
}

// User Actions
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');

  try {
    errorEl.classList.add('d-none');
    const result = await apiCall('users/login', 'POST', { email, password });
    token = result.token;
    localStorage.setItem('token', token);
    currentUser = result.user;
    showEmailsView();
    loadEmails();
  } catch (error) {
    errorEl.textContent = error.message;
    errorEl.classList.remove('d-none');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('regUsername').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const errorEl = document.getElementById('registerError');

  try {
    errorEl.classList.add('d-none');
    const result = await apiCall('users/register', 'POST', { username, email, password });
    token = result.token;
    localStorage.setItem('token', token);
    currentUser = result.user;
    showEmailsView();
    loadEmails();
  } catch (error) {
    errorEl.textContent = error.message;
    errorEl.classList.remove('d-none');
  }
}

function handleLogout() {
  localStorage.removeItem('token');
  token = null;
  currentUser = null;
  showLoginView();
}

async function getCurrentUser() {
  try {
    const result = await apiCall('users/profile');
    currentUser = result.user;
    updateProfileView();
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
}

// Email Actions
async function loadEmails(page = 1) {
  try {
    currentPage = page;
    const result = await apiCall(`emails?page=${page}`);
    totalPages = result.totalPages;
    displayEmails(result.emails);
    createPagination();
  } catch (error) {
    console.error('Error loading emails:', error);
  }
}

async function searchEmails() {
  const searchTerm = document.getElementById('searchInput').value;
  const searchField = document.getElementById('searchField').value;
  
  if (!searchTerm) {
    loadEmails();
    return;
  }
  
  try {
    const query = searchField === 'all' ? 
      `emails/search?q=${encodeURIComponent(searchTerm)}` : 
      `emails/search?q=${encodeURIComponent(searchTerm)}&field=${searchField}`;
    
    const result = await apiCall(query);
    displayEmails(result.emails);
    totalPages = result.totalPages;
    currentPage = result.currentPage;
    createPagination();
  } catch (error) {
    console.error('Error searching emails:', error);
  }
}

async function viewEmail(id) {
  try {
    const result = await apiCall(`emails/${id}`);
    displayEmailDetails(result.email);
    showEmailDetailView();
  } catch (error) {
    console.error('Error viewing email:', error);
  }
}

// UI Functions
function showLoginView() {
  loginForm.classList.remove('d-none');
  registerForm.classList.add('d-none');
  emailsView.classList.add('d-none');
  emailDetailView.classList.add('d-none');
  profileView.classList.add('d-none');
  navbarNav.classList.add('d-none');
}

function showEmailsView() {
  if (!token) return showLoginView();
  
  loginForm.classList.add('d-none');
  registerForm.classList.add('d-none');
  emailsView.classList.remove('d-none');
  emailDetailView.classList.add('d-none');
  profileView.classList.add('d-none');
  navbarNav.classList.remove('d-none');
  
  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.getElementById('emailsLink').classList.add('active');
  
  loadEmails(currentPage);
}

function showEmailDetailView() {
  loginForm.classList.add('d-none');
  registerForm.classList.add('d-none');
  emailsView.classList.add('d-none');
  emailDetailView.classList.remove('d-none');
  profileView.classList.add('d-none');
  navbarNav.classList.remove('d-none');
}

function showProfileView() {
  if (!token) return showLoginView();
  
  loginForm.classList.add('d-none');
  registerForm.classList.add('d-none');
  emailsView.classList.add('d-none');
  emailDetailView.classList.add('d-none');
  profileView.classList.remove('d-none');
  navbarNav.classList.remove('d-none');
  
  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.getElementById('profileLink').classList.add('active');
  
  updateProfileView();
}

function displayEmails(emails) {
  const emailsList = document.getElementById('emailsList');
  emailsList.innerHTML = '';
  
  if (emails.length === 0) {
    emailsList.innerHTML = '<tr><td colspan="5" class="text-center">No emails found</td></tr>';
    return;
  }
  
  emails.forEach(email => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${email.from && email.from.text ? email.from.text : 'Unknown'}</td>
      <td>${email.to && email.to.text ? email.to.text : 'Unknown'}</td>
      <td>${email.subject || 'No Subject'}</td>
      <td>${new Date(email.receivedAt).toLocaleString()}</td>
      <td>
        <button class="btn btn-sm btn-primary view-email" data-id="${email._id}">
          <i class="bi bi-envelope-open"></i> View
        </button>
      </td>
    `;
    
    // Add event listener to view button
    tr.querySelector('.view-email').addEventListener('click', () => {
      viewEmail(email._id);
    });
    
    emailsList.appendChild(tr);
  });
}

function displayEmailDetails(email) {
  document.getElementById('emailSubject').textContent = email.subject || 'No Subject';
  document.getElementById('emailFrom').textContent = email.from && email.from.text ? email.from.text : 'Unknown';
  document.getElementById('emailTo').textContent = email.to && email.to.text ? email.to.text : 'Unknown';
  document.getElementById('emailDate').textContent = new Date(email.receivedAt).toLocaleString();
  document.getElementById('emailId').textContent = email.messageId || 'N/A';
  
  // Display text content
  document.getElementById('emailText').textContent = email.text || 'No text content';
  
  // Display HTML content
  const htmlFrame = document.getElementById('emailHtml');
  if (email.html) {
    const blob = new Blob([email.html], { type: 'text/html' });
    htmlFrame.src = URL.createObjectURL(blob);
  } else {
    htmlFrame.srcdoc = '<p>No HTML content</p>';
  }
  
  // Display attachments
  const attachmentsContainer = document.getElementById('emailAttachments');
  attachmentsContainer.innerHTML = '';
  
  if (!email.attachments || email.attachments.length === 0) {
    attachmentsContainer.innerHTML = '<p>No attachments</p>';
    return;
  }
  
  email.attachments.forEach(attachment => {
    const attachmentCard = document.createElement('div');
    attachmentCard.className = 'card attachment-card';
    attachmentCard.style.width = '150px';
    
    attachmentCard.innerHTML = `
      <div class="card-body text-center">
        <i class="bi bi-file-earmark fs-1"></i>
        <p class="card-text">${attachment.filename || 'Attachment'}</p>
        <p class="card-text text-muted">${formatFileSize(attachment.size)}</p>
      </div>
    `;
    
    attachmentsContainer.appendChild(attachmentCard);
  });
}

function updateProfileView() {
  if (!currentUser) return;
  
  document.getElementById('profileUsername').textContent = currentUser.username;
  document.getElementById('profileEmail').textContent = currentUser.email;
  document.getElementById('profileRole').textContent = currentUser.role;
  document.getElementById('profileCreated').textContent = new Date(currentUser.createdAt).toLocaleString();
}

function createPagination() {
  const paginationEl = document.getElementById('emailsPagination');
  paginationEl.innerHTML = '';
  
  if (totalPages <= 1) return;
  
  const ul = document.createElement('ul');
  ul.className = 'pagination justify-content-center';
  
  // Previous button
  const prevLi = document.createElement('li');
  prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
  prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>`;
  ul.appendChild(prevLi);
  
  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement('li');
    li.className = `page-item ${i === currentPage ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
    ul.appendChild(li);
  }
  
  // Next button
  const nextLi = document.createElement('li');
  nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
  nextLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>`;
  ul.appendChild(nextLi);
  
  paginationEl.appendChild(ul);
  
  // Add event listeners to pagination links
  document.querySelectorAll('.page-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = parseInt(e.target.dataset.page);
      loadEmails(page);
    });
  });
}

// Helper Functions
function formatFileSize(bytes) {
  if (!bytes) return 'Unknown';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
} 