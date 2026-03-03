// Alexis Garden

// Intro Screen — scroll to dismiss
const introScreen = document.getElementById('introScreen');

if (introScreen) {
    const hasSeenIntro = sessionStorage.getItem('alexisGardenIntroSeen');

    if (hasSeenIntro) {
        introScreen.classList.add('hidden');
    } else {
        // Fade in chunks: label → title → tagline → chevron
        const chunks = document.querySelectorAll('.intro-chunk');
        chunks.forEach((chunk, i) => {
            setTimeout(() => {
                chunk.classList.add('visible');
            }, i * 500 + 250);
        });

        // Dismiss on scroll (wheel or touch)
        let dismissed = false;

        function dismissIntro() {
            if (dismissed) return;
            dismissed = true;
            introScreen.classList.add('final-fade');
            setTimeout(() => {
                introScreen.classList.add('hidden');
                document.body.style.overflow = '';
                sessionStorage.setItem('alexisGardenIntroSeen', 'true');
            }, 600);
        }

        // Block scroll until dismissed, then release
        document.body.style.overflow = 'hidden';

        window.addEventListener('wheel', function onWheel(e) {
            if (e.deltaY > 0) {
                dismissIntro();
                window.removeEventListener('wheel', onWheel);
            }
        });

        // Touch swipe up to dismiss
        let touchStartY = 0;
        window.addEventListener('touchstart', function onTouchStart(e) {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        window.addEventListener('touchend', function onTouchEnd(e) {
            const diff = touchStartY - e.changedTouches[0].clientY;
            if (diff > 40) {
                dismissIntro();
                window.removeEventListener('touchend', onTouchEnd);
            }
        }, { passive: true });

        // Chevron click also dismisses
        const chevron = document.getElementById('introPlantBtn');
        if (chevron) {
            chevron.addEventListener('click', dismissIntro);
        }
    }
}

// Navigation
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const nav = document.querySelector('.nav');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('open');
        navLinks.classList.toggle('open');
    });
}

// Close mobile menu when clicking a link
if (navLinks) {
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('open');
            navLinks.classList.remove('open');
        });
    });
}

// Dropdown navigation handling
const dropdowns = document.querySelectorAll('.nav-dropdown');

dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.nav-dropdown-toggle');
    const menu = dropdown.querySelector('.nav-dropdown-menu');

    if (toggle && menu) {
        // Click handling for mobile (toggle on click)
        toggle.addEventListener('click', (e) => {
            // On mobile, toggle the dropdown
            if (window.innerWidth <= 900) {
                e.preventDefault();
                dropdown.classList.toggle('open');
            }
        });

        // Close dropdown when clicking a menu item
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                dropdown.classList.remove('open');
            });
        });
    }
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-dropdown')) {
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('open');
        });
    }
});

// Nav shadow on scroll
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Photography Slideshow
const slideshow = document.getElementById('photoSlideshow');
if (slideshow) {
    const images = slideshow.querySelectorAll('.slideshow-viewport img');
    const caption = slideshow.querySelector('.slideshow-caption');
    const counter = slideshow.querySelector('.slideshow-counter');
    const prevBtn = slideshow.querySelector('.slideshow-nav.prev');
    const nextBtn = slideshow.querySelector('.slideshow-nav.next');
    let current = 0;
    const total = images.length;

    function showSlide(index) {
        images[current].classList.remove('active');
        current = (index + total) % total;
        images[current].classList.add('active');
        caption.textContent = images[current].dataset.caption;
        counter.textContent = (current + 1) + ' / ' + total;
    }

    prevBtn.addEventListener('click', () => showSlide(current - 1));
    nextBtn.addEventListener('click', () => showSlide(current + 1));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') showSlide(current - 1);
        if (e.key === 'ArrowRight') showSlide(current + 1);
    });

    // Touch/swipe support
    let touchStartX = 0;
    slideshow.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    slideshow.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) showSlide(current + 1);
            else showSlide(current - 1);
        }
    }, { passive: true });
}

// Plant a Seed - Interactive Footer Garden
const plantSeedBtn = document.getElementById('plantSeedBtn');
const plantContainer = document.getElementById('plantContainer');

if (plantSeedBtn && plantContainer) {
    const flowers = ['🌸', '🌺', '🌻', '🌷', '🌹', '🌼', '🪻', '🪷'];

    plantSeedBtn.addEventListener('click', () => {
        // Disable button while growing
        plantSeedBtn.classList.add('growing');

        // Clear any existing plant
        plantContainer.innerHTML = '';

        // Create the plant structure
        const plant = document.createElement('div');
        plant.className = 'growing-plant';

        // Random flower
        const flowerEmoji = flowers[Math.floor(Math.random() * flowers.length)];

        plant.innerHTML = `
            <div class="plant-flower">${flowerEmoji}</div>
            <div class="plant-stem">
                <div class="plant-leaves">
                    <div class="plant-leaf left" style="bottom: 20px;"></div>
                    <div class="plant-leaf right" style="bottom: 35px;"></div>
                    <div class="plant-leaf left" style="bottom: 50px;"></div>
                    <div class="plant-leaf right" style="bottom: 65px;"></div>
                </div>
            </div>
        `;

        plantContainer.appendChild(plant);

        // Animate leaves appearing as stem grows
        const leaves = plant.querySelectorAll('.plant-leaf');
        leaves.forEach((leaf, i) => {
            setTimeout(() => {
                leaf.classList.add('grow');
            }, 400 + (i * 350)); // Stagger leaf growth
        });

        // Bloom the flower after stem is done
        setTimeout(() => {
            const flower = plant.querySelector('.plant-flower');
            flower.classList.add('bloom');

            // Add sparkles
            for (let i = 0; i < 6; i++) {
                setTimeout(() => {
                    const sparkle = document.createElement('div');
                    sparkle.className = 'sparkle';
                    sparkle.style.top = '-20px';
                    sparkle.style.left = '50%';
                    sparkle.style.setProperty('--tx', `${(Math.random() - 0.5) * 60}px`);
                    sparkle.style.setProperty('--ty', `${(Math.random() - 0.5) * 40}px`);
                    plant.appendChild(sparkle);
                    setTimeout(() => sparkle.remove(), 600);
                }, i * 100);
            }
        }, 2200);

        // Mark as complete and re-enable button
        setTimeout(() => {
            plant.classList.add('complete');
            plantSeedBtn.classList.remove('growing');
        }, 3000);
    });
}

// Strategy page — Claura-style scroll reveal animations
const clReveals = document.querySelectorAll('.cl-reveal');
if (clReveals.length > 0) {
    const clObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                clObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -60px 0px'
    });

    clReveals.forEach(el => clObserver.observe(el));
}

// Strategy page — services tab interaction
const clTabs = document.querySelectorAll('.cl-tab');
if (clTabs.length > 0) {
    const serviceData = [
        {
            title: 'Brand Strategy',
            desc: 'Defining who you are, what you stand for, and why it matters. The foundation everything else builds on.',
            img: '06_images/hero.jpg'
        },
        {
            title: 'Positioning',
            desc: 'Finding your place in the market. The space only you can occupy, and making sure everyone knows it.',
            img: '06_images/hero.jpg'
        },
        {
            title: 'Go-to-Market',
            desc: 'From strategy to launch. The plan that turns clarity into traction and gets your message in front of the right people.',
            img: '06_images/hero.jpg'
        }
    ];

    const detailTitle = document.querySelector('.cl-services-detail-title');
    const detailDesc = document.querySelector('.cl-services-detail-desc');
    const detailImg = document.querySelector('.cl-services-img img');

    clTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            clTabs.forEach(t => t.classList.remove('cl-tab-active'));
            tab.classList.add('cl-tab-active');
            const idx = parseInt(tab.dataset.tab);
            if (detailTitle) detailTitle.textContent = serviceData[idx].title;
            if (detailDesc) detailDesc.textContent = serviceData[idx].desc;
            if (detailImg) {
                detailImg.style.opacity = '0';
                setTimeout(() => {
                    detailImg.src = serviceData[idx].img;
                    detailImg.style.opacity = '1';
                }, 200);
            }
        });
    });
}

// Bento card nested links
document.querySelectorAll('.bento-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const href = link.dataset.href;
        if (href) {
            if (href.startsWith('http')) {
                window.open(href, '_blank', 'noopener');
            } else {
                window.location.href = href;
            }
        }
    });
});
