/* utf8-fix */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

window.addEventListener('DOMContentLoaded', () => {

    const grid = document.getElementById('preview-grid');
    if (!grid) return;

    const modelKeys = Object.keys(window).filter(k => k.startsWith('GLB_'));

    if (modelKeys.length === 0) {
        grid.innerHTML = '<p style="color:#ff6b6b; grid-column: 1/-1; text-align:center;">Hiç model bulunamadı. preview_data.js yüklendi mi?</p>';
        return;
    }

    function base64ToBlobUrl(b64) {
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes.buffer], { type: 'model/gltf-binary' });
        return URL.createObjectURL(blob);
    }

    const loader = new GLTFLoader();

    const renderDataList = [];

    modelKeys.forEach((key, index) => {

        let hamAd = key.toLowerCase();
        
        let modelAdi = "";
        if (hamAd.includes('1blend')) {
            modelAdi = "Lvl Design";
        } else if (hamAd.includes('elektri') || hamAd.includes('elektr')) {
            modelAdi = "Kontrol Paneli";
        } else if (hamAd.includes('k_rt')) {
            modelAdi = "Karakter Tasarımı";
        } else {
            let duzAd = key.replace('GLB_', '').replace('_GLB', '').toLowerCase();
            modelAdi = duzAd.charAt(0).toUpperCase() + duzAd.slice(1);
        }

        const base64Veri = window[key];

        const card = document.createElement('div');
        card.className = 'preview-card';
        
        const kapsayiciId = `preview-model-${index}`;
        
        card.innerHTML = `
            <div id="${kapsayiciId}" class="preview-model-kapsayici">
                <div id="yukleme-${index}" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:#1a1a2e; z-index:10; color:#ff9800;">
                    Yükleniyor...
                </div>
            </div>
            <div class="preview-info">
                <h3>${modelAdi} Modeli</h3>
                <p>Bu 3D model, projelerimde geliştirdiğim mekanik veya karakter tasarımlarından birini yansıtıyor. Fareniz ile döndürebilir, scroll ile yakınlaştırıp uzaklaştırabilirsiniz.</p>
            </div>
        `;
        grid.appendChild(card);
        
        const kapsayici = document.getElementById(kapsayiciId);
        const yuklemeEkrani = document.getElementById(`yukleme-${index}`);

        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#1a1a2e');
        
        const genislik = kapsayici.offsetWidth || 300;
        const yukseklik = kapsayici.offsetHeight || 350;
        
        const camera = new THREE.PerspectiveCamera(45, genislik / yukseklik, 0.01, 10000);
        camera.position.set(0, 2, 5);
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(genislik, yukseklik);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        kapsayici.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 1.0));
        const yonlu = new THREE.DirectionalLight(0xffffff, 2.0);
        yonlu.position.set(5, 10, 7);
        yonlu.castShadow = true;
        scene.add(yonlu);
        const dolgu = new THREE.DirectionalLight(0x8899ff, 0.5);
        dolgu.position.set(-5, 2, -5);
        scene.add(dolgu);
        scene.add(new THREE.HemisphereLight(0x87ceeb, 0x333344, 0.4));

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.2;
        controls.addEventListener('start', () => { controls.autoRotate = false; });
        
        renderDataList.push({ kapsayici, renderer, camera, scene, controls });

        let blobUrl = null;
        try {
            blobUrl = base64ToBlobUrl(base64Veri);
        } catch(e) {
            yuklemeEkrani.innerHTML = "Hata: Base64 okunamadi";
            return;
        }
        
        loader.load(
            blobUrl,
            (gltf) => {
                URL.revokeObjectURL(blobUrl);
                
                const model = gltf.scene;
                model.traverse(nesne => {
                    if (nesne.isMesh) {
                        nesne.castShadow = true;
                        nesne.receiveShadow = true;
                        if (!nesne.material) {
                            nesne.material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
                        }
                    }
                });
                scene.add(model);

                model.updateMatrixWorld(true);

                const kutu = new THREE.Box3();
                model.traverse(nesne => {
                    if (nesne.isMesh) {
                        kutu.expandByObject(nesne);
                    }
                });
                
                if (kutu.isEmpty()) {
                    kutu.setFromObject(model); // Eger hic mesh yoksa eski yonteme gec
                }

                const merkez = kutu.getCenter(new THREE.Vector3());
                const boyut = kutu.getSize(new THREE.Vector3());
                const enBuyuk = Math.max(boyut.x, boyut.y, boyut.z);
                
                model.position.sub(merkez);
                
                const uzaklik = enBuyuk * 2.2;
                camera.position.set(uzaklik * 0.5, enBuyuk * 0.4, uzaklik);
                camera.near = Math.max(0.001, enBuyuk * 0.001);
                camera.far = enBuyuk * 200;
                camera.updateProjectionMatrix();
                
                controls.target.set(0, 0, 0);
                controls.minDistance = enBuyuk * 0.1;
                controls.maxDistance = enBuyuk * 15;
                controls.update();
                
                yuklemeEkrani.style.display = 'none';
            },
            undefined,
            (error) => {
                URL.revokeObjectURL(blobUrl);
                console.error("Model yukleme hatasi", error);
                yuklemeEkrani.innerHTML = "Model Yüklenemedi";
            }
        );
    });

    function animate() {
        requestAnimationFrame(animate);
        
        renderDataList.forEach(data => {
            data.controls.update();
            data.renderer.render(data.scene, data.camera);
        });
    }
    
    if (renderDataList.length > 0) {
        animate();
    }

    window.addEventListener('resize', () => {
        renderDataList.forEach(data => {
            const w = data.kapsayici.offsetWidth;
            const h = data.kapsayici.offsetHeight;
            if (w && h) {
                data.camera.aspect = w / h;
                data.camera.updateProjectionMatrix();
                data.renderer.setSize(w, h);
            }
        });
    });
});

