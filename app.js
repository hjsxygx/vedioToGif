const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const selectFileBtn = document.getElementById("selectFileBtn");
const fileInfo = document.getElementById("fileInfo");
const videoPlayer = document.getElementById("videoPlayer");
const totalDurationEl = document.getElementById("totalDuration");
const currentTimeEl = document.getElementById("currentTime");
const startTimeInput = document.getElementById("startTimeInput");
const endTimeInput = document.getElementById("endTimeInput");
const clipDurationEl = document.getElementById("clipDuration");
const previewSegmentBtn = document.getElementById("previewSegmentBtn");
const resetTimeBtn = document.getElementById("resetTimeBtn");
const sizeSelect = document.getElementById("sizeSelect");
const fpsRange = document.getElementById("fpsRange");
const fpsValue = document.getElementById("fpsValue");
const qualityRange = document.getElementById("qualityRange");
const qualityValue = document.getElementById("qualityValue");
const speedRange = document.getElementById("speedRange");
const speedValue = document.getElementById("speedValue");
const loopCheckbox = document.getElementById("loopCheckbox");
const convertBtn = document.getElementById("convertBtn");
const progressRow = document.getElementById("progressRow");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const gifPlaceholder = document.getElementById("gifPlaceholder");
const gifPreview = document.getElementById("gifPreview");
const gifSizeInfo = document.getElementById("gifSizeInfo");
const gifFileSize = document.getElementById("gifFileSize");
const downloadLink = document.getElementById("downloadLink");

const state = {
  objectUrl: null,
  duration: 0,
  clipStart: 0,
  clipEnd: 0,
  isPreviewingSegment: false,
  isConverting: false,
};

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "--:--:--";
  }
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds / 60) % 60)
    .toString()
    .padStart(2, "0");
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function parseTime(text) {
  if (!text) return null;
  const parts = text.trim().split(":");
  if (parts.length !== 3) return null;
  const [h, m, s] = parts.map((v) => Number.parseInt(v, 10));
  if ([h, m, s].some((v) => Number.isNaN(v) || v < 0)) return null;
  if (m >= 60 || s >= 60) return null;
  return h * 3600 + m * 60 + s;
}

function setProgress(percent, text) {
  const clamped = Math.max(0, Math.min(100, percent));
  progressBar.style.width = `${clamped}%`;
  if (text) {
    progressText.textContent = text;
  }
}

function resetResult() {
  if (gifPreview.src) {
    URL.revokeObjectURL(gifPreview.src);
  }
  gifPreview.style.display = "none";
  gifPreview.src = "";
  gifPlaceholder.style.display = "flex";
  gifSizeInfo.textContent = "--";
  gifFileSize.textContent = "--";
  downloadLink.classList.add("disabled");
  downloadLink.setAttribute("aria-disabled", "true");
  downloadLink.href = "#";
}

function updateFileInfo(file) {
  if (!file) {
    fileInfo.textContent = "";
    return;
  }
  const sizeMB = file.size / (1024 * 1024);
  const sizeText = sizeMB >= 1024 ? `${(sizeMB / 1024).toFixed(2)} GB` : `${sizeMB.toFixed(2)} MB`;
  fileInfo.textContent = `${file.name} · ${sizeText}`;
}

function handleFileSelect(file) {
  if (!file) return;
  if (!file.type.startsWith("video/")) {
    fileInfo.textContent = "请选择视频文件";
    return;
  }
  if (state.objectUrl) {
    URL.revokeObjectURL(state.objectUrl);
  }
  const url = URL.createObjectURL(file);
  state.objectUrl = url;
  videoPlayer.src = url;
  videoPlayer.load();
  updateFileInfo(file);
  resetResult();
  setProgress(0, "准备就绪");
}

function initTimeRange() {
  if (!state.duration || !Number.isFinite(state.duration)) {
    startTimeInput.value = "";
    endTimeInput.value = "";
    clipDurationEl.textContent = "--:--:--";
    return;
  }
  state.clipStart = 0;
  const defaultEnd = Math.min(state.duration, 5);
  state.clipEnd = defaultEnd;
  startTimeInput.value = formatTime(state.clipStart);
  endTimeInput.value = formatTime(state.clipEnd);
  clipDurationEl.textContent = formatTime(state.clipEnd - state.clipStart);
}

function validateTimeInputs() {
  if (!state.duration || !Number.isFinite(state.duration)) return false;
  let start = parseTime(startTimeInput.value);
  let end = parseTime(endTimeInput.value);
  if (start == null) start = 0;
  if (end == null) end = state.duration;
  start = Math.max(0, Math.min(start, state.duration));
  end = Math.max(0, Math.min(end, state.duration));
  if (end <= start) {
    end = Math.min(start + 1, state.duration);
  }
  state.clipStart = start;
  state.clipEnd = end;
  startTimeInput.value = formatTime(start);
  endTimeInput.value = formatTime(end);
  clipDurationEl.textContent = formatTime(end - start);
  return true;
}

function handleTimeInputChange() {
  const ok = validateTimeInputs();
  if (!ok) return;
}

function handlePreviewSegment() {
  if (!state.duration || !Number.isFinite(state.duration)) return;
  if (!validateTimeInputs()) return;
  state.isPreviewingSegment = true;
  videoPlayer.currentTime = state.clipStart;
  videoPlayer.play().catch(() => {
    state.isPreviewingSegment = false;
  });
}

function handleResetTime() {
  initTimeRange();
}

function updateCurrentTime() {
  currentTimeEl.textContent = formatTime(videoPlayer.currentTime || 0);
}

function handleVideoTimeUpdate() {
  updateCurrentTime();
  if (state.isPreviewingSegment && videoPlayer.currentTime >= state.clipEnd - 0.03) {
    state.isPreviewingSegment = false;
    videoPlayer.pause();
  }
}

function handleVideoLoadedMetadata() {
  state.duration = videoPlayer.duration || 0;
  totalDurationEl.textContent = formatTime(state.duration);
  initTimeRange();
}

function handleDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  dropZone.classList.add("dragover");
}

function handleDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  dropZone.classList.remove("dragover");
}

function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  dropZone.classList.remove("dragover");
  const files = event.dataTransfer?.files;
  if (!files || !files.length) return;
  const file = files[0];
  handleFileSelect(file);
  fileInput.files = files;
}

function handleFileInputChange(event) {
  const files = event.target.files;
  if (!files || !files.length) return;
  const file = files[0];
  handleFileSelect(file);
}

function handleSelectFileClick() {
  fileInput.click();
}

function updateRangeLabels() {
  fpsValue.textContent = `${fpsRange.value} fps`;
  qualityValue.textContent = qualityRange.value;
  if (speedRange && speedValue) {
    speedValue.textContent = `${speedRange.value}x`;
  }
}

function disableControls() {
  state.isConverting = true;
  convertBtn.disabled = true;
  convertBtn.textContent = "正在转换...";
  previewSegmentBtn.disabled = true;
  resetTimeBtn.disabled = true;
  fileInput.disabled = true;
  selectFileBtn.disabled = true;
}

function enableControls() {
  state.isConverting = false;
  convertBtn.disabled = false;
  convertBtn.textContent = "开始转换为 GIF";
  previewSegmentBtn.disabled = false;
  resetTimeBtn.disabled = false;
  fileInput.disabled = false;
  selectFileBtn.disabled = false;
}

function getTargetSize() {
  const originalWidth = videoPlayer.videoWidth || 0;
  const originalHeight = videoPlayer.videoHeight || 0;
  if (!originalWidth || !originalHeight) {
    return null;
  }
  const aspect = originalWidth / originalHeight;
  let targetWidth;
  if (sizeSelect.value === "small") {
    targetWidth = 320;
  } else if (sizeSelect.value === "medium") {
    targetWidth = 480;
  } else if (sizeSelect.value === "large") {
    targetWidth = 720;
  } else {
    return { width: originalWidth, height: originalHeight };
  }
  targetWidth = Math.min(targetWidth, originalWidth);
  const targetHeight = Math.round(targetWidth / aspect);
  return { width: targetWidth, height: targetHeight };
}

function create2dContext(canvas) {
  let ctx = null;
  try {
    ctx = canvas.getContext("2d", { willReadFrequently: true });
  } catch (_) {
    ctx = null;
  }
  if (!ctx) {
    try {
      ctx = canvas.getContext("2d");
    } catch (_) {
      ctx = null;
    }
  }
  return ctx;
}

function waitForVideoFrame(video) {
  return new Promise((resolve) => {
    if (typeof video.requestVideoFrameCallback === "function") {
      video.requestVideoFrameCallback(() => resolve());
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function pickFirstUsableWorkerScript(urls) {
  for (const url of urls) {
    try {
      const worker = new Worker(url);
      worker.terminate();
      return url;
    } catch (_) {
    }
  }
  return null;
}

function seekTo(video, time, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const targetTime = Number.isFinite(time) ? Math.max(0, time) : 0;
    if (Math.abs((video.currentTime || 0) - targetTime) < 0.001) {
      resolve();
      return;
    }

    let done = false;
    const timeoutId = window.setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error("seek timeout"));
    }, timeoutMs);

    function cleanup() {
      window.clearTimeout(timeoutId);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    }

    function onSeeked() {
      if (done) return;
      done = true;
      cleanup();
      resolve();
    }

    function onError() {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error("seek error"));
    }

    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    try {
      video.currentTime = targetTime;
    } catch (error) {
      if (done) return;
      done = true;
      cleanup();
      reject(error);
    }
  });
}

async function convertToGif() {
  if (!videoPlayer.src || !state.duration) {
    setProgress(0, "请先上传视频");
    return;
  }
  if (!validateTimeInputs()) {
    setProgress(0, "时间范围无效");
    return;
  }
  const clipDuration = state.clipEnd - state.clipStart;
  if (clipDuration <= 0) {
    setProgress(0, "片段时长必须大于 0 秒");
    return;
  }
  const size = getTargetSize();
  if (!size) {
    setProgress(0, "无法获取视频尺寸");
    return;
  }
  const fps = Number.parseInt(fpsRange.value, 10) || 15;
  const quality = Number.parseInt(qualityRange.value, 10) || 10;
  const speed = Number.parseInt(speedRange.value, 10) || 1;
  const frameInterval = 1 / fps;
  const estimatedFrames = Math.max(1, Math.ceil(clipDuration * fps));
  disableControls();
  resetResult();
  setProgress(2, "初始化转换...");
  const workerScript = pickFirstUsableWorkerScript([
    "https://unpkg.com/gif.js@0.2.0/dist/gif.worker.js",
    "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js",
  ]);
  const useWorkers = Boolean(workerScript);

  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = create2dContext(canvas);
  if (!ctx) {
    setProgress(0, "无法创建 Canvas 2D 上下文");
    enableControls();
    return;
  }

  let frameIndex = 0;
  let originalMuted = videoPlayer.muted;
  let originalPlaybackRate = videoPlayer.playbackRate;
  try {
    const originalPauseState = videoPlayer.paused;
    videoPlayer.pause();
    originalMuted = videoPlayer.muted;
    originalPlaybackRate = videoPlayer.playbackRate;
    videoPlayer.muted = true;
    videoPlayer.playbackRate = Math.max(1, Math.min(8, speed));

    const delay = Math.round(1000 / fps);
    async function buildGifWithExtraction(extractMode) {
      frameIndex = 0;
      const gifOptions = {
        workers: useWorkers ? 2 : 0,
        quality,
        width: size.width,
        height: size.height,
        repeat: loopCheckbox.checked ? 0 : 1,
      };
      if (useWorkers) {
        gifOptions.workerScript = workerScript;
      }
      const gif = new GIF(gifOptions);
      gif.on("progress", (p) => {
        const percent = 75 + Math.max(0, Math.min(1, p)) * 25;
        setProgress(percent, `编码 GIF ${(p * 100).toFixed(0)}%`);
      });

      if (extractMode === "seek") {
        setProgress(5, "定位片段起点...");
        await seekTo(videoPlayer, state.clipStart);
        await waitForVideoFrame(videoPlayer);

        let currentTime = state.clipStart;
        while (frameIndex < estimatedFrames && currentTime <= state.clipEnd + 1e-3) {
          setProgress(
            (frameIndex / estimatedFrames) * 70,
            `抽取帧 ${frameIndex + 1}/${estimatedFrames}`
          );
          await seekTo(videoPlayer, currentTime);
          await waitForVideoFrame(videoPlayer);
          ctx.drawImage(videoPlayer, 0, 0, size.width, size.height);
          gif.addFrame(ctx, { copy: true, delay });
          frameIndex += 1;
          currentTime += frameInterval;
        }
      } else {
        setProgress(5, "定位片段起点...");
        await seekTo(videoPlayer, state.clipStart);
        await waitForVideoFrame(videoPlayer);

        setProgress(8, `开始抽帧（加速 ${videoPlayer.playbackRate}x）...`);
        await videoPlayer.play();
        let nextCaptureTime = state.clipStart;
        const progressEvery = Math.max(1, Math.round(fps / 2));
        await new Promise((resolve) => {
          function tick() {
            if (!state.isConverting) {
              resolve();
              return;
            }

            const t = videoPlayer.currentTime || 0;
            if (t + 0.002 >= nextCaptureTime) {
              ctx.drawImage(videoPlayer, 0, 0, size.width, size.height);
              gif.addFrame(ctx, { copy: true, delay });
              frameIndex += 1;
              nextCaptureTime += frameInterval;
              if (frameIndex % progressEvery === 0 || frameIndex === estimatedFrames) {
                setProgress(
                  (frameIndex / estimatedFrames) * 70,
                  `抽取帧 ${frameIndex}/${estimatedFrames}`
                );
              }
              if (frameIndex >= estimatedFrames || nextCaptureTime > state.clipEnd + 1e-3) {
                resolve();
                return;
              }
            }

            if (videoPlayer.ended) {
              resolve();
              return;
            }

            if (typeof videoPlayer.requestVideoFrameCallback === "function") {
              videoPlayer.requestVideoFrameCallback(() => tick());
            } else {
              requestAnimationFrame(() => tick());
            }
          }

          tick();
        });
        videoPlayer.pause();
      }

      setProgress(75, "编码 GIF 中...");
      return new Promise((resolve, reject) => {
        gif.on("finished", (blob) => resolve(blob));
        gif.on("abort", () => reject(new Error("GIF 生成被中断")));
        gif.on("error", (err) => reject(err));
        gif.render();
      });
    }

    let resultBlob;
    try {
      resultBlob = await buildGifWithExtraction("playback");
    } catch (error) {
      console.error("playback extraction failed, fallback to seek extraction", error);
      try {
        resultBlob = await buildGifWithExtraction("seek");
      } catch (fallbackError) {
        throw fallbackError;
      }
    }

    const objectUrl = URL.createObjectURL(resultBlob);
    gifPlaceholder.style.display = "none";
    gifPreview.style.display = "block";
    gifPreview.src = objectUrl;
    const fileSizeKB = resultBlob.size / 1024;
    const fileSizeText =
      fileSizeKB >= 1024
        ? `${(fileSizeKB / 1024).toFixed(2)} MB`
        : `${fileSizeKB.toFixed(1)} KB`;
    gifSizeInfo.textContent = `${size.width} × ${size.height}`;
    gifFileSize.textContent = fileSizeText;
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    downloadLink.href = objectUrl;
    downloadLink.download = `video-clip-${timestamp}.gif`;
    downloadLink.classList.remove("disabled");
    downloadLink.removeAttribute("aria-disabled");
    setProgress(100, "转换完成");
    if (!originalPauseState) {
      videoPlayer.play().catch(() => {});
    }
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "未知错误";
    setProgress(0, `转换失败：${message}`);
    console.error("convertToGif failed", error);
  } finally {
    videoPlayer.muted = originalMuted;
    videoPlayer.playbackRate = originalPlaybackRate;
    enableControls();
  }
}

function init() {
  updateRangeLabels();
  progressRow.style.visibility = "visible";
  setProgress(0, "准备就绪");
  fileInput.addEventListener("change", handleFileInputChange);
  selectFileBtn.addEventListener("click", handleSelectFileClick);
  dropZone.addEventListener("dragover", handleDragOver);
  dropZone.addEventListener("dragleave", handleDragLeave);
  dropZone.addEventListener("drop", handleDrop);
  startTimeInput.addEventListener("change", handleTimeInputChange);
  endTimeInput.addEventListener("change", handleTimeInputChange);
  previewSegmentBtn.addEventListener("click", handlePreviewSegment);
  resetTimeBtn.addEventListener("click", handleResetTime);
  videoPlayer.addEventListener("loadedmetadata", handleVideoLoadedMetadata);
  videoPlayer.addEventListener("timeupdate", handleVideoTimeUpdate);
  fpsRange.addEventListener("input", updateRangeLabels);
  qualityRange.addEventListener("input", updateRangeLabels);
  speedRange.addEventListener("input", updateRangeLabels);
  convertBtn.addEventListener("click", () => {
    if (state.isConverting) return;
    convertToGif();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
