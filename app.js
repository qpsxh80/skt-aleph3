(function(){
  "use strict";

  var RATIOS = {
    "1:1":  { w: 1080, h: 1080 },
    "4:5":  { w: 1080, h: 1350 },
    "9:16": { w: 1080, h: 1920 }
  };
  var STORAGE_KEY = "imgEditor.templates.v1";
  var REQUIRED_FIELDS = ["id","name","ratio","text","textX","textY","fontSize","color"];

  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");

  var imageInput = document.getElementById("image-input");
  var imageError = document.getElementById("image-error");
  var ratioBtns = document.querySelectorAll(".ratio-btn");
  var textInput = document.getElementById("text-input");
  var fontSelect = document.getElementById("font-select");
  var xRange = document.getElementById("x-range");
  var yRange = document.getElementById("y-range");
  var sizeRange = document.getElementById("size-range");
  var colorInput = document.getElementById("color-input");
  var xOut = document.getElementById("x-out");
  var yOut = document.getElementById("y-out");
  var sizeOut = document.getElementById("size-out");
  var tplName = document.getElementById("tpl-name");
  var tplSave = document.getElementById("tpl-save");
  var tplMsg = document.getElementById("tpl-msg");
  var tplList = document.getElementById("tpl-list");
  var jsonExport = document.getElementById("json-export");
  var jsonImport = document.getElementById("json-import");
  var downloadBtn = document.getElementById("download");

  var state = {
    ratio: "1:1",
    image: null,
    text: "안녕하세요",
    textX: 0.5,
    textY: 0.8,
    fontSize: 48,
    color: "#ffffff",
    fontFamily: "sans-serif"
  };

  function uid(){
    return "tpl_" + Date.now() + "_" + Math.random().toString(36).slice(2,8);
  }
  function showMsg(el, msg){
    if(!msg){ el.hidden = true; el.textContent = ""; return; }
    el.hidden = false;
    el.textContent = msg;
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

  function wrapText(text, maxWidth){
    if(!text) return [];
    var lines = [];
    var paragraphs = String(text).split("\n");
    for(var p=0; p<paragraphs.length; p++){
      var para = paragraphs[p];
      if(para.length === 0){ lines.push(""); continue; }
      var current = "";
      for(var i=0;i<para.length;i++){
        var ch = para[i];
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

  function draw(){
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if(state.image){
      var img = state.image;
      var iw = img.naturalWidth || img.width;
      var ih = img.naturalHeight || img.height;
      var scale = Math.max(w / iw, h / ih);
      var dw = iw * scale;
      var dh = ih * scale;
      var dx = (w - dw) / 2;
      var dy = (h - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    var text = state.text;
    if(text && text.length > 0){
      var fontSize = Math.max(12, state.fontSize);
      ctx.font = "bold " + fontSize + "px " + state.fontFamily + ", \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Noto Color Emoji\"";
      ctx.fillStyle = state.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      var maxWidth = w * 0.9;
      var lines = wrapText(text, maxWidth);
      var lineHeight = fontSize * 1.3;
      var totalHeight = lines.length * lineHeight;
      var startY = state.textY * h - totalHeight / 2 + lineHeight / 2;

      for(var i=0;i<lines.length;i++){
        ctx.fillText(lines[i], state.textX * w, startY + i * lineHeight);
      }
    }
  }

  imageInput.addEventListener("change", function(e){
    var file = e.target.files && e.target.files[0];
    if(!file) return;
    var okTypes = ["image/png","image/jpeg"];
    if(okTypes.indexOf(file.type) === -1){
      showMsg(imageError, "PNG 또는 JPEG 파일만 지원합니다. (" + (file.type || "알 수 없음") + ")");
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
        showMsg(imageError, "이미지를 읽을 수 없습니다. 기존 작업을 유지합니다.");
        imageInput.value = "";
      };
      img.src = ev.target.result;
    };
    reader.onerror = function(){
      showMsg(imageError, "파일을 읽을 수 없습니다. 기존 작업을 유지합니다.");
      imageInput.value = "";
    };
    reader.readAsDataURL(file);
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
  fontSelect.addEventListener("change", function(){
    state.fontFamily = fontSelect.value;
    draw();
  });
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
      metaEl.textContent = t.ratio + " · " + t.fontSize + "px · " + t.color;
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
    state.fontSize = typeof t.fontSize === "number" ? t.fontSize : 48;
    state.color = t.color || "#ffffff";
    state.fontFamily = t.fontFamily || "sans-serif";

    textInput.value = state.text;
    fontSelect.value = state.fontFamily;
    xRange.value = state.textX;
    yRange.value = state.textY;
    sizeRange.value = state.fontSize;
    colorInput.value = state.color;
    xOut.textContent = state.textX.toFixed(2);
    yOut.textContent = state.textY.toFixed(2);
    sizeOut.textContent = String(state.fontSize);

    applyRatio(t.ratio && RATIOS[t.ratio] ? t.ratio : "1:1");
    showMsg(tplMsg, "템플릿을 불러왔습니다: " + t.name);
  }

  function editTemplate(t){
    var newName = prompt("새 이름을 입력하세요.", t.name);
    if(newName === null) return;
    newName = newName.trim();
    if(!newName){ showMsg(tplMsg, "이름을 입력해야 합니다."); return; }

    var arr = loadTemplates();
    var idx = arr.findIndex(function(x){ return x.id === t.id; });
    if(idx === -1) return;

    arr[idx] = {
      id: arr[idx].id,
      name: newName,
      ratio: state.ratio,
      text: state.text,
      textX: state.textX,
      textY: state.textY,
      fontSize: state.fontSize,
      color: state.color,
      fontFamily: state.fontFamily
    };
    if(saveTemplates(arr)){
      showMsg(tplMsg, "템플릿을 수정했습니다: " + newName);
      renderTemplates();
    } else {
      showMsg(tplMsg, "저장 공간이 부족합니다.");
    }
  }

  function deleteTemplate(t){
    if(!confirm("'" + t.name + "' 템플릿을 삭제할까요?")) return;
    var arr = loadTemplates();
    var next = arr.filter(function(x){ return x.id !== t.id; });
    if(saveTemplates(next)){
      showMsg(tplMsg, "템플릿을 삭제했습니다: " + t.name);
      renderTemplates();
    } else {
      showMsg(tplMsg, "삭제에 실패했습니다.");
    }
  }

  tplSave.addEventListener("click", function(){
    var name = (tplName.value || "").trim();
    if(!name){ showMsg(tplMsg, "템플릿 이름을 입력하세요."); return; }
    var arr = loadTemplates();
    arr.push({
      id: uid(),
      name: name,
      ratio: state.ratio,
      text: state.text,
      textX: state.textX,
      textY: state.textY,
      fontSize: state.fontSize,
      color: state.color,
      fontFamily: state.fontFamily
    });
    if(saveTemplates(arr)){
      tplName.value = "";
      showMsg(tplMsg, "저장했습니다: " + name);
      renderTemplates();
    } else {
      showMsg(tplMsg, "저장 공간이 부족합니다.");
    }
  });

  jsonExport.addEventListener("click", function(){
    var arr = loadTemplates();
    if(arr.length === 0){
      showMsg(tplMsg, "내보낼 템플릿이 없습니다.");
      return;
    }
    var blob = new Blob([JSON.stringify(arr, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "templates.json";
    a.click();
    URL.revokeObjectURL(url);
    showMsg(tplMsg, arr.length + "개 템플릿을 내보냈습니다.");
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
        showMsg(tplMsg, "JSON 문법 오류: " + err.message + " — 기존 템플릿을 유지합니다.");
        jsonImport.value = "";
        return;
      }
      if(!Array.isArray(parsed)){
        showMsg(tplMsg, "JSON은 배열이어야 합니다. — 기존 템플릿을 유지합니다.");
        jsonImport.value = "";
        return;
      }
      for(var i=0;i<parsed.length;i++){
        var problem = validateTemplate(parsed[i]);
        if(problem){
          showMsg(tplMsg, (i+1) + "번째 항목 오류: " + problem + " — 기존 템플릿을 유지합니다.");
          jsonImport.value = "";
          return;
        }
      }
      var before = loadTemplates().length;
      if(saveTemplates(parsed)){
        var after = loadTemplates().length;
        showMsg(tplMsg, "가져오기 완료: " + before + "개 → " + after + "개");
        renderTemplates();
      } else {
        showMsg(tplMsg, "저장 실패: 공간 부족. — 기존 템플릿을 유지합니다.");
      }
      jsonImport.value = "";
    };
    reader.onerror = function(){
      showMsg(tplMsg, "파일을 읽을 수 없습니다. — 기존 템플릿을 유지합니다.");
      jsonImport.value = "";
    };
    reader.readAsText(file);
  });

  downloadBtn.addEventListener("click", function(){
    canvas.toBlob(function(blob){
      if(!blob){ showMsg(tplMsg, "다운로드 실패"); return; }
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "edited-" + state.ratio.replace(":","x") + ".png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  });

  applyRatio("1:1");
  renderTemplates();
})();