// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x001a00); // Dark forest green
scene.fog = new THREE.Fog(0x001a00, 150, 500);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowShadowMap;
document.getElementById('game-container').appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(50, 100, 50);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.left = -100;
dirLight.shadow.camera.right = 100;
dirLight.shadow.camera.top = 100;
dirLight.shadow.camera.bottom = -100;
scene.add(dirLight);

// Moon light for spooky effect
const moonLight = new THREE.PointLight(0x4488ff, 0.3, 500);
moonLight.position.set(-100, 150, -100);
scene.add(moonLight);

// Create terrain
function createTerrain() {
    const geometry = new THREE.PlaneGeometry(500, 500, 100, 100);
    const material = new THREE.MeshLambertMaterial({ color: 0x1a5c1a });
    
    // Add some variation to the terrain
    const positionAttribute = geometry.getAttribute('position');
    for (let i = 0; i < positionAttribute.count; i++) {
        positionAttribute.setZ(i, Math.random() * 3 - 1.5);
    }
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
    
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);
}

createTerrain();

// Create trees
function createTree(x, z) {
    const trunkGeometry = new THREE.CylinderGeometry(2, 3, 20, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4d2600 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 10, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);
    
    // Foliage
    const foliageGeometry = new THREE.ConeGeometry(8, 20, 8);
    const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x003300 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(x, 25, z);
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    scene.add(foliage);
}

// Create a dense forest
for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 150;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    createTree(x, z);
}

// Create escape gate
function createGate() {
    const gateGeometry = new THREE.BoxGeometry(8, 15, 2);
    const gateMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const gate = new THREE.Mesh(gateGeometry, gateMaterial);
    gate.position.set(0, 7.5, -200);
    gate.emissive = new THREE.Color(0xffff00);
    scene.add(gate);
    
    // Glow effect
    const glowGeometry = new THREE.BoxGeometry(9, 16, 3);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(0, 7.5, -199.9);
    scene.add(glow);
    
    return gate;
}

const gate = createGate();

// Mobile Touch Controls
class TouchControls {
    constructor() {
        this.moveInput = new THREE.Vector2(0, 0);
        this.lookInput = new THREE.Vector2(0, 0);
        this.isSprinting = false;
        
        this.setupTouchControls();
    }
    
    setupTouchControls() {
        // Move Joystick
        const moveJoystick = document.getElementById('moveJoystick');
        const moveDot = moveJoystick.querySelector('.joystick-dot');
        let moveTouchId = null;
        
        moveJoystick.addEventListener('touchstart', (e) => {
            moveTouchId = e.touches[0].identifier;
            this.handleMoveJoystick(e.touches[0], moveJoystick, moveDot);
        });
        
        document.addEventListener('touchmove', (e) => {
            if (moveTouchId !== null) {
                for (let touch of e.touches) {
                    if (touch.identifier === moveTouchId) {
                        this.handleMoveJoystick(touch, moveJoystick, moveDot);
                        break;
                    }
                }
            }
            
            // Look Joystick
            const lookJoystick = document.getElementById('lookJoystick');
            const lookDot = lookJoystick.querySelector('.joystick-dot');
            for (let touch of e.touches) {
                const rect = lookJoystick.getBoundingClientRect();
                if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                    touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                    this.handleLookJoystick(touch, lookJoystick, lookDot);
                    break;
                }
            }
        });
        
        document.addEventListener('touchend', (e) => {
            if (moveTouchId !== null) {
                for (let touch of e.changedTouches) {
                    if (touch.identifier === moveTouchId) {
                        moveTouchId = null;
                        moveDot.style.transform = 'translate(-50%, -50%)';
                        this.moveInput.set(0, 0);
                        break;
                    }
                }
            }
        });
        
        // Sprint Button
        const sprintBtn = document.getElementById('sprint-btn');
        sprintBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isSprinting = true;
        });
        
        sprintBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isSprinting = false;
        });
        
        sprintBtn.addEventListener('mousedown', () => {
            this.isSprinting = true;
        });
        
        sprintBtn.addEventListener('mouseup', () => {
            this.isSprinting = false;
        });
    }
    
    handleMoveJoystick(touch, container, dot) {
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const x = touch.clientX - rect.left - centerX;
        const y = touch.clientY - rect.top - centerY;
        
        const distance = Math.sqrt(x * x + y * y);
        const maxDistance = rect.width / 2 - 25;
        
        if (distance > maxDistance) {
            const angle = Math.atan2(y, x);
            dot.style.left = (centerX + Math.cos(angle) * maxDistance) + 'px';
            dot.style.top = (centerY + Math.sin(angle) * maxDistance) + 'px';
            this.moveInput.set(Math.cos(angle), Math.sin(angle));
        } else {
            dot.style.left = (centerX + x) + 'px';
            dot.style.top = (centerY + y) + 'px';
            const normalizedDistance = distance / maxDistance;
            this.moveInput.set(x / maxDistance, y / maxDistance);
        }
    }
    
    handleLookJoystick(touch, container, dot) {
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const x = touch.clientX - rect.left - centerX;
        const y = touch.clientY - rect.top - centerY;
        
        const distance = Math.sqrt(x * x + y * y);
        const maxDistance = rect.width / 2 - 25;
        
        if (distance > maxDistance) {
            const angle = Math.atan2(y, x);
            dot.style.left = (centerX + Math.cos(angle) * maxDistance) + 'px';
            dot.style.top = (centerY + Math.sin(angle) * maxDistance) + 'px';
            this.lookInput.set(Math.cos(angle) * 0.05, Math.sin(angle) * 0.05);
        } else {
            dot.style.left = (centerX + x) + 'px';
            dot.style.top = (centerY + y) + 'px';
            this.lookInput.set(x / maxDistance * 0.05, y / maxDistance * 0.05);
        }
    }
}

const touchControls = new TouchControls();

// Player controller
class Player {
    constructor() {
        this.velocity = new THREE.Vector3();
        this.speed = 0.15;
        this.sprintSpeed = 0.25;
        this.stamina = 100;
        this.maxStamina = 100;
        this.gravity = 0.01;
        this.yVelocity = 0;
        this.isGrounded = true;
    }
    
    update() {
        const moveDirection = new THREE.Vector3();
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        
        right.crossVectors(camera.up, forward).normalize();
        
        // Mobile joystick input
        moveDirection.add(forward.clone().multiplyScalar(touchControls.moveInput.y));
        moveDirection.add(right.clone().multiplyScalar(touchControls.moveInput.x));
        
        let currentSpeed = this.speed;
        
        if (touchControls.isSprinting && this.stamina > 0) {
            currentSpeed = this.sprintSpeed;
            this.stamina -= 0.5;
            document.getElementById('sprint-btn').classList.add('active');
        } else {
            this.stamina = Math.min(this.maxStamina, this.stamina + 0.2);
            document.getElementById('sprint-btn').classList.remove('active');
        }
        
        if (this.stamina <= 0) {
            document.getElementById('sprint-btn').classList.add('depleted');
        } else {
            document.getElementById('sprint-btn').classList.remove('depleted');
        }
        
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            this.velocity.copy(moveDirection.multiplyScalar(currentSpeed));
        } else {
            this.velocity.multiplyScalar(0.8);
        }
        
        // Apply gravity
        this.yVelocity -= this.gravity;
        this.yVelocity = Math.max(this.yVelocity, -0.3);
        
        camera.position.x += this.velocity.x;
        camera.position.z += this.velocity.z;
        camera.position.y += this.yVelocity;
        
        // Collision with terrain
        if (camera.position.y < 1.6) {
            camera.position.y = 1.6;
            this.yVelocity = 0;
            this.isGrounded = true;
        }
        
        // Keep player in bounds
        const maxDistance = 250;
        const distFromOrigin = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2);
        if (distFromOrigin > maxDistance) {
            const angle = Math.atan2(camera.position.z, camera.position.x);
            camera.position.x = Math.cos(angle) * maxDistance;
            camera.position.z = Math.sin(angle) * maxDistance;
        }
        
        // Update UI
        document.getElementById('stamina-fill').style.width = (this.stamina / this.maxStamina) * 100 + '%';
        
        // Look input from joystick
        camera.rotation.order = 'YXZ';
        camera.rotation.y -= touchControls.lookInput.x * 2;
        camera.rotation.x -= touchControls.lookInput.y * 2;
        
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }
}

const player = new Player();

// Monster AI
class Monster {
    constructor() {
        this.group = new THREE.Group();
        this.position = new THREE.Vector3(100, 1, 100);
        this.targetPosition = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.speed = 0.08;
        this.chaseDistance = 200;
        this.catchDistance = 5;
        this.rotationY = 0;
        
        this.createMonster();
        scene.add(this.group);
    }
    
    createMonster() {
        // Body (gray, stretchy)
        const bodyGeometry = new THREE.CapsuleGeometry(3, 8, 8, 16);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 5;
        body.castShadow = true;
        body.receiveShadow = true;
        this.group.add(body);
        this.body = body;
        
        // Head
        const headGeometry = new THREE.SphereGeometry(2.5, 16, 16);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 12;
        head.castShadow = true;
        head.receiveShadow = true;
        this.group.add(head);
        
        // Eyes (creepy red)
        const eyeGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.8, 13, 2);
        this.group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.8, 13, 2);
        this.group.add(rightEye);
        
        // Long left arm
        const armGeometry = new THREE.CapsuleGeometry(1.2, 15, 8, 12);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-4, 8, 0);
        leftArm.rotation.z = 0.3;
        leftArm.castShadow = true;
        leftArm.receiveShadow = true;
        this.group.add(leftArm);
        this.leftArm = leftArm;
        
        // Long right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(4, 8, 0);
        rightArm.rotation.z = -0.3;
        rightArm.castShadow = true;
        rightArm.receiveShadow = true;
        this.group.add(rightArm);
        this.rightArm = rightArm;
        
        // Left leg
        const legGeometry = new THREE.CapsuleGeometry(1, 8, 8, 12);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-2, 1, 0);
        leftLeg.castShadow = true;
        leftLeg.receiveShadow = true;
        this.group.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(2, 1, 0);
        rightLeg.castShadow = true;
        rightLeg.receiveShadow = true;
        this.group.add(rightLeg);
        
        this.group.position.copy(this.position);
    }
    
    update() {
        const playerPos = camera.position;
        const distToPlayer = this.group.position.distanceTo(playerPos);
        
        // Update danger meter
        const dangerLevel = Math.max(0, 100 - (distToPlayer / this.chaseDistance) * 100);
        document.getElementById('danger-fill').style.width = dangerLevel + '%';
        
        // Chase player if close enough
        if (distToPlayer < this.chaseDistance) {
            this.targetPosition.copy(playerPos);
            this.speed = 0.12; // Faster when chasing
        } else {
            this.speed = 0.04; // Slow patrol
            // Random patrol
            if (Math.random() < 0.01) {
                this.targetPosition.set(
                    (Math.random() - 0.5) * 200,
                    0,
                    (Math.random() - 0.5) * 200
                );
            }
        }
        
        // Move towards target
        const direction = new THREE.Vector3().subVectors(this.targetPosition, this.group.position);
        direction.y = 0;
        direction.normalize();
        
        this.group.position.x += direction.x * this.speed;
        this.group.position.z += direction.z * this.speed;
        
        // Rotate towards movement direction
        if (direction.length() > 0) {
            this.rotationY = Math.atan2(direction.x, direction.z);
            this.group.rotation.y = this.rotationY;
        }
        
        // Animate arms when chasing
        if (distToPlayer < this.chaseDistance) {
            const time = Date.now() * 0.005;
            this.leftArm.rotation.z = 0.3 + Math.sin(time) * 0.5;
            this.rightArm.rotation.z = -0.3 - Math.sin(time) * 0.5;
        }
        
        // Check if caught player
        if (distToPlayer < this.catchDistance) {
            this.caught();
        }
    }
    
    caught() {
        document.getElementById('game-over').style.display = 'block';
        gameRunning = false;
    }
}

const monster = new Monster();

// Game state
let gameRunning = true;
let gameTime = 0;

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Game loop
function animate() {
    requestAnimationFrame(animate);
    
    if (gameRunning) {
        gameTime++;
        
        player.update();
        monster.update();
        
        // Check if reached gate
        const distToGate = camera.position.distanceTo(gate.position);
        if (distToGate < 15) {
            document.getElementById('victory').style.display = 'block';
            gameRunning = false;
        }
        
        // Ominous sound effect simulation - screen shake effect when monster is close
        const distToMonster = camera.position.distanceTo(monster.group.position);
        if (distToMonster < 40 && distToMonster > 0) {
            const shakeIntensity = (1 - distToMonster / 40) * 0.2;
            camera.position.x += (Math.random() - 0.5) * shakeIntensity;
            camera.position.y += (Math.random() - 0.5) * shakeIntensity * 0.5;
            camera.position.z += (Math.random() - 0.5) * shakeIntensity;
        }
        
        // Red vignette effect when very close
        if (distToMonster < 20) {
            const intensity = 1 - (distToMonster / 20);
            renderer.setClearColor(new THREE.Color(intensity * 0.5, 0, 0), 1);
        } else {
            renderer.setClearColor(new THREE.Color(0x001a00), 1);
        }
    }
    
    renderer.render(scene, camera);
}

animate();
