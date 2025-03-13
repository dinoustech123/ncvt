function toggleMenu() {
    const menu = document.getElementById('dropdownMenu');
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'block';
    }
}

// Close the dropdown if clicked outside
window.addEventListener('click', function(event) {
    const loginorregister = document.querySelector('.loginorregister');
    const menu = document.getElementById('dropdownMenu');
    if (!loginorregister.contains(event.target)) {
        menu.style.display = 'none';
    }
});