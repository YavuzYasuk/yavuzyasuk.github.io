
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {

        setTimeout(() => {
            preloader.classList.add('yuklendi');

            setTimeout(() => preloader.remove(), 800);
        }, 500);
    }
});

document.addEventListener('DOMContentLoaded', () => {

    const basliklar = document.querySelectorAll('h2'); // Tüm H2 basliklarini sec
    basliklar.forEach(baslik => {
        baslik.classList.add('wavy-text');
        const metin = baslik.textContent;
        baslik.textContent = ''; // Icerigi temizle

        for (let i = 0; i < metin.length; i++) {
            const harf = metin[i];
            const span = document.createElement('span');
            
            if (harf === ' ') {
                span.innerHTML = '&nbsp;'; // Bosluklarin kaybolmamasi icin
            } else {
                span.textContent = harf;

                span.style.animationDelay = `${i * 0.05}s`; 
            }
            baslik.appendChild(span);
        }
    });


    const animasyonElemanlari = document.querySelectorAll('.hakkimda-flex, .pafta-galeri, .istif-galeri, .model-kapsayici');
    animasyonElemanlari.forEach(el => el.classList.add('scroll-gizli'));

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {

                entry.target.classList.add('scroll-gorunur');
                observer.unobserve(entry.target); // Bir kere calismasi yeterli
            }
        });
    }, {
        threshold: 0.15, // Elemanin %15'i gorundugunde tetikle
        rootMargin: "0px 0px -50px 0px"
    });

    animasyonElemanlari.forEach(el => observer.observe(el));

    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particlesArray;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let mouse = {
            x: null,
            y: null,
            radius: 120 // Farenin etki alani (yaricapi)
        }

        window.addEventListener('mousemove', function(event) {
            mouse.x = event.x;
            mouse.y = event.y;
        });

        window.addEventListener('mouseout', function() {
            mouse.x = undefined;
            mouse.y = undefined;
        });

        class Particle {
            constructor(x, y, directionX, directionY, size, color) {
                this.x = x;
                this.y = y;
                this.directionX = directionX;
                this.directionY = directionY;
                this.size = size;
                this.color = color;

                this.baseX = this.x;
                this.baseY = this.y;
                this.density = (Math.random() * 30) + 1; // Itme hizi carpani
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
                ctx.fillStyle = this.color;
                ctx.fill();
            }

            update() {

                if (this.x > canvas.width || this.x < 0) {
                    this.directionX = -this.directionX;
                }
                if (this.y > canvas.height || this.y < 0) {
                    this.directionY = -this.directionY;
                }

                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius + this.size) {
                    let forceDirectionX = dx / distance;
                    let forceDirectionY = dy / distance;
                    let force = (mouse.radius - distance) / mouse.radius;
                    let directionX = forceDirectionX * force * this.density;
                    let directionY = forceDirectionY * force * this.density;

                    this.x -= directionX;
                    this.y -= directionY;
                } else {

                    if (this.x !== this.baseX) {
                        let dx = this.x - this.baseX;
                        this.x -= dx/20;
                    }
                    if (this.y !== this.baseY) {
                        let dy = this.y - this.baseY;
                        this.y -= dy/20;
                    }
                }

                this.x += this.directionX;
                this.y += this.directionY;

                this.baseX += this.directionX;
                this.baseY += this.directionY;

                this.draw();
            }
        }

        function init() {
            particlesArray = [];

            let numberOfParticles = (canvas.height * canvas.width) / 12000;

            if (numberOfParticles > 150) numberOfParticles = 150;

            for (let i = 0; i < numberOfParticles; i++) {
                let size = (Math.random() * 2) + 0.5;
                let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
                let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
                let directionX = (Math.random() * 0.4) - 0.2;
                let directionY = (Math.random() * 0.4) - 0.2;
                let color = 'rgba(255, 255, 255, 0.2)'; // Cok seffaf beyaz/gri

                particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
            }
        }

        function connect() {
            let opacityValue = 1;
            for (let a = 0; a < particlesArray.length; a++) {
                for (let b = a; b < particlesArray.length; b++) {
                    let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x))
                    + ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
                    
                    if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                        opacityValue = 1 - (distance / 20000);
                        ctx.strokeStyle = 'rgba(255, 255, 255,' + (opacityValue * 0.1) + ')';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                        ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                        ctx.stroke();
                    }
                }
            }
        }

        function animateCanvas() {
            requestAnimationFrame(animateCanvas);
            ctx.clearRect(0, 0, innerWidth, innerHeight);

            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
            }
            connect();
        }

        window.addEventListener('resize', function() {
            canvas.width = innerWidth;
            canvas.height = innerHeight;
            init();
        });

        init();
        animateCanvas();
    }

    function createAutoSliders() {
        const galeriler = document.querySelectorAll('.pafta-galeri, .istif-galeri');
        
        galeriler.forEach((galeri) => {
            const isPafta = galeri.classList.contains('pafta-galeri');
            const katmanlar = galeri.querySelectorAll(isPafta ? '.pafta-katman' : '.istif-katman');
            
            if (katmanlar.length === 0) return;

            const sliderKapsayici = document.createElement('div');
            sliderKapsayici.className = 'galeri-slider-kapsayici';
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'galeri-slider';
            slider.min = "0";
            slider.max = (katmanlar.length - 1).toString();
            
            sliderKapsayici.appendChild(slider);

            galeri.parentNode.insertBefore(sliderKapsayici, galeri.nextSibling);

            const toggleButon = document.createElement('button');
            toggleButon.className = 'genis-mod-buton';
            toggleButon.textContent = 'Tüm Görselleri Alt Alta Sırala';
            sliderKapsayici.parentNode.insertBefore(toggleButon, sliderKapsayici.nextSibling);

            function resimSec(index) {
                katmanlar.forEach(k => k.classList.remove('aktif'));
                if (katmanlar[index]) {
                    katmanlar[index].classList.add('aktif');
                    slider.value = index;
                }
            }

            let sonIndex = katmanlar.length - 1;
            resimSec(sonIndex);

            slider.addEventListener('input', (e) => {
                resimSec(e.target.value);
            });

            toggleButon.addEventListener('click', () => {
                galeri.classList.toggle('genis-mod');
                sliderKapsayici.classList.toggle('galeri-gizli-slider');
                
                if (galeri.classList.contains('genis-mod')) {
                    toggleButon.textContent = 'Yelpaze Görünümüne Dön';
                } else {
                    toggleButon.textContent = 'Tüm Görselleri Alt Alta Sırala';
                }
            });

            katmanlar.forEach((katman, idx) => {
                katman.addEventListener('mouseenter', () => {

                    if(!galeri.classList.contains('genis-mod')) {
                        resimSec(idx);
                    }
                });
                katman.addEventListener('mouseleave', () => {
                    if(!galeri.classList.contains('genis-mod')) {
                        katmanlar.forEach(k => k.classList.remove('aktif'));

                        resimSec(sonIndex); 
                    }
                });
            });
        });
    }

    createAutoSliders();
});

