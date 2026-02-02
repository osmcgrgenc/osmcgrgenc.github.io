/**
 * UI Interaction Script
 * Handles mobile navigation, active route highlighting, and theme toggling
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    highlightActiveRoute();
    initTheme();
});

/* --- Theme Management --- */
function initTheme() {
    // Create toggle if it doesn't exist in DOM (for pages that haven't added it to HTML yet)
    // Or assume it will be added to HTML. redesign_plan says we add it to Navbar.
    // For now, let's look for a class '.theme-toggle'.
    const themeToggle = document.querySelector('.theme-toggle');

    // Check saved preference or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // Default to dark if no preference
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    // Apply immediately
    document.documentElement.setAttribute('data-theme', initialTheme);

    if (themeToggle) {
        updateToggleIcon(themeToggle, initialTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateToggleIcon(themeToggle, newTheme);
        });
    }
}

function updateToggleIcon(btn, theme) {
    if (!btn) return;
    // Sun icon for dark mode (click to switch to light), Moon for light mode
    const iconClass = theme === 'dark' ? 'fa-sun' : 'fa-moon';
    btn.innerHTML = `<i class="fas ${iconClass}"></i>`;
    btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
}

/* --- Mobile Navigation --- */
function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.nav-menu');

    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', !isExpanded);
            menu.classList.toggle('open');

            if (!isExpanded) {
                toggle.innerHTML = '<i class="fas fa-times"></i>';
                document.body.style.overflow = 'hidden';
            } else {
                toggle.innerHTML = '<i class="fas fa-bars"></i>';
                document.body.style.overflow = '';
            }
        });

        // Close menu when clicking a link
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.innerHTML = '<i class="fas fa-bars"></i>';
                document.body.style.overflow = '';
            });
        });
    }
}

/* --- Active Route Highlight --- */
function highlightActiveRoute() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.nav-link');

    links.forEach(link => {
        const href = link.getAttribute('href');
        // Exact match or sub-path match for projects/playground
        if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}
