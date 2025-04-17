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
const composeView = document.getElementById('composeView');
const usersView = document.getElementById('usersView');
const createUserModal = new bootstrap.Modal(document.getElementById('createUserModal'));
const resetPasswordModal = new bootstrap.Modal(document.getElementById('resetPasswordModal'));

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initApp();

  // Form submissions
  document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
  document.getElementById('registerFormElement').addEventListener('submit', handleRegister);
  document.getElementById('composeForm').addEventListener('submit', handleSendEmail);

  // Navigation
  document.getElementById('emailsLink').addEventListener('click', showEmailsView);
  document.getElementById('profileLink').addEventListener('click', showProfileView);
  document.getElementById('composeLink').addEventListener('click', showComposeView);
  document.getElementById('usersLink').addEventListener('click', showUsersView);
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

  // User management
  document.getElementById('createUserBtn').addEventListener('click', () => {
    // Clear form
    document.getElementById('newUsername').value = '';
    document.getElementById('newEmail').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('newRole').value = 'user';
    document.getElementById('createUserError').classList.add('d-none');
    
    // Show modal
    createUserModal.show();
  });
  
  document.getElementById('submitCreateUser').addEventListener('click', handleCreateUser);
  document.getElementById('submitResetPassword').addEventListener('click', handleResetPassword);
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
    updateAdminUI();
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
    updateAdminUI();
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
    updateAdminUI();
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
}

async function handleCreateUser() {
  const username = document.getElementById('newUsername').value;
  const email = document.getElementById('newEmail').value;
  const password = document.getElementById('newPassword').value;
  const role = document.getElementById('newRole').value;
  const errorEl = document.getElementById('createUserError');

  try {
    errorEl.classList.add('d-none');
    await apiCall('users/create', 'POST', { 
      username, 
      email, 
      password, 
      role 
    });
    
    createUserModal.hide();
    loadUsers();
  } catch (error) {
    errorEl.textContent = error.message;
    errorEl.classList.remove('d-none');
  }
}

async function handleResetPassword() {
  const userId = document.getElementById('resetUserId').value;
  const newPassword = document.getElementById('newUserPassword').value;
  const errorEl = document.getElementById('resetPasswordError');

  try {
    errorEl.classList.add('d-none');
    await apiCall('users/reset-password', 'POST', { 
      userId, 
      newPassword 
    });
    
    resetPasswordModal.hide();
  } catch (error) {
    errorEl.textContent = error.message;
    errorEl.classList.remove('d-none');
  }
}

function showResetPasswordModal(userId, userEmail) {
  document.getElementById('resetUserId').value = userId;
  document.getElementById('resetUserEmail').textContent = userEmail;
  document.getElementById('newUserPassword').value = '';
  document.getElementById('resetPasswordError').classList.add('d-none');
  
  resetPasswordModal.show();
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

async function handleSendEmail(e) {
  e.preventDefault();
  
  const to = document.getElementById('composeTo').value;
  const subject = document.getElementById('composeSubject').value;
  const text = document.getElementById('composeMessage').value;
  
  const errorEl = document.getElementById('composeError');
  const successEl = document.getElementById('composeSuccess');
  
  errorEl.classList.add('d-none');
  successEl.classList.add('d-none');
  
  try {
    await apiCall('emails/send', 'POST', {
      to,
      subject,
      text
    });
    
    // Clear form
    document.getElementById('composeTo').value = '';
    document.getElementById('composeSubject').value = '';
    document.getElementById('composeMessage').value = '';
    
    // Show success message
    successEl.textContent = 'Email sent successfully!';
    successEl.classList.remove('d-none');
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      successEl.classList.add('d-none');
    }, 3000);
  } catch (error) {
    errorEl.textContent = error.message;
    errorEl.classList.remove('d-none');
  }
}

// User Management
async function loadUsers() {
  try {
    const result = await apiCall('users/all');
    displayUsers(result.users);
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

function displayUsers(users) {
  const usersList = document.getElementById('usersList');
  usersList.innerHTML = '';
  
  if (users.length === 0) {
    usersList.innerHTML = '<tr><td colspan="5" class="text-center">No users found</td></tr>';
    return;
  }
  
  users.forEach(user => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td><span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}">${user.role}</span></td>
      <td>${new Date(user.createdAt).toLocaleString()}</td>
      <td>
        <button class="btn btn-sm btn-warning reset-password" data-id="${user._id}" data-email="${user.email}">
          <i class="bi bi-key"></i> Reset Password
        </button>
      </td>
    `;
    
    // Add event listener to reset password button
    tr.querySelector('.reset-password').addEventListener('click', (e) => {
      const userId = e.currentTarget.getAttribute('data-id');
      const userEmail = e.currentTarget.getAttribute('data-email');
      showResetPasswordModal(userId, userEmail);
    });
    
    usersList.appendChild(tr);
  });
}

// UI Functions
function showLoginView() {
  loginForm.classList.remove('d-none');
  registerForm.classList.add('d-none');
  emailsView.classList.add('d-none');
  emailDetailView.classList.add('d-none');
  profileView.classList.add('d-none');
  composeView.classList.add('d-none');
  usersView.classList.add('d-none');
  navbarNav.classList.add('d-none');
}

function showEmailsView() {
  if (!token) return showLoginView();
  
  loginForm.classList.add('d-none');
  registerForm.classList.add('d-none');
  emailsView.classList.remove('d-none');
  emailDetailView.classList.add('d-none');
  profileView.classList.add('d-none');
  composeView.classList.add('d-none');
  usersView.classList.add('d-none');
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
  composeView.classList.add('d-none');
  usersView.classList.add('d-none');
  navbarNav.classList.remove('d-none');
}

function showProfileView() {
  if (!token) return showLoginView();
  
  loginForm.classList.add('d-none');
  registerForm.classList.add('d-none');
  emailsView.classList.add('d-none');
  emailDetailView.classList.add('d-none');
  profileView.classList.remove('d-none');
  composeView.classList.add('d-none');
  usersView.classList.add('d-none');
  navbarNav.classList.remove('d-none');
  
  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.getElementById('profileLink').classList.add('active');
  
  updateProfileView();
}

function showComposeView() {
  if (!token) return showLoginView();
  
  loginForm.classList.add('d-none');
  registerForm.classList.add('d-none');
  emailsView.classList.add('d-none');
  emailDetailView.classList.add('d-none');
  profileView.classList.add('d-none');
  composeView.classList.remove('d-none');
  usersView.classList.add('d-none');
  navbarNav.classList.remove('d-none');
  
  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.getElementById('composeLink').classList.add('active');
}

function showUsersView() {
  if (!token || !currentUser || currentUser.role !== 'admin') return showEmailsView();
  
  loginForm.classList.add('d-none');
  registerForm.classList.add('d-none');
  emailsView.classList.add('d-none');
  emailDetailView.classList.add('d-none');
  profileView.classList.add('d-none');
  composeView.classList.add('d-none');
  usersView.classList.remove('d-none');
  navbarNav.classList.remove('d-none');
  
  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.getElementById('usersLink').classList.add('active');
  
  loadUsers();
}

function updateAdminUI() {
  const adminElements = document.querySelectorAll('.admin-only');
  
  if (currentUser && currentUser.role === 'admin') {
    adminElements.forEach(el => el.classList.remove('d-none'));
  } else {
    adminElements.forEach(el => el.classList.add('d-none'));
  }
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