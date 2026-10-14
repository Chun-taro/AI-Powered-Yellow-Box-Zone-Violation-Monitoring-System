# How to Run the AI-Powered Yellow Box Zone Monitoring System

This guide will walk you through the steps to set up, optimize, and run the monitoring system on your machine.

---

## Prerequisites
1. **Python**: Python 3.10 to 3.12 installed on your Windows machine ([python.org](https://www.python.org/downloads/windows/)).
2. **Camera / Video Source**: A webcam, RTSP stream, or test video file (e.g. `camera/test_video5.mp4`).
3. **Optional (Highly Recommended)**: An NVIDIA GPU (e.g. GTX / RTX series) for hardware-accelerated 60+ FPS real-time AI detection.

---

## Step 1: Set Up & Activate the Virtual Environment

1. Open **Command Prompt** or **PowerShell**.
2. Navigate to the project root directory:
   ```cmd
   cd /d "d:\DEv\AI-Powered Yellow Box Zone Monitoring System Using AI-Based Camera Detection"
   ```
3. If `.venv` does not exist, create it:
   ```cmd
   python -m venv .venv
   ```
4. Activate the virtual environment:
   - **In Command Prompt (CMD)**:
     ```cmd
     .venv\Scripts\activate
     ```
   - **In PowerShell**:
     ```powershell
     Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
     .\.venv\Scripts\Activate.ps1
     ```
   *(Your terminal prompt will display `(.venv)` when active).*

---

## Step 2: Install Dependencies & GPU Acceleration

### Standard Installation (CPU Mode)
With `(.venv)` activated, install the base requirements:
```cmd
python -m pip install -r requirements.txt
```

---

## Enabling NVIDIA GPU (CUDA) Acceleration

### If the System is Not Using Your GPU (Running on CPU Mode)
When you launch `app.py`, check the terminal logs. If you see:
```text
ℹ AI Detector using CPU mode
```
This means your PyTorch installation is the **CPU-only build**, even if your PC has an NVIDIA graphics card.

### How to Fix & Switch to NVIDIA GPU (60+ FPS):
1. Ensure your NVIDIA graphics drivers are up to date. You can verify your GPU by running:
   ```cmd
   nvidia-smi
   ```
2. With `(.venv)` activated, install the **CUDA-enabled PyTorch build** using:
   ```cmd
   python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124 --force-reinstall
   ```
   *(Note: This downloads the official NVIDIA CUDA acceleration libraries, ~2.5 GB).*

3. Verify GPU detection:
   ```cmd
   python -c "import torch; print('CUDA Available:', torch.cuda.is_available(), '| Device:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None')"
   ```
   *Expected output: `CUDA Available: True | Device: NVIDIA GeForce ...`*

When starting `python app.py`, you will now see:
```text
✓ AI Detector using GPU (CUDA: NVIDIA GeForce ...) with cuDNN benchmark
```

---

## Step 3: Run the System

You can run the system in two different modes. Ensure your virtual environment `(.venv)` is activated before running.

### Option A: Web Browser Mode (Recommended)
This runs the backend server and serves the React dashboard in your browser.

1. Run the main server script:
   ```cmd
   python app.py
   ```
2. Open your web browser and navigate to:
   👉 **http://127.0.0.1:5000**

### Option B: Standalone Desktop Window Mode
This packages the dashboard into a native desktop window application.

1. Run the desktop application script:
   ```cmd
   python run_desktop.py
   ```
2. A native desktop window will open automatically displaying the Live Dashboard.

---

## Troubleshooting

- **"AI Detector using CPU mode"**: See the [Enabling NVIDIA GPU Acceleration](#enabling-nvidia-gpu-cuda-acceleration) section above to reinstall PyTorch with CUDA support.
- **`pip : The term 'pip' is not recognized`**: Use `python -m pip install ...` instead of `pip install ...`, or ensure your virtual environment is active (`.\.venv\Scripts\activate`).
- **`Python was not found... Microsoft Store alias`**: Disable the Windows App Execution Aliases for Python via Windows Settings (*Settings > Apps > Advanced app settings > App execution aliases*), or use `.venv\Scripts\python.exe`.
- **Performance / Video Lag on CPU**: If running without a GPU, open `config/config.py` and adjust `FRAME_SKIP = 3` and `JPEG_QUALITY = 60` to lower CPU load.
- **Camera Error / Stream Source**: Edit `config/config.py` to change `camera_source`. You can use a video file path (e.g. `camera/test_video5.mp4`), webcam index (`0`), or RTSP camera stream URL.
- **Port 5000 in use**: If another process is using port 5000, stop the background process or change `PORT = 5001` in `config/config.py`.
