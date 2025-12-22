document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});

function updateAuthUI() {
    try {
        const userJson = localStorage.getItem('user');
        if (!userJson) return;

        const user = JSON.parse(userJson);
        if (!user || !user.username) return;

        // Find the Membership nav item
        // In index.html and others, it looks like:
        // <li class="dropdown">
        //     <a href="#">Membership</a>
        //     <ul class="dropdown-content">
        //         <li><a href="membership-login.html">Login / Sign Up</a></li>
        //     </ul>
        // </li>

        // We look for the <a> tag with text "Membership" or containing it
        const navLinks = document.querySelectorAll('nav a');
        let membershipLink = null;

        for (let link of navLinks) {
            if (link.textContent.includes('Membership')) {
                membershipLink = link;
                break;
            }
        }

        if (membershipLink) {
            // Update the main link text
            membershipLink.textContent = `Hello, ${user.username}`;

            // Update the dropdown content logic
            const parentLi = membershipLink.parentElement; // li.dropdown
            if (parentLi) {
                const dropdownContent = parentLi.querySelector('.dropdown-content');
                if (dropdownContent) {
                    // Clear existing
                    dropdownContent.innerHTML = '';

                    // Add Profile Link (Optional, placeholder)
                    // const profileLi = document.createElement('li');
                    // profileLi.innerHTML = '<a href="#">My Profile</a>';
                    // dropdownContent.appendChild(profileLi);

                    // Add Logout Link
                    const logoutLi = document.createElement('li');
                    const logoutLink = document.createElement('a');
                    logoutLink.href = "#";
                    logoutLink.textContent = "Logout";
                    logoutLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        logout();
                    });
                    logoutLi.appendChild(logoutLink);
                    dropdownContent.appendChild(logoutLi);
                }
            }
        }
    } catch (e) {
        console.error("Error updating auth UI:", e);
    }
}

function logout() {
    localStorage.removeItem('user');
    window.location.reload();
}
