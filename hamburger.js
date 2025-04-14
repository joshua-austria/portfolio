document.addEventListener('DOMContentLoaded', function() {
  const hamburgerMenu = document.querySelector('.hamburger-menu');
  const sidePanel = document.querySelector('.side-panel');
  const closeBtn = document.querySelector('.close-btn');
  const overlay = document.querySelector('.overlay');
  
  // Toggle side panel when hamburger is clicked
  hamburgerMenu.addEventListener('click', function() {
    sidePanel.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  });
  
  // Close side panel when X is clicked
  closeBtn.addEventListener('click', function() {
    sidePanel.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = ''; // Enable scrolling
  });
  
  // Close side panel when clicking outside
  overlay.addEventListener('click', function() {
    sidePanel.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = ''; // Enable scrolling
  });
});