document.addEventListener('DOMContentLoaded', () => {
    // Slider functionality
    const sliders = document.querySelectorAll('.slider');
    sliders.forEach(function(slider) {
        const slides = slider.querySelectorAll('.slide');
        let current = 0;
        const prevBtn = slider.querySelector('.prev');
        const nextBtn = slider.querySelector('.next');
        
        function showSlide(idx) {
            slides.forEach((s, i) => {
                s.classList.toggle('active', i === idx);
            });
        }
        
        if (prevBtn) {
            prevBtn.onclick = function() {
                current = (current - 1 + slides.length) % slides.length;
                showSlide(current);
            };
        }
        
        if (nextBtn) {
            nextBtn.onclick = function() {
                current = (current + 1) % slides.length;
                showSlide(current);
            };
        }
        
        showSlide(current);
    });

    // Order controls (quantity buttons) - moved from page-specific inline scripts
    document.querySelectorAll('.order-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const container = btn.closest('.order-controls');
            const input = container ? container.querySelector('.order-qty') : null;
            if (!input) return;
            const val = parseInt(input.value, 10) || 1;
            if (val > 1) input.value = val - 1;
        });
    });

    document.querySelectorAll('.order-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const container = btn.closest('.order-controls');
            const input = container ? container.querySelector('.order-qty') : null;
            if (!input) return;
            const val = parseInt(input.value, 10) || 1;
            input.value = val + 1;
        });
    });

    document.querySelectorAll('.order-qty').forEach(input => {
        input.addEventListener('input', () => {
            if (input.value === '' || parseInt(input.value, 10) < 1) {
                input.value = 1;
            }
        });
    });

    // Product modal handling
    window.showProductModal = function(key) {
        const modal = document.getElementById('product-modal');
        if (!modal) return;
        
        const p = productData[key];
        if (!p) return;
        
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;

        const html = `
            <div class="modal-slider">
                ${p.images.map(img => `<img src="${img}" style="width:100%;margin-bottom:8px;border-radius:8px;">`).join('')}
            </div>
            <h2>${p.name}</h2>
            <div class="modal-price">${p.price}</div>
            <div class="modal-desc">${p.desc}</div>
            ${p.ingredient ? `<div class="modal-ingredient"><strong>${p.ingredient}</strong></div>` : ''}
            ${p.gift ? `<div class="modal-gift"><strong>${p.gift}</strong></div>` : ''}
        `;
        
        modalBody.innerHTML = html;
        modal.style.display = 'flex';
    };

    window.closeProductModal = function() {
        const modal = document.getElementById('product-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    };
    // Mobile menu handling
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    const dropdowns = document.querySelectorAll('.dropdown');

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            nav.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', 
                nav.classList.contains('active').toString());
        });
    }

    // Handle mobile dropdowns
    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('a');
        if (link) {
            link.addEventListener('click', (e) => {
                if (window.innerWidth <= 900) {
                    e.preventDefault();
                    e.stopPropagation();
                    dropdown.classList.toggle('active');
                }
            });
        }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (nav && nav.classList.contains('active') && 
            !e.target.closest('nav') && 
            !e.target.closest('.menu-toggle')) {
            nav.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
            
            // Close all dropdowns
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });

    // Close mobile menu on window resize (debounced)
    (function() {
        let resizeTimer = null;
        function handleResize() {
            if (window.innerWidth > 900) {
                if (nav) nav.classList.remove('active');
                if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
                dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
            }
        }

        window.addEventListener('resize', () => {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(handleResize, 150);
        }, { passive: true });
    })();

    // Initialize scroll reveal animations
    const scrollRevealElements = document.querySelectorAll('.scroll-reveal');
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                scrollObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    scrollRevealElements.forEach(element => {
        scrollObserver.observe(element);
    });

    // Header scroll behavior (rAF-based to avoid layout thrash)
    const header = document.querySelector('header');
    if (header) {
        let lastScroll = window.pageYOffset || 0;
        let lastKnownScroll = lastScroll;
        let ticking = false;

        function updateHeader(scrollY) {
            if (scrollY <= 0) {
                header.classList.remove('scroll-down');
                header.classList.remove('scroll-up');
                lastScroll = 0;
                return;
            }

            if (scrollY > lastScroll) {
                // scrolling down
                if (!header.classList.contains('scroll-down')) {
                    header.classList.remove('scroll-up');
                    header.classList.add('scroll-down');
                }
            } else if (scrollY < lastScroll) {
                // scrolling up
                if (header.classList.contains('scroll-down')) {
                    header.classList.remove('scroll-down');
                    header.classList.add('scroll-up');
                }
            }

            lastScroll = scrollY;
        }

        function onScroll() {
            lastKnownScroll = window.pageYOffset || 0;
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateHeader(lastKnownScroll);
                    ticking = false;
                });
                ticking = true;
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Image lazy loading (safe checks, avoid unnecessary writes)
    const images = document.querySelectorAll('img[loading="lazy"]');
    const imageOptions = {
        threshold: 0.1,
        rootMargin: '50px'
    };

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const img = entry.target;
            // prefer data-src, fallback to data-srcset
            const dataSrc = img.dataset && (img.dataset.src || img.dataset.srcset);
            if (!dataSrc) {
                observer.unobserve(img);
                return;
            }

            // Only set src if different to avoid layout thrash
            if (img.getAttribute('src') !== dataSrc) {
                img.setAttribute('src', dataSrc);
            }

            img.classList.add('loaded');
            observer.unobserve(img);
        });
    }, imageOptions);

    images.forEach(img => imageObserver.observe(img));

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add hover effect classes to cards
    document.querySelectorAll('.product-card').forEach(card => {
        card.classList.add('hover-lift', 'depth-effect');
    });

    // Add animation classes to section titles
    document.querySelectorAll('.section-title').forEach(title => {
        title.classList.add('scroll-reveal');
    });

    // Add floating animation to specific elements
    document.querySelectorAll('.banner-img').forEach(img => {
        img.classList.add('float');
    });

    // Add zoom effect to product images
    document.querySelectorAll('.product-thumb').forEach(thumb => {
        const wrapper = document.createElement('div');
        wrapper.className = 'img-hover-zoom';
        thumb.parentNode.insertBefore(wrapper, thumb);
        wrapper.appendChild(thumb);
    });
});