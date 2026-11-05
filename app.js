(function(){
  "use strict";

  var RATIOS = {
    "1:1":  { w: 1080, h: 1080 },
    "4:5":  { w: 1080, h: 1350 },
    "9:16": { w: 1080, h: 1920 }
  };
  var STORAGE_KEY = "imgEditor.templates.v1";
  var REQUIRED_FIELDS = ["id","name","ratio","text","textX","textY","fontSize","color"];

  var DEFAULT_TEMPLATES = [
    {
      id: "tpl_preset_meme",
      name: "밈(짤방) 기본 자막",
      ratio: "1:1",
      text: "아… 오늘도 야근각인가 😂",
      textX: 0.5,
      textY: 0.86,
      fontSize: 72,
      color: "#ffffff",
      fontFamily: "'Do Hyeon', sans-serif",
      textAlign: "center",
      strokeWidth: 10,
      strokeColor: "#000000",
      bgBox: false,
      shadow: true,
      subText: "직장인 공감.jpg",
      subY: 0.12,
      subSize: 44,
      imageFit: "cover",
      bgFill: true,
      bgColor: "#1e293b",
      dim: 0
    },
    {
      id: "tpl_preset_card",
      name: "인스타 감성 카드뉴스",
      ratio: "4:5",
      text: "작은 습관이 모여\n결국 큰 변화를 만듭니다 ✨",
      textX: 0.5,
      textY: 0.52,
      fontSize: 56,
      color: "#ffffff",
      fontFamily: "'Gaegu', sans-serif",
      textAlign: "center",
      strokeWidth: 0,
      strokeColor: "#000000",
      bgBox: true,
      shadow: true,
      subText: "DAILY INSIGHT · 01",
      subY: 0.16,
      subSize: 34,
      imageFit: "cover",
      bgFill: true,
      bgColor: "#0f172a",
      dim: 35
    },
    {
      id: "tpl_preset_notice",
      name: "특가·공지 스토리 카드",
      ratio: "9:16",
      text: "이번 주말 한정\n전 품목 30% 할인 🔥",
      textX: 0.5,
      textY: 0.55,
      fontSize: 76,
      color: "#fef08a",
      fontFamily: "'Jua', sans-serif",
      textAlign: "center",
      strokeWidth: 8,
      strokeColor: "#0f172a",
      bgBox: false,
      shadow: true,
      subText: "📢 SPECIAL EVENT",
      subY: 0.22,
      subSize: 46,
      imageFit: "cover",
      bgFill: true,
      bgColor: "#0284c7",
      dim: 20
    }
  ];

  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");

  var imageInput = document.getElementById("image-input");
  var imageError = document.getElementById("image-error");
  var dropZone = document.getElementById("drop-zone");
  var canvasDropZone = document.getElementById("canvas-drop-zone");
  var fitBtns = document.querySelectorAll(".seg-btn[data-fit]");
  var imageClearBtn = document.getElementById("image-clear");
  var bgFillCheck = document.getElementById("bg-fill-check");
  var bgColorInput = document.getElementById("bg-color-input");
  var dimRange = document.getElementById("dim-range");
  var dimOut = document.getElementById("dim-out");

  var ratioBtns = document.querySelectorAll(".ratio-btn");

  var textInput = document.getElementById("text-input");
  var emojiBtns = document.querySelectorAll(".emoji-btn");
  var fontSelect = document.getElementById("font-select");
  var alignBtns = document.querySelectorAll(".align-btn");
  var xRange = document.getElementById("x-range");
  var yRange = document.getElementById("y-range");
  var sizeRange = document.getElementById("size-range");
  var colorInput = document.getElementById("color-input");
  var strokeColorInput = document.getElementById("stroke-color");
  var strokeRange = document.getElementById("stroke-range");
  var strokeOut = document.getElementById("stroke-out");
  var bgBoxCheck = document.getElementById("bg-box-check");
  var shadowCheck = document.getElementById("shadow-check");

  var subtextInput = document.getElementById("subtext-input");
  var subYRange = document.getElementById("sub-y-range");
  var subYOut = document.getElementById("sub-y-out");
  var subSizeRange = document.getElementById("sub-size-range");
  var subSizeOut = document.getElementById("sub-size-out");

  var xOut = document.getElementById("x-out");
  var yOut = document.getElementById("y-out");
  var sizeOut = document.getElementById("size-out");

  var tplName = document.getElementById("tpl-name");
  var tplSave = document.getElementById("tpl-save");
  var tplPresets = document.getElementById("tpl-presets");
  var tplMsg = document.getElementById("tpl-msg");
  var tplList = document.getElementById("tpl-list");
  var jsonExport = document.getElementById("json-export");
  var jsonImport = document.getElementById("json-import");
  var downloadBtn = document.getElementById("download");

  var state = {
    ratio: "1:1",
    image: null,
    imageFit: "cover",
    bgFill: true,
    bgColor: "#1e293b",
    dim: 0,
    text: "안녕하세요",
    textX: 0.5,
    textY: 0.8,
    fontSize: 64,
    color: "#ffffff",
    fontFamily: "'Gaegu', sans-serif",
    textAlign: "center",
    strokeWidth: 6,
    strokeColor: "#000000",
    bgBox: false,
    shadow: true,
    subText: "",
    subY: 0.15,
    subSize: 40
  };

  function uid(){
    return "tpl_" + Date.now() + "_" + Math.random().toString(36).slice(2,8);
  }

  function showMsg(el, msg, isError){
    if(!msg){
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = msg;
    if(isError){
      el.setAttribute("role", "alert");
      el.classList.remove("ok");
    } else {
      el.removeAttribute("role");
      el.classList.add("ok");
    }
  }

  function loadTemplates(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return [];
      var arr = JSON.parse(raw);
      if(!Array.isArray(arr)) return [];
      return arr.filter(function(t){
        return t && typeof t === "object" && REQUIRED_FIELDS.every(function(f){ return f in t; });
      });
    }catch(e){
      return [];
    }
  }

  function saveTemplates(arr){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      return true;
    }catch(e){
      return false;
    }
  }

  function initDefaultTemplatesIfEmpty(){
    try{
      if(localStorage.getItem(STORAGE_KEY) === null){
        saveTemplates(DEFAULT_TEMPLATES);
      }
    }catch(e){}
  }

  function applyRatio(ratio){
    state.ratio = ratio;
    var r = RATIOS[ratio] || RATIOS["1:1"];
    canvas.width = r.w;
    canvas.height = r.h;
    for(var i=0;i<ratioBtns.length;i++){
      ratioBtns[i].setAttribute("aria-pressed", ratioBtns[i].getAttribute("data-ratio") === ratio ? "true" : "false");
    }
    draw();
  }

  function updateToggleGroup(buttons, attr, val){
    for(var i=0;i<buttons.length;i++){
      buttons[i].setAttribute("aria-pressed", buttons[i].getAttribute(attr) === val ? "true" : "false");
    }
  }

  function wrapText(text, maxWidth){
    if(!text) return [];
    var lines = [];
    var paragraphs = String(text).split("\n");
    for(var p=0; p<paragraphs.length; p++){
      var para = paragraphs[p];
      if(para.length === 0){ lines.push(""); continue; }
      var chars = Array.from(para);
      var current = "";
      for(var i=0;i<chars.length;i++){
        var ch = chars[i];
        var test = current + ch;
        if(ctx.measureText(test).width > maxWidth && current.length > 0){
          lines.push(current);
          current = ch;
        } else {
          current = test;
        }
      }
      if(current.length > 0) lines.push(current);
    }
    return lines;
  }

  function drawRoundedRect(x, y, w, h, r){
    var radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function renderTextBlock(text, normX, normY, fontSize, isSub){
    if(!text || text.length === 0) return;
    var w = canvas.width;
    var h = canvas.height;
    var size = Math.max(12, fontSize);

    ctx.save();
    ctx.font = "bold " + size + "px " + state.fontFamily + ", \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Noto Color Emoji\"";
    ctx.textAlign = state.textAlign || "center";
    ctx.textBaseline = "middle";

    var maxWidth = w * 0.9;
    var lines = wrapText(text, maxWidth);
    if(lines.length === 0){
      ctx.restore();
      return;
    }

    var lineHeight = size * 1.3;
    var totalHeight = lines.length * lineHeight;
    var anchorX = normX * w;
    var startY = normY * h - totalHeight / 2 + lineHeight / 2;

    if(state.bgBox){
      var maxLineW = 0;
      for(var m=0;m<lines.length;m++){
        var lw = ctx.measureText(lines[m]).width;
        if(lw > maxLineW) maxLineW = lw;
      }
      var padX = size * 0.45;
      var padY = size * 0.28;
      var boxW = maxLineW + padX * 2;
      var boxH = totalHeight + padY * 2;
      var boxX = anchorX - boxW / 2;
      if(state.textAlign === "left") boxX = anchorX - padX;
      else if(state.textAlign === "right") boxX = anchorX - maxLineW - padX;
      var boxY = normY * h - totalHeight / 2 - padY;

      ctx.save();
      ctx.fillStyle = isSub ? "rgba(15, 23, 42, 0.72)" : "rgba(0, 0, 0, 0.62)";
      drawRoundedRect(boxX, boxY, boxW, boxH, 16);
      ctx.fill();
      ctx.restore();
    }

    if(state.shadow){
      ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
      ctx.shadowBlur = Math.max(4, Math.round(size * 0.12));
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = Math.max(2, Math.round(size * 0.06));
    }

    var strokeW = isSub ? Math.round(state.strokeWidth * 0.75) : state.strokeWidth;
    if(strokeW > 0){
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.lineWidth = strokeW * 2;
      ctx.strokeStyle = state.strokeColor || "#000000";
      for(var s=0;s<lines.length;s++){
        ctx.strokeText(lines[s], anchorX, startY + s * lineHeight);
      }
    }

    ctx.shadowColor = "transparent";
    ctx.fillStyle = state.color;
    for(var i=0;i<lines.length;i++){
      ctx.fillText(lines[i], anchorX, startY + i * lineHeight);
    }
    ctx.restore();
  }

  function draw(){
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if(state.bgFill){
      ctx.fillStyle = state.bgColor || "#1e293b";
      ctx.fillRect(0, 0, w, h);
    }

    if(state.image){
      var img = state.image;
      var iw = img.naturalWidth || img.width;
      var ih = img.naturalHeight || img.height;
      var scale = state.imageFit === "contain"
        ? Math.min(w / iw, h / ih)
        : Math.max(w / iw, h / ih);
      var dw = iw * scale;
      var dh = ih * scale;
      var dx = (w - dw) / 2;
      var dy = (h - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    if(state.dim > 0){
      ctx.fillStyle = "rgba(0, 0, 0, " + (state.dim / 100) + ")";
      ctx.fillRect(0, 0, w, h);
    }

    if(state.subText && state.subText.trim().length > 0){
      renderTextBlock(state.subText, state.textX, state.subY, state.subSize, true);
    }

    if(state.text && state.text.length > 0){
      renderTextBlock(state.text, state.textX, state.textY, state.fontSize, false);
    }
  }

  function ensureFontAndDraw(){
    draw();
    if(document.fonts && document.fonts.load){
      var size = Math.max(12, state.fontSize) + "px ";
      var sample = (state.text || "") + (state.subText || "") || "안녕하세요";
      Promise.all([
        document.fonts.load("400 " + size + state.fontFamily, sample),
        document.fonts.load("bold " + size + state.fontFamily, sample)
      ]).then(function(){
        draw();
      }).catch(function(){});
    }
  }

  function handleImageFile(file){
    if(!file) return;
    var okTypes = ["image/png","image/jpeg"];
    if(okTypes.indexOf(file.type) === -1){
      showMsg(imageError, "PNG 또는 JPEG 파일만 지원합니다. (" + (file.type || "알 수 없음") + ")", true);
      imageInput.value = "";
      return;
    }
    var reader = new FileReader();
    reader.onload = function(ev){
      var img = new Image();
      img.onload = function(){
        state.image = img;
        showMsg(imageError, "");
        draw();
      };
      img.onerror = function(){
        showMsg(imageError, "이미지를 읽을 수 없습니다. 기존 작업을 유지합니다.", true);
        imageInput.value = "";
      };
      img.src = ev.target.result;
    };
    reader.onerror = function(){
      showMsg(imageError, "파일을 읽을 수 없습니다. 기존 작업을 유지합니다.", true);
      imageInput.value = "";
    };
    reader.readAsDataURL(file);
  }

  imageInput.addEventListener("change", function(e){
    var file = e.target.files && e.target.files[0];
    handleImageFile(file);
  });

  function bindDropZone(zone){
    if(!zone) return;
    zone.addEventListener("dragover", function(e){
      e.preventDefault();
      zone.classList.add("drag-over");
    });
    zone.addEventListener("dragleave", function(){
      zone.classList.remove("drag-over");
    });
    zone.addEventListener("drop", function(e){
      e.preventDefault();
      zone.classList.remove("drag-over");
      var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if(file) handleImageFile(file);
    });
  }
  bindDropZone(dropZone);
  bindDropZone(canvasDropZone);

  window.addEventListener("paste", function(e){
    var items = e.clipboardData && e.clipboardData.items;
    if(!items) return;
    for(var i=0;i<items.length;i++){
      if(items[i].type.indexOf("image/") === 0){
        var file = items[i].getAsFile();
        if(file){
          handleImageFile(file);
          e.preventDefault();
          break;
        }
      }
    }
  });

  for(var f=0;f<fitBtns.length;f++){
    fitBtns[f].addEventListener("click", function(){
      var fit = this.getAttribute("data-fit");
      state.imageFit = fit;
      updateToggleGroup(fitBtns, "data-fit", fit);
      draw();
    });
  }

  imageClearBtn.addEventListener("click", function(){
    state.image = null;
    imageInput.value = "";
    showMsg(imageError, "");
    draw();
  });

  bgFillCheck.addEventListener("change", function(){
    state.bgFill = bgFillCheck.checked;
    draw();
  });

  bgColorInput.addEventListener("input", function(){
    state.bgColor = bgColorInput.value;
    draw();
  });

  dimRange.addEventListener("input", function(){
    state.dim = parseInt(dimRange.value, 10);
    dimOut.textContent = dimRange.value;
    draw();
  });

  for(var i=0;i<ratioBtns.length;i++){
    ratioBtns[i].addEventListener("click", function(){
      var r = this.getAttribute("data-ratio");
      if(RATIOS[r]) applyRatio(r);
    });
  }

  textInput.addEventListener("input", function(){
    state.text = textInput.value;
    draw();
  });

  for(var eIdx=0;eIdx<emojiBtns.length;eIdx++){
    emojiBtns[eIdx].addEventListener("click", function(){
      var emoji = this.getAttribute("data-emoji");
      var start = textInput.selectionStart;
      var end = textInput.selectionEnd;
      var val = textInput.value;
      if(typeof start === "number" && typeof end === "number"){
        textInput.value = val.slice(0, start) + emoji + val.slice(end);
        textInput.selectionStart = textInput.selectionEnd = start + emoji.length;
      } else {
        textInput.value = val + emoji;
      }
      state.text = textInput.value;
      textInput.focus();
      draw();
    });
  }

  fontSelect.addEventListener("change", function(){
    state.fontFamily = fontSelect.value;
    ensureFontAndDraw();
  });

  for(var aIdx=0;aIdx<alignBtns.length;aIdx++){
    alignBtns[aIdx].addEventListener("click", function(){
      var align = this.getAttribute("data-align");
      state.textAlign = align;
      updateToggleGroup(alignBtns, "data-align", align);
      draw();
    });
  }

  xRange.addEventListener("input", function(){
    state.textX = parseFloat(xRange.value);
    xOut.textContent = state.textX.toFixed(2);
    draw();
  });
  yRange.addEventListener("input", function(){
    state.textY = parseFloat(yRange.value);
    yOut.textContent = state.textY.toFixed(2);
    draw();
  });
  sizeRange.addEventListener("input", function(){
    state.fontSize = parseInt(sizeRange.value, 10);
    sizeOut.textContent = sizeRange.value;
    draw();
  });
  colorInput.addEventListener("input", function(){
    state.color = colorInput.value;
    draw();
  });
  strokeColorInput.addEventListener("input", function(){
    state.strokeColor = strokeColorInput.value;
    draw();
  });
  strokeRange.addEventListener("input", function(){
    state.strokeWidth = parseInt(strokeRange.value, 10);
    strokeOut.textContent = strokeRange.value;
    draw();
  });
  bgBoxCheck.addEventListener("change", function(){
    state.bgBox = bgBoxCheck.checked;
    draw();
  });
  shadowCheck.addEventListener("change", function(){
    state.shadow = shadowCheck.checked;
    draw();
  });

  subtextInput.addEventListener("input", function(){
    state.subText = subtextInput.value;
    draw();
  });
  subYRange.addEventListener("input", function(){
    state.subY = parseFloat(subYRange.value);
    subYOut.textContent = state.subY.toFixed(2);
    draw();
  });
  subSizeRange.addEventListener("input", function(){
    state.subSize = parseInt(subSizeRange.value, 10);
    subSizeOut.textContent = subSizeRange.value;
    draw();
  });

  // 캔버스 마우스/터치 드래그로 문구 위치 이동
  var dragTarget = null;
  function getNormCoords(ev){
    var rect = canvas.getBoundingClientRect();
    var clientX = ev.touches && ev.touches[0] ? ev.touches[0].clientX : ev.clientX;
    var clientY = ev.touches && ev.touches[0] ? ev.touches[0].clientY : ev.clientY;
    var nx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    var ny = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    return { x: nx, y: ny };
  }

  canvas.addEventListener("pointerdown", function(ev){
    var pos = getNormCoords(ev);
    if(state.subText && state.subText.trim().length > 0){
      var distMain = Math.abs(pos.y - state.textY);
      var distSub = Math.abs(pos.y - state.subY);
      dragTarget = distSub < distMain ? "sub" : "main";
    } else {
      dragTarget = "main";
    }
    if(canvas.setPointerCapture) canvas.setPointerCapture(ev.pointerId);
    applyDrag(pos);
  });

  canvas.addEventListener("pointermove", function(ev){
    if(!dragTarget) return;
    var pos = getNormCoords(ev);
    applyDrag(pos);
  });

  function endDrag(){
    dragTarget = null;
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  function applyDrag(pos){
    var rx = Math.round(pos.x * 100) / 100;
    var ry = Math.round(pos.y * 100) / 100;
    state.textX = rx;
    xRange.value = rx;
    xOut.textContent = rx.toFixed(2);

    if(dragTarget === "sub"){
      state.subY = ry;
      subYRange.value = ry;
      subYOut.textContent = ry.toFixed(2);
    } else {
      state.textY = ry;
      yRange.value = ry;
      yOut.textContent = ry.toFixed(2);
    }
    draw();
  }

  function syncControlsFromState(){
    textInput.value = state.text;
    fontSelect.value = state.fontFamily;
    xRange.value = state.textX;
    yRange.value = state.textY;
    sizeRange.value = state.fontSize;
    colorInput.value = state.color;
    strokeColorInput.value = state.strokeColor;
    strokeRange.value = state.strokeWidth;
    bgBoxCheck.checked = state.bgBox;
    shadowCheck.checked = state.shadow;

    subtextInput.value = state.subText;
    subYRange.value = state.subY;
    subSizeRange.value = state.subSize;

    bgFillCheck.checked = state.bgFill;
    bgColorInput.value = state.bgColor;
    dimRange.value = state.dim;

    xOut.textContent = state.textX.toFixed(2);
    yOut.textContent = state.textY.toFixed(2);
    sizeOut.textContent = String(state.fontSize);
    strokeOut.textContent = String(state.strokeWidth);
    subYOut.textContent = state.subY.toFixed(2);
    subSizeOut.textContent = String(state.subSize);
    dimOut.textContent = String(state.dim);

    updateToggleGroup(fitBtns, "data-fit", state.imageFit);
    updateToggleGroup(alignBtns, "data-align", state.textAlign);
  }

  function buildTemplatePayload(id, name){
    return {
      id: id,
      name: name,
      ratio: state.ratio,
      text: state.text,
      textX: state.textX,
      textY: state.textY,
      fontSize: state.fontSize,
      color: state.color,
      fontFamily: state.fontFamily,
      textAlign: state.textAlign,
      strokeWidth: state.strokeWidth,
      strokeColor: state.strokeColor,
      bgBox: state.bgBox,
      shadow: state.shadow,
      subText: state.subText,
      subY: state.subY,
      subSize: state.subSize,
      imageFit: state.imageFit,
      bgFill: state.bgFill,
      bgColor: state.bgColor,
      dim: state.dim
    };
  }

  function renderTemplates(){
    var arr = loadTemplates();
    tplList.innerHTML = "";
    if(arr.length === 0){
      var empty = document.createElement("li");
      empty.className = "tpl-empty";
      empty.textContent = "저장된 템플릿이 없습니다.";
      tplList.appendChild(empty);
      return;
    }
    arr.forEach(function(t){
      var li = document.createElement("li");
      li.className = "tpl-item";

      var nameEl = document.createElement("div");
      nameEl.className = "tpl-name";
      nameEl.textContent = t.name || "(이름 없음)";
      li.appendChild(nameEl);

      var metaEl = document.createElement("div");
      metaEl.className = "tpl-meta";
      metaEl.textContent = t.ratio + " · " + t.fontSize + "px · " + t.color + (t.subText ? " · 보조문구" : "");
      li.appendChild(metaEl);

      var actions = document.createElement("div");
      actions.className = "tpl-actions";

      var loadBtn = document.createElement("button");
      loadBtn.type = "button";
      loadBtn.textContent = "불러오기";
      loadBtn.addEventListener("click", function(){ applyTemplate(t); });
      actions.appendChild(loadBtn);

      var editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.textContent = "수정";
      editBtn.addEventListener("click", function(){ editTemplate(t); });
      actions.appendChild(editBtn);

      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "danger";
      delBtn.textContent = "삭제";
      delBtn.addEventListener("click", function(){ deleteTemplate(t); });
      actions.appendChild(delBtn);

      li.appendChild(actions);
      tplList.appendChild(li);
    });
  }

  function applyTemplate(t){
    state.text = t.text || "";
    state.textX = typeof t.textX === "number" ? t.textX : 0.5;
    state.textY = typeof t.textY === "number" ? t.textY : 0.8;
    state.fontSize = typeof t.fontSize === "number" ? t.fontSize : 64;
    state.color = t.color || "#ffffff";
    state.fontFamily = t.fontFamily || "'Gaegu', sans-serif";
    state.textAlign = t.textAlign || "center";
    state.strokeWidth = typeof t.strokeWidth === "number" ? t.strokeWidth : 6;
    state.strokeColor = t.strokeColor || "#000000";
    state.bgBox = Boolean(t.bgBox);
    state.shadow = typeof t.shadow === "boolean" ? t.shadow : true;
    state.subText = t.subText || "";
    state.subY = typeof t.subY === "number" ? t.subY : 0.15;
    state.subSize = typeof t.subSize === "number" ? t.subSize : 40;
    state.imageFit = t.imageFit || "cover";
    state.bgFill = typeof t.bgFill === "boolean" ? t.bgFill : true;
    state.bgColor = t.bgColor || "#1e293b";
    state.dim = typeof t.dim === "number" ? t.dim : 0;

    syncControlsFromState();
    applyRatio(t.ratio && RATIOS[t.ratio] ? t.ratio : "1:1");
    ensureFontAndDraw();
    showMsg(tplMsg, "템플릿을 불러왔습니다: " + t.name, false);
  }

  function editTemplate(t){
    var newName = prompt("새 이름을 입력하세요.", t.name);
    if(newName === null) return;
    newName = newName.trim();
    if(!newName){ showMsg(tplMsg, "이름을 입력해야 합니다.", true); return; }

    var arr = loadTemplates();
    var idx = arr.findIndex(function(x){ return x.id === t.id; });
    if(idx === -1) return;

    arr[idx] = buildTemplatePayload(arr[idx].id, newName);
    if(saveTemplates(arr)){
      showMsg(tplMsg, "템플릿을 수정했습니다: " + newName, false);
      renderTemplates();
    } else {
      showMsg(tplMsg, "저장 공간이 부족합니다.", true);
    }
  }

  function deleteTemplate(t){
    if(!confirm("'" + t.name + "' 템플릿을 삭제할까요?")) return;
    var arr = loadTemplates();
    var next = arr.filter(function(x){ return x.id !== t.id; });
    if(saveTemplates(next)){
      showMsg(tplMsg, "템플릿을 삭제했습니다: " + t.name, false);
      renderTemplates();
    } else {
      showMsg(tplMsg, "삭제에 실패했습니다.", true);
    }
  }

  tplSave.addEventListener("click", function(){
    var name = (tplName.value || "").trim();
    if(!name){ showMsg(tplMsg, "템플릿 이름을 입력하세요.", true); return; }
    var arr = loadTemplates();
    arr.push(buildTemplatePayload(uid(), name));
    if(saveTemplates(arr)){
      tplName.value = "";
      showMsg(tplMsg, "저장했습니다: " + name, false);
      renderTemplates();
    } else {
      showMsg(tplMsg, "저장 공간이 부족합니다.", true);
    }
  });

  if(tplPresets){
    tplPresets.addEventListener("click", function(){
      var arr = loadTemplates();
      var existingIds = {};
      arr.forEach(function(item){ existingIds[item.id] = true; });
      var added = 0;
      DEFAULT_TEMPLATES.forEach(function(preset){
        var copy = JSON.parse(JSON.stringify(preset));
        if(existingIds[copy.id]){
          copy.id = uid();
        }
        arr.push(copy);
        added++;
      });
      if(saveTemplates(arr)){
        showMsg(tplMsg, "기본 샘플 템플릿 " + added + "개를 추가했습니다.", false);
        renderTemplates();
      } else {
        showMsg(tplMsg, "저장 공간이 부족합니다.", true);
      }
    });
  }

  jsonExport.addEventListener("click", function(){
    var arr = loadTemplates();
    if(arr.length === 0){
      showMsg(tplMsg, "내보낼 템플릿이 없습니다.", true);
      return;
    }
    var blob = new Blob([JSON.stringify(arr, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "templates.json";
    a.click();
    URL.revokeObjectURL(url);
    showMsg(tplMsg, arr.length + "개 템플릿을 내보냈습니다.", false);
  });

  function validateTemplate(item){
    if(!item || typeof item !== "object") return "항목이 객체가 아닙니다.";
    for(var i=0;i<REQUIRED_FIELDS.length;i++){
      var f = REQUIRED_FIELDS[i];
      if(!(f in item)) return "필수 항목 누락: " + f;
    }
    if(!RATIOS[item.ratio]) return "비율 값이 올바르지 않습니다: " + item.ratio;
    if(typeof item.textX !== "number" || item.textX < 0 || item.textX > 1) return "textX 범위 오류";
    if(typeof item.textY !== "number" || item.textY < 0 || item.textY > 1) return "textY 범위 오류";
    if(typeof item.fontSize !== "number" || item.fontSize < 12 || item.fontSize > 200) return "fontSize 범위 오류";
    return null;
  }

  jsonImport.addEventListener("change", function(e){
    var file = e.target.files && e.target.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(ev){
      var raw = ev.target.result;
      var parsed;
      try{
        parsed = JSON.parse(raw);
      }catch(err){
        showMsg(tplMsg, "JSON 문법 오류: " + err.message + " — 기존 템플릿을 유지합니다.", true);
        jsonImport.value = "";
        return;
      }
      if(!Array.isArray(parsed)){
        showMsg(tplMsg, "JSON은 배열이어야 합니다. — 기존 템플릿을 유지합니다.", true);
        jsonImport.value = "";
        return;
      }
      for(var i=0;i<parsed.length;i++){
        var problem = validateTemplate(parsed[i]);
        if(problem){
          showMsg(tplMsg, (i+1) + "번째 항목 오류: " + problem + " — 기존 템플릿을 유지합니다.", true);
          jsonImport.value = "";
          return;
        }
      }
      var before = loadTemplates().length;
      if(saveTemplates(parsed)){
        var after = loadTemplates().length;
        showMsg(tplMsg, "가져오기 완료: " + before + "개 → " + after + "개", false);
        renderTemplates();
      } else {
        showMsg(tplMsg, "저장 실패: 공간 부족. — 기존 템플릿을 유지합니다.", true);
      }
      jsonImport.value = "";
    };
    reader.onerror = function(){
      showMsg(tplMsg, "파일을 읽을 수 없습니다. — 기존 템플릿을 유지합니다.", true);
      jsonImport.value = "";
    };
    reader.readAsText(file);
  });

  downloadBtn.addEventListener("click", function(){
    canvas.toBlob(function(blob){
      if(!blob){ showMsg(tplMsg, "다운로드 실패", true); return; }
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "edited-" + state.ratio.replace(":","x") + ".png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  });

  initDefaultTemplatesIfEmpty();
  syncControlsFromState();
  applyRatio("1:1");
  renderTemplates();
  ensureFontAndDraw();

  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(function(){
      draw();
    });
  }
})();
