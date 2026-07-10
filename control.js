let guestPeer; 
let connection;

function Connect_Screen() {

    const roomCode = document.getElementById("room-code-input").value;
    
    if (!roomCode) {
        alert("Please enter the 4-digit room code first!");
        return;
    }
    console.log("Connecting to the screen...");
    
    guestPeer = new Peer();
    guestPeer.on("open", function () {
        const peerID = "uea-" + roomCode;
        connection = guestPeer.connect(peerID); 
        
        connection.on("open", function () {
            console.log("Connected to the screen with ID: " + peerID);
            
            // สลับหน้าจอ UI ของคุณ
            document.getElementById('mode').classList.add('hidden');
            document.getElementById('controller-view').classList.remove('hidden');
            
            setupTouchpad("touchpad", "rotateTouchpad");
            setupTouchpad("touchpad-2", "rotateTouchpad-2"); 
        });

        connection.on("error", function(err) {
            console.error("Connection error:", err);
            alert("Connect failed. Please check the code.");
        });
    });
}
function setupTouchpad(elementId, actionName) {
    const touchpad = document.getElementById(elementId);
    if (!touchpad) {
        return;
    }

    let isDragging = false;
    let previousX = 0;

    const handleMovement = (currentX) => {
        let deltaX = currentX - previousX;
        previousX = currentX;
        if (connection && connection.open) {
            // ส่ง Action ตามที่ถูกเรียกใช้งาน (rotateTouchpad หรือ rotateLocal)
            connection.send({ action: actionName, value: deltaX * 0.1 });
        }
    };

    touchpad.addEventListener("touchstart", (event) => {
        isDragging = true;
        previousX = event.touches[0].clientX;
    }, { passive: false });

    touchpad.addEventListener("touchmove", function(e) {
        if (!isDragging) return;
        e.preventDefault(); 
        handleMovement(e.touches[0].clientX);
    }, {passive: false});

    touchpad.addEventListener("touchend", function() { isDragging = false; });

    // เผื่อใช้เมาส์ลากบนคอมพิวเตอร์ (Mouse Events)
    touchpad.addEventListener("mousedown", function(e) {
        isDragging = true;
        previousX = e.clientX;
    });
    touchpad.addEventListener("mousemove", function(e) {
        if (!isDragging) return;
        handleMovement(e.clientX);
    });
    touchpad.addEventListener("mouseup", function() { isDragging = false; });
    touchpad.addEventListener("mouseleave", function() { isDragging = false; });
}

function Update_Offset_LR(value) {
    if (connection && connection.open) {
        connection.send({ action: "updateOffsetLR", value: parseFloat(value) });
    }
}

function Update_Offset_Top(value) {
    if (connection && connection.open) {
        connection.send({ action: "updateOffsetTop", value: parseFloat(value) });
    }
}
function sendRotationEvent(deltaX) {
    if (connection && connection.open) {
        // คูณ 0.01 เพื่อลดความไว (Sensitivity) ไม่ให้มันหมุนเร็วเกินไป
        const command = {
            action: "rotateTouchpad",
            value: deltaX * 0.1 
        };
        connection.send(command);
    }
}

function Update_Scale(value) {
    if (connection && connection.open) {
        // parseFloat เพื่อแปลงข้อมูลจาก String ของ Slider ให้เป็นตัวเลขทศนิยม
        connection.send({ action: "updateScale", value: parseFloat(value) });
    }
}

function Update_Offset(value) {
    if (connection && connection.open) {
        connection.send({ action: "updateOffset", value: parseFloat(value) });
    }
}

function Update_Side_Y(value) {
    if (connection && connection.open) {
        connection.send({ action: "updateSideY", value: parseFloat(value) });
    }
}

function Select_Model(modelName) {
    if (connection && connection.open) {
        const command = {
            action: "changeModel",
            value: modelName // ส่งชื่อคีย์ files.
        };
        connection.send(command);
        console.log("Sent command:", command);
    } else {
        alert("Remote disconnected. Please connect again.");
    }
}

function Change_Color(hexColor) {
    if (connection && connection.open) {
        connection.send({ action: "changeColor", value: hexColor });
    }
}

function Toggle_Code_Box() {
    if (connection && connection.open) {
        connection.send({ action: "toggleCodeBox" });
    }
}

