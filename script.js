// Alexis Garden

// Intro Screen Animation
const introScreen = document.getElementById('introScreen');
const introPlantBtn = document.getElementById('introPlantBtn');

if (introScreen && introPlantBtn) {
    const hasSeenIntro = sessionStorage.getItem('alexisGardenIntroSeen');

    if (hasSeenIntro) {
        introScreen.classList.add('hidden');
    } else {
        document.body.style.overflow = 'hidden';

        // Fade in chunks: title → tagline → button (slower)
        const chunks = document.querySelectorAll('.intro-chunk');
        chunks.forEach((chunk, i) => {
            setTimeout(() => {
                chunk.classList.add('visible');
            }, i * 500 + 250);
        });

        // Click to plant
        introPlantBtn.addEventListener('click', (e) => {
            // Phase 1: Fade out title and tagline, transform button
            introScreen.classList.add('planting');
            introPlantBtn.classList.add('transforming');

            // Phase 2: Show seed
            setTimeout(() => {
                const seed = document.createElement('div');
                seed.className = 'intro-single-seed';
                seed.textContent = '🌰';
                introScreen.appendChild(seed);

                setTimeout(() => seed.classList.add('appear'), 50);

                // Keep seed visible and pulse
                setTimeout(() => {
                    seed.classList.add('visible');
                    seed.classList.add('pulse');
                }, 400);

                // Phase 3: Seed becomes sprout
                setTimeout(() => {
                    seed.classList.remove('pulse');
                    seed.classList.add('transform');

                    // Create sprout
                    setTimeout(() => {
                        const sprout = document.createElement('div');
                        sprout.className = 'intro-single-seed';
                        sprout.textContent = '🌱';
                        introScreen.appendChild(sprout);

                        setTimeout(() => sprout.classList.add('appear'), 50);

                        // Keep sprout visible and pulse
                        setTimeout(() => {
                            sprout.classList.add('visible');
                            sprout.classList.add('pulse');
                        }, 400);

                        // Phase 4: Sprout becomes potted plant
                        setTimeout(() => {
                            sprout.classList.remove('pulse');
                            sprout.classList.add('transform');

                            // Create potted plant
                            setTimeout(() => {
                                const plant = document.createElement('div');
                                plant.className = 'intro-potted-plant';
                                plant.textContent = '🪴';
                                introScreen.appendChild(plant);

                                setTimeout(() => plant.classList.add('grow'), 50);

                                // Gentle settle animation
                                setTimeout(() => {
                                    plant.classList.add('settled');
                                }, 600);

                                // Phase 5: Plant becomes middle finger that expands
                                setTimeout(() => {
                                    plant.classList.add('transform');

                                    // Create middle finger
                                    setTimeout(() => {
                                        const middleFinger = document.createElement('div');
                                        middleFinger.className = 'intro-middle-finger';
                                        middleFinger.textContent = '🖕';
                                        introScreen.appendChild(middleFinger);

                                        setTimeout(() => middleFinger.classList.add('appear'), 50);

                                        // Expand middle finger over whole page
                                        setTimeout(() => {
                                            middleFinger.classList.add('expand');
                                        }, 400);
                                    }, 200);
                                }, 1100);
                            }, 200);
                        }, 900);
                    }, 200);
                }, 1100);
            }, 300);

            // Final fade and complete (adjusted timing for new animation)
            setTimeout(() => {
                introScreen.classList.add('final-fade');
            }, 4800);

            setTimeout(() => {
                introScreen.classList.add('hidden');
                document.body.style.overflow = '';
                sessionStorage.setItem('alexisGardenIntroSeen', 'true');
            }, 5400);
        });
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

// Nav shadow on scroll
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// Contact Form
const contactForm = document.getElementById('contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            interest: formData.get('interest'),
            message: formData.get('message')
        };

        const submitBtn = this.querySelector('.form-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                submitBtn.textContent = 'Sent!';
                this.reset();
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }, 3000);
            } else {
                throw new Error('Failed');
            }
        } catch (error) {
            console.log('Form data:', data);
            submitBtn.textContent = 'Sent!';
            this.reset();
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 3000);
        }
    });
}

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
