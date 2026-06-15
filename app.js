import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

window.addEventListener('DOMContentLoaded', () => {

    const kapsayici = document.getElementById('3d-model-alani');
    if (!kapsayici) return;

    function hataGoster(mesaj) {
        kapsayici.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;
                        height:100%;color:#ff6b6b;font-family:Arial;font-size:14px;
                        text-align:center;padding:30px;background:#1a1a2e;border-radius:8px;">
                <div>⚠️ ${mesaj}</div>
            </div>`;
    }

    const base64Veri = window.MODEL_GLB_BASE64;
    if (!base64Veri) {
        hataGoster('GLB verisi yüklenemedi.<br>glb_data.js dosyası eksik veya hatalı.');
        return;
    }

    const yuklemeEkrani = document.createElement('div');
    yuklemeEkrani.id = 'yukleme-ekrani';
    yuklemeEkrani.innerHTML = `
        <div class="yukleme-ic">
            <div class="yukleme-halka"></div>
            <p class="yukleme-yazi">Model yükleniyor...</p>
        </div>`;
    kapsayici.appendChild(yuklemeEkrani);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1a1a2e');

    const genislik = kapsayici.offsetWidth || 800;
    const yukseklik = kapsayici.offsetHeight || 500;

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
    let blobUrl = null;

    try {
        blobUrl = base64ToBlobUrl(base64Veri);
    } catch (e) {
        hataGoster('Base64 dönüştürme hatası:<br>' + e.message);
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
                kutu.setFromObject(model);
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

            yuklemeEkrani.style.transition = 'opacity 0.6s ease';
            yuklemeEkrani.style.opacity = '0';
            setTimeout(() => {
                if (yuklemeEkrani.parentNode) yuklemeEkrani.remove();
            }, 700);

            const ipucu = document.getElementById('model-ipucu');
            if (ipucu) {
                ipucu.style.display = 'block';
                setTimeout(() => { ipucu.style.opacity = '0'; }, 3000);
                setTimeout(() => { ipucu.style.display = 'none'; }, 3700);
            }
        },

        undefined,

        (hata) => {
            URL.revokeObjectURL(blobUrl);
            console.error('GLB yükleme hatası:', hata);
            hataGoster('Model yüklenemedi.<br><small>Hata: ' + (hata.message || 'Bilinmeyen hata') + '</small>');
        }
    );

    window.addEventListener('resize', () => {
        const w = kapsayici.offsetWidth;
        const h = kapsayici.offsetHeight;
        if (w && h) {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
    });

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
});
