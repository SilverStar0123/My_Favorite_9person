const canvas = document.getElementById("collageCanvas");
const ctx = canvas.getContext("2d");
 
const centerX = 300;
const centerY = 300;
const radius = 120;

let lineColor = "#000000";
let selectedIndex = 0;
const images = Array(9)
  .fill(null)
  .map(() => ({ img: null, x: 0, y: 0, scale: 1 }));

let isDragging = false;
let startX, startY;
let clickStartX, clickStartY;
let initialDistance = 0;

function initCanvas() {
  canvas.width = 600;
  canvas.height = 600;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function definePath(index) {
  ctx.beginPath();
  if (index === 0) {
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 - Math.PI / 8;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  } else {
    const startAngle = ((index - 1) * Math.PI) / 4 - Math.PI / 8;
    const endAngle = (index * Math.PI) / 4 - Math.PI / 8;

    ctx.moveTo(centerX + radius * Math.cos(startAngle), centerY + radius * Math.sin(startAngle));
    ctx.lineTo(centerX + 800 * Math.cos(startAngle), centerY + 800 * Math.sin(startAngle));
    ctx.arc(centerX, centerY, 800, startAngle, endAngle); // 둥근 호로 외곽선 커버
    ctx.lineTo(centerX + radius * Math.cos(endAngle), centerY + radius * Math.sin(endAngle));
  }
  ctx.closePath();
}


function drawLines() {
  definePath(0);
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 4;
  ctx.stroke();

  for (let i = 1; i <= 8; i++) {
    const angle = ((i - 1) * Math.PI) / 4 - Math.PI / 8;
    const startX = centerX + radius * Math.cos(angle);
    const startY = centerY + radius * Math.sin(angle);
    const endX = centerX + 500 * Math.cos(angle);
    const endY = centerY + 500 * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
}

function updateCanvas() {
  initCanvas();

  for (let i = 0; i < 9; i++) {
    const data = images[i];
    if (data.img) {
      ctx.save();
      definePath(i);
      ctx.clip();
      const width = data.img.width * data.scale;
      const height = data.img.height * data.scale;
      ctx.drawImage(data.img, data.x, data.y, width, height);
      ctx.restore();
    }
  }
  drawLines();
}

function getIndexFromEvent(x, y) {
  const dx = x - centerX;
  const dy = y - centerY;
  if (Math.hypot(dx, dy) <= radius) return 0;

  let angle = Math.atan2(dy, dx) + Math.PI / 8;
  if (angle < 0) angle += 2 * Math.PI;
  return Math.floor(angle / (Math.PI / 4)) + 1;
}

initCanvas();
drawLines();

// 캔버스 크기 비율에 맞춰 좌표를 보정하는 함수
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  let cx = e.clientX;
  let cy = e.clientY;

  if (e.touches && e.touches.length > 0) {
    cx = e.touches[0].clientX;
    cy = e.touches[0].clientY;
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    cx = e.changedTouches[0].clientX;
    cy = e.changedTouches[0].clientY;
  }

  return {
    x: (cx - rect.left) * scaleX,
    y: (cy - rect.top) * scaleY,
  };
}

// 마우스 이벤트
canvas.addEventListener("mousedown", (e) => {
  const pos = getPos(e);
  clickStartX = pos.x;
  clickStartY = pos.y;
  selectedIndex = getIndexFromEvent(pos.x, pos.y);

  const data = images[selectedIndex];
  if (data.img) {
    isDragging = true;
    startX = pos.x - data.x;
    startY = pos.y - data.y;
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  const pos = getPos(e);
  const data = images[selectedIndex];
  data.x = pos.x - startX;
  data.y = pos.y - startY;
  updateCanvas();
});

canvas.addEventListener("mouseup", (e) => {
  isDragging = false;
  const pos = getPos(e);
  if (Math.abs(pos.x - clickStartX) < 5 && Math.abs(pos.y - clickStartY) < 5) {
    selectedIndex = getIndexFromEvent(pos.x, pos.y);
    document.getElementById("imageInput").click();
  }
});

canvas.addEventListener("mouseout", () => (isDragging = false));

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const pos = getPos(e);
  const idx = getIndexFromEvent(pos.x, pos.y);
  const data = images[idx];
  if (!data.img) return;
  data.scale += e.deltaY * -0.001;
  data.scale = Math.max(0.1, Math.min(data.scale, 5));
  updateCanvas();
});

// 터치 이벤트
canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    const pos = getPos(e);
    clickStartX = pos.x;
    clickStartY = pos.y;
    selectedIndex = getIndexFromEvent(pos.x, pos.y);

    const data = images[selectedIndex];
    if (data.img) {
      isDragging = true;
      startX = pos.x - data.x;
      startY = pos.y - data.y;
    }
  } else if (e.touches.length === 2) {
    isDragging = false;
    initialDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
});

canvas.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      const pos = getPos(e);
      const data = images[selectedIndex];
      data.x = pos.x - startX;
      data.y = pos.y - startY;
      updateCanvas();
    } else if (e.touches.length === 2) {
      const data = images[selectedIndex];
      if (!data.img) return;
      const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      data.scale *= currentDistance / initialDistance;
      initialDistance = currentDistance;
      updateCanvas();
    }
  },
  { passive: false }
);

canvas.addEventListener("touchend", (e) => {
  isDragging = false;
  if (e.changedTouches.length === 1) {
    const pos = getPos(e);
    if (
      Math.abs(pos.x - clickStartX) < 5 &&
      Math.abs(pos.y - clickStartY) < 5
    ) {
      selectedIndex = getIndexFromEvent(pos.x, pos.y);
      document.getElementById("imageInput").click();
    }
  }
});

// 이미지 업로드
const imageInput = document.getElementById("imageInput");
imageInput.addEventListener("change", function (event) {
  const file = event.target.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.src = e.target.result;

      img.onload = function () {
        const data = images[selectedIndex];
        data.img = img;
        data.scale = 300 / img.width;

        if (selectedIndex === 0) {
          data.x = centerX - (img.width * data.scale) / 2;
          data.y = centerY - (img.height * data.scale) / 2;
        } else {
          const angle = ((selectedIndex - 1) * Math.PI) / 4;
          const targetX = centerX + 180 * Math.cos(angle);
          const targetY = centerY + 180 * Math.sin(angle);
          data.x = targetX - (img.width * data.scale) / 2;
          data.y = targetY - (img.height * data.scale) / 2;
        }
        updateCanvas();
      };
    };
    reader.readAsDataURL(file);
    imageInput.value = "";
  }
});

// 색상, 지우기, 저장 버튼 이벤트
document.getElementById("applyColorBtn").addEventListener("click", () => {
  lineColor = document.getElementById("lineColor").value;
  updateCanvas();
});

document.getElementById("deleteBtn").addEventListener("click", () => {
  images[selectedIndex] = { img: null, x: 0, y: 0, scale: 1 };
  updateCanvas();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  for (let i = 0; i < 9; i++) {
    images[i] = { img: null, x: 0, y: 0, scale: 1 };
  }
  updateCanvas();
});

document.getElementById("saveBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "my_favorite_9.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
