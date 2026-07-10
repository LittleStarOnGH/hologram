let peer;
let scene;
let camera;
let renderer;
let objects;
let hologramGroup; // กลุ่มหลักสำหรับควบคุมโมเดลทั้ง 3 ด้าน
let currentObjects = [];
let mixers = []; // Array to hold AnimationMixers for each model
let clock = new THREE.Clock(); // Clock for animations
let isAutoSpinning = false;

const modelLibrary = {
    "Sohn_DoorLock_100463952": "https://LittleStarOnGH.github.io/Tuesdaytest/Sohn_DoorLock_100463952.glb",
    "artifact1": "https://LittleStarOnGH.github.io/Tuesdaytest/artifact1.glb",
    "Dragon2": "https://LittleStarOnGH.github.io/Tuesdaytest/Dragon2.glb",
    "astronaut": "https://LittleStarOnGH.github.io/Tuesdaytest/astronaut.glb"
};

let currentModel = "artifact1"; // Default model
const angles = [0, 120, 240]; // องศาสำหรับจัดวางสามทิศทาง
const loader = new THREE.GLTFLoader();

function init() {
    const container = document.getElementById("hologram-container");
    if (!container) return;

    container.innerHTML = ''; // clear the old content

    //create black bg
    scene = new THREE.Scene();

    //การลบรอยหยัก, เปิดช่องโปร่งใส
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);

    //renderer.setClearColor(Colour code Hexadecimal, opacity 0-1 โปร่งใส และทึบ);
    renderer.setClearColor(0x000000, 1);
    renderer.outputEncoding = THREE.sRGBEncoding; // บังคับให้เรนเดอร์สีแบบ sRGB (สว่างและสมจริงขึ้น)
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // ระบบปรับสมดุลแสงไม่ให้จ้าจนภาพแตก
    renderer.toneMappingExposure = 0.6; // ตัวคูณความสว่างภาพรวม (ปรับเลขได้ตามต้องการ)

    //เหมือนกับการเอา canvas ของ renderer ไปใส่ใน container ของ html
    container.appendChild(renderer.domElement);

    //create a camera and create the perspective of it (แกน Z) to the cenre point (0,0,0)
    //THREE.PerspectiveCamera(field of view, aspect ratio, near clipping plane, far clipping plane)
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    
    camera.position.set(0, 0, 20); //camera proscpective
    camera.lookAt(0, 0, 0);

    //create light for the glb model
    //THREE.AmbientLight(color, intensity)
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);
    
    //THREE.DirectionalLight(color, intensity)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    
    directionalLight.position.set(0, 5, 5);
    scene.add(directionalLight);

    //add a group to hold the hologram models
    hologramGroup = new THREE.Group();
    scene.add(hologramGroup);
    
    Load_Model(currentModel);
    animate(); 
}

//animate a loop to rotate the hologram models
function animate() {
    requestAnimationFrame(animate);

    // กำหนดแกน World ไว้สำหรับใช้อ้างอิง
    const xAxis = new THREE.Vector3(1, 0, 0); // แกน X แนวนอนหน้าจอ (ทำให้หมุนแนวตั้ง)
    const yAxis = new THREE.Vector3(0, 1, 0); // แกน Y แนวตั้งหน้าจอ (ทำให้หมุนแนวนอน)

    // เช็กตัวแปร isAutoSpinning เพื่อหยุดตอนใช้ Live Camera
    if (isAutoSpinning && currentObjects.length > 0) {
        for (let i = 0; i < currentObjects.length; i++) {
            if (i === 0 || i === 1) {
                // ซ้าย (0) และ ขวา (1) ให้หมุนแนวตั้ง
                currentObjects[i].rotateOnWorldAxis(xAxis, 0.01);
            } else {
                // ล่าง (2) ให้หมุนแนวนอนเหมือนเดิม
                currentObjects[i].rotateOnWorldAxis(yAxis, 0.01);
            }
        }
    }
    //render the scene and the camera
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
    
}

function Display_Screen() {   
    //hide the mode - add the hidden class in css
    document.getElementById('mode').classList.add('hidden');
    
    //remove hidden class in css
    document.getElementById('screen-view').classList.remove('hidden');
    
    //start the Three.js
    init(); 
    Start_Screen(); // Call the Start_Screen function to initiate the screen connection
}

function Start_Screen() {
    const roomCode = Math.floor(1000 + Math.random() * 9000).toString(); // Generate a random 4-digit room co
    const hostPeerID = "uea-" + roomCode;

    peer = new Peer(hostPeerID);

    peer.on('open', function (id) {
        console.log("Code: " + roomCode);
        
        //get the room code
        document.getElementById("hologram-room-number").innerText = "UEA:"+ roomCode;
    });    

    // this one still not working.. need to revisit and debug
    peer.on('connection', function (conn) {
        console.log("Guest connected with ID: " + conn.peer);
        conn.on('data', function (data) {


            if (data.action === "changeModel") {
                Load_Model(data.value);
            }
            
            else if (data.action === "rotateTouchpad") {
                if (hologramGroup) {
                    hologramGroup.rotation.z += data.value;
                }
            }
            else if (data.action === "rotateTouchpad-2") {
                // การหมุนด้วย Touchpad อันใหม่ สำหรับหมุนเฉพาะตัววัตถุ
                const xAxis = new THREE.Vector3(1, 0, 0); 
                const yAxis = new THREE.Vector3(0, 1, 0); 

                if (currentObjects && currentObjects.length > 0) {
                    for (let i = 0; i < currentObjects.length; i++) {
                        // ปรับความไวด้วยการคูณ 0.5 
                        if (i === 0 || i === 1) {
                            currentObjects[i].rotateOnWorldAxis(xAxis, data.value * 0.5);
                        } else {
                            currentObjects[i].rotateOnWorldAxis(yAxis, data.value * 0.5);
                        }
                    }
                }
            }
            else if (data.action === "updateOffsetLR") {
                if (currentObjects && currentObjects.length === 3) {
                    currentObjects[0].position.x = -data.value; // ดันตัวซ้ายไปทางซ้าย
                    currentObjects[1].position.x = data.value;  // ดันตัวขวาไปทางขวา
                }
            }
            else if (data.action === "updateOffsetTop") {
                if (currentObjects && currentObjects.length === 3) {
                    currentObjects[2].position.y = data.value; // ดันตัวล่างขึ้นลงตามค่าที่ส่งมา
                }
            }

            else if (data.action === "updateScale") {
                if (currentObjects && currentObjects.length > 0) {
                    for (let i = 0; i < currentObjects.length; i++) {
                        // อัปเดตสเกล X, Y, Z พร้อมกัน
                        currentObjects[i].scale.set(data.value, data.value, data.value);
                    }
                }
            }
            else if (data.action === "updateSideY") {
                if (currentObjects && currentObjects.length === 3) {
                    currentObjects[0].position.y = data.value;
                    currentObjects[1].position.y = data.value;
                }
            }
            
           
            // ... โค้ดรับคำสั่งเดิมของคุณ (rotateTouchpad, updateScale, ฯลฯ) ...

            // 1. รับคำสั่งเปลี่ยนสี
            else if (data.action === "changeColor") {
                if (currentObjects && currentObjects.length > 0) {
                    for (let i = 0; i < currentObjects.length; i++) {
                        // หากเป็นโมเดลที่เป็น Geometry พื้นฐาน (มี Material โดยตรง)
                        if (currentObjects[i].isMesh && currentObjects[i].material) {
                            currentObjects[i].material.color.set(data.value);
                        } 
                        // หากเป็นโมเดล GLTF ที่ซ้อนกันหลายชั้น
                        else {
                            currentObjects[i].traverse((child) => {
                                if (child.isMesh && child.material && child.material.color) {
                                    // เปลี่ยนสีเฉพาะวัสดุที่รองรับการเปลี่ยนสี
                                    child.material.color.set(data.value);
                                }
                            });
                        }
                    }
                }
            }

            // 2. รับคำสั่งเปิด/ปิด กล่องโค้ดบนจอ
            else if (data.action === "toggleCodeBox") {
                const codeBox = document.getElementById("room-code-display-box");
                if (codeBox) {
                    // สลับการตั้งค่า display ระหว่าง none (ซ่อน) และ block (แสดง)
                    if (codeBox.style.display === "none") {
                        codeBox.style.display = "block";
                    } else {
                        codeBox.style.display = "none";
                    }
                }
            }
        });
    });
}

function Geometric_Shape(shapeName) {
    isAutoSpinning = true; // เปิดการหมุนอัตโนมัติเมื่อโหลดโมเดลใหม่

    let baseModel; // เปลี่ยนจากประกาศแค่ geometry เป็นประกาศกลุ่มวัตถุแทน

    //THREE.BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments)
    if (shapeName === "Cube") {
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ffcc, roughness: 0.2, metalness: 0.8 });
        baseModel = new THREE.Mesh(geometry, material);
    } 

    //THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments)
    else if (shapeName === "Torus") {
        const geometry = new THREE.TorusGeometry(1.5, 0.5, 16, 100);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ffcc, roughness: 0.2, metalness: 0.8 });
        baseModel = new THREE.Mesh(geometry, material);
    } 
    else if (shapeName =="TrefoilKnot"){
        const geometry = new THREE.TorusKnotGeometry()
        const material = new THREE.MeshStandardMaterial({ color: 0x00ffcc, roughness: 0.2, metalness: 0.8 });
        baseModel = new THREE.Mesh(geometry, material);
    }    
    
    else if (shapeName === "FigureEightPolynomialKnot") {
        // 1. สร้างตัวเส้นโค้งคณิตศาสตร์ขึ้นมาก่อน
        const knotCurve = new THREE.Curves.FigureEightPolynomialKnot(0.3);
        
        // 2. ใช้ TubeGeometry รีดท่อ 3 มิติวิ่งไปตามแนวเส้นโค้งนั้น
        // THREE.TubeGeometry(path, tubularSegments, radius, radialSegments, closed)
        const geometry = new THREE.TubeGeometry(knotCurve, 64, 0.3, 8, true);

        // 3. ใส่ Material และประกอบร่างเป็น Mesh ตามปกติของคุณ
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00ffcc, 
            roughness: 0.1, 
            metalness: 0.8,

        });

        
        baseModel = new THREE.Mesh(geometry, material);
        baseModel.scale.set(0.2,0.2,0.2);
    }


    else if (shapeName === "NewShape") {
        baseModel = new THREE.Group(); // สร้างกลุ่มย่อยขึ้นมาเพื่อจับรูปทรงซ้อนกัน

        // 1. สร้างโครงสร้างรูปทรง 20 หน้า (Icosahedron)
        // THREE.IcosahedronGeometry(radius, detail)
        const coreGeometry = new THREE.IcosahedronGeometry(1.5, 0); 

        // 2. สร้างโครงลวดด้านนอก (Outer Wireframe) สีฟ้านีออนแบบสว่างไม่สนแสงเงา
        const wireMaterial = new THREE.MeshBasicMaterial({
            color: 0x00d2ff,
            wireframe: true,       // เปิดโหมดโครงลวดแบบในรูปภาพเด๊ะๆ
            transparent: true,
            opacity: 0.9
        });
        const outerWire = new THREE.Mesh(coreGeometry, wireMaterial);
        baseModel.add(outerWire); // ใส่เข้าไปในกลุ่มย่อย

        // 3. สร้างแกนเรืองแสงตรงกลาง (Inner Solid Core) เพื่อให้ดูมีพลังงานซ่อนอยู่
        const innerMaterial = new THREE.MeshBasicMaterial({
            color: 0x0055ff,
            transparent: true,
            opacity: 0.4,          // ตั้งค่าให้โปร่งแสงเพื่อความนุ่มนวล
            blending: THREE.AdditiveBlending // ทำให้วัตถุเรืองแสงสว่างขึ้นเมื่อซ้อนทับกัน
        });
        const innerCore = new THREE.Mesh(coreGeometry, innerMaterial);
        innerCore.scale.set(0.6, 0.6, 0.6); // ย่อขนาดให้อยู่ตรงกลางพอดี
        baseModel.add(innerCore); // ใส่เข้าไปในกลุ่มย่อย
    }

    // --- ส่วนจัดวางตำแหน่ง 3 ด้าน (ยกโค้ดลูปเดิมของคุณมาใช้ได้เลย) ---
    const offsetX = 3; 
    const offsetY = 3; 

    for (let i = 0; i < angles.length; i++) {
            let modelClone = baseModel.clone(); // หรือ THREE.SkeletonUtils.clone(baseModel);

            if (i === 0) {
                // --- ฝั่งซ้าย (Left Object) ---
                // หมุนตามเข็มนาฬิกา 90 องศา เพื่อให้ฐานหันเข้าหาจุดศูนย์กลางจอ (ด้านขวาของมัน)
                modelClone.position.set(-offsetX, 0, 0);
                modelClone.rotation.set(0, 0, THREE.MathUtils.degToRad(-90));
            
            } else if (i === 1) {
                // --- ฝั่งขวา (Right Object) ---
                // หมุนทวนเข็มนาฬิกา 90 องศา เพื่อให้ฐานหันเข้าหาจุดศูนย์กลางจอ (ด้านซ้ายของมัน)
                modelClone.position.set(offsetX, 0, 0);
                modelClone.rotation.set(0, 0, THREE.MathUtils.degToRad(90));

            } else if (i === 2) {
                // --- ฝั่งล่าง (Top Object) ---
                // ตั้งตรงปกติ ฐานอยู่ด้านยน เพื่อให้ฐานหันเข้าหาจุดศูนย์กลางจอ
                modelClone.position.set(0, offsetY, 0);
                modelClone.rotation.set(0, 0, THREE.MathUtils.degToRad(180));
            }

            hologramGroup.add(modelClone);
            currentObjects.push(modelClone);
        }    
}

function Load_Model(modelName) {

    isAutoSpinning = true; // เปิดการหมุนอัตโนมัติเมื่อโหลดโมเดลใหม่
    const checkGeometricShape = (modelName === "Cube" || 
    modelName === "Torus" || 
    modelName ==="TrefoilKnot"||
    modelName === "FigureEightPolynomialKnot" ||
    modelName === "NewShape");

    const checkLiveCam = (modelName === "LiveCamera"); 
    if (!checkGeometricShape && !checkLiveCam && !modelLibrary[modelName]) {
        console.error("model name not found:", modelName);
        return;
    }

    currentObjects = []; 
    mixers = []; // ล้างแอนิเมชันเก่าออกให้หมดก่อนโหลดตัวใหม่
    
    if (hologramGroup) {
        while(hologramGroup.children.length > 0){ 
            hologramGroup.remove(hologramGroup.children[0]); 
        }
        hologramGroup.rotation.set(0, 0, 0); // รีเซ็ตการหมุน
    }
    
    if (checkGeometricShape) {
        Geometric_Shape(modelName);
        return; // ออกจากฟังก์ชันเพราะเราไม่ต้องโหลดไฟล์ GLB
    }

    if (checkLiveCam) {
        startLiveCameraHologram();
        return;
    }
    const modelUrl = modelLibrary[modelName];

    loader.load(modelUrl, function (gltf) {
        const baseModel = gltf.scene;
        
        // --- NEW DRAGON FIX START ---
        baseModel.traverse((child) => {
            if (child.isMesh) {
                child.frustumCulled = false; 

                // 1. ดึงพื้นผิวเดิมมาใช้ (Texture Fix)
                if (modelName === "Dragon2" && child.material) {
                    const originalTexture = child.material.map; 
                    
                    // เปลี่ยนจาก MeshStandardMaterial เป็น MeshBasicMaterial
                    child.material = new THREE.MeshBasicMaterial({
                        map: originalTexture, 
                        side: THREE.DoubleSide 
                    });
                
                }
            }
        });
        

        //dragon fix end

        baseModel.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(baseModel);
        const size = new THREE.Vector3();
        box.getSize(size); 

        let maxDim = Math.max(size.x, size.y, size.z);
        
        let automaticScale;
        const targetSize = 2.0; 

        // 3. Manual scale override
        if (modelName === "Dragon2") {
            // IMPORTANT: If the dragon is still invisible, it might just be the wrong size.
            // Change this number to 0.05, 5.0, or 50.0 until it pops into view.
            automaticScale = 0.5; 
        } else {
            if (maxDim < 0.001) {
                console.warn("Detected missing dimensions. Applying standard scale.");
                maxDim = 1.0; 
            }
            automaticScale = targetSize / maxDim;
        }
        
        baseModel.scale.set(automaticScale, automaticScale, automaticScale);

        const offsetX = 3; 
        const offsetY = 3; 

        for (let i = 0; i < angles.length; i++) {
            
            let modelClone;
            // โค้ดตรงนี้คือหัวใจสำคัญที่แก้บั๊กมังกรจอดำ
            if (typeof THREE.SkeletonUtils !== 'undefined') {
                modelClone = THREE.SkeletonUtils.clone(baseModel);
            } else {
                modelClone = baseModel.clone(); 
            }
            

            if (i === 0) {
            modelClone.position.x = -offsetX;
            modelClone.position.y = 0; // ตั้งค่า Y เป็น 0 เพื่อให้ตรงกลาง
            modelClone.rotation.z = THREE.MathUtils.degToRad(-90);
        
            } else if (i === 1) {
            modelClone.position.x = offsetX;
            modelClone.position.y = 0; // ตั้งค่า Y เป็น 0 เพื่อให้ตรงกลาง
            modelClone.rotation.z = THREE.MathUtils.degToRad(90);
            } else if (i === 2) {
            modelClone.position.x = 0; // ตั้งค่า X เป็น 0 เพื่อให้ตรงกลาง
            modelClone.position.y = offsetY;
            modelClone.rotation.z = THREE.MathUtils.degToRad(180);
        }

            hologramGroup.add(modelClone);
            currentObjects.push(modelClone);

           // ถ้ามี Animation ให้ดึงมาเล่นทุกคลิปที่มีในไฟล์
          // 2. แก้ไขแอนิเมชันให้ถูกต้อง
            if (gltf.animations && gltf.animations.length > 0) {
                
                // คำสั่งสืบสวน: ให้คุณกด F12 ดูใน Console ว่ามังกรตัวนี้มีท่าอะไรบ้าง!
                console.log("🕵️ ท่าทางทั้งหมดของมังกรมีดังนี้:", gltf.animations);

                const mixer = new THREE.AnimationMixer(modelClone);
                
                // ลองกลับไปใช้ Index 0 หรือลองเปลี่ยนเป็น 2 ดูครับ (มักจะเป็นท่าบิน)
                const animationIndex = 0; 
                
                if (gltf.animations[animationIndex]) {
                    const action = mixer.clipAction(gltf.animations[animationIndex]);
                    action.play();
                } 
                
                mixers.push(mixer);
            }
        }
        
        console.log("Successfully loaded 3 sides of " + modelName);
        
    }, 
    undefined, 
    function (error) {
        console.error("cant load the glb file", error);
    });
}

function startLiveCameraHologram() {
    isAutoSpinning = false; // ปิดการหมุนอัตโนมัติเมื่อใช้ Live Camera
    const video = document.getElementById('webcam-video');

    // ตรวจสอบว่าบราวเซอร์รองรับการเปิดกล้องหรือไม่
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        
        // ขออนุญาตเปิดกล้องวิดีโอ
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                video.srcObject = stream;
                video.play();

                // แปลงวิดีโอสดให้กลายเป็นพื้นผิว 3 มิติ
                const texture = new THREE.VideoTexture(video);
                
                // สร้างแผ่นสี่เหลี่ยมแบนๆ อัตราส่วน 16:9 
                const geometry = new THREE.PlaneGeometry(4, 3); 
                const material = new THREE.MeshBasicMaterial({ 
                    map: texture, 
                    side: THREE.DoubleSide // ให้ภาพแสดงทั้งด้านหน้าและหลัง
                });
                
                const baseModel = new THREE.Mesh(geometry, material);

                // --- ส่วนจัดวางตำแหน่ง 3 ด้าน ---
                const offsetX = 3; 
                const offsetY = 3; 

                for (let i = 0; i < angles.length; i++) {
                    const modelClone = baseModel.clone();

            
                if (i === 0) {
                modelClone.position.x = -offsetX;
                modelClone.position.y = 0; // ตั้งค่า Y เป็น 0 เพื่อให้ตรงกลาง
                modelClone.rotation.z = THREE.MathUtils.degToRad(-90);
        
                } else if (i === 1) {
                    modelClone.position.x = offsetX;
                    modelClone.position.y = 0; // ของเดิมคุณเขียน position.z = 0 แก้เป็น y ซะ
                    modelClone.rotation.z = THREE.MathUtils.degToRad(90); // ของเดิมคุณสั่ง rotation.y มันเลยพับลึกลงไปในจอ ต้องใช้แกน z เพื่อหมุนบนหน้าจอ
                
                } else if (i === 2) {
                    modelClone.position.x = 0; // ตั้งค่า X เป็น 0 เพื่อให้ตรงกลาง
                    modelClone.position.y = offsetY;
                    modelClone.rotation.z = THREE.MathUtils.degToRad(180);
                }

                    hologramGroup.add(modelClone);
                    currentObjects.push(modelClone);
                }
                
                console.log("Successfully loaded Live Camera Hologram");
            })
            .catch(function(error) {
                console.error("ไม่สามารถเข้าถึงกล้องได้:", error);
                alert("ระบบต้องการสิทธิ์เข้าถึงกล้องเพื่อแสดงผลโฮโลแกรมสดครับ");
            });
    } else {
        alert("บราวเซอร์ของคุณไม่รองรับการดึงภาพจากกล้องเว็บแคมครับ");
    }
}

// ดักจับเมื่อผู้ใช้ย่อ/ขยายหน้าต่าง Browser
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    const container = document.getElementById("hologram-container");
    if (!container || !camera || !renderer) return;

    // 1. อัปเดตอัตราส่วน (Aspect Ratio) ของกล้องใหม่
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix(); // สั่งให้กล้องคำนวณมุมมองใหม่

    // 2. ปรับขนาดของตัว Render ให้เต็ม Container เท่าขนาดปัจจุบัน
    renderer.setSize(container.clientWidth, container.clientHeight);
}