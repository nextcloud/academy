# Setting Up Your Development Environment

## Overview

Before you write your first line of app code, you need a working Nextcloud instance to develop against. In this module you will set up the official Nextcloud development environment: a local Docker-based Nextcloud instance running at `http://nextcloud.local`, or a cloud-based instance via GitHub Codespaces.

> ⏱ **Estimated time:** ~40 minutes on macOS · ~35 minutes on Ubuntu · ~70 minutes on Windows · ~10 minutes with Codespaces

---

## macOS

### 1: Install Docker Desktop

Download Docker Desktop from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/). Choose the correct version for your chip (**Apple Chip** for M1/M2/M3/M4, **Intel Chip** for older Macs).

Run the installer and open the Docker Desktop app. Accept the terms of service when prompted. **Keep Docker Desktop open** while completing the rest of this module.

### 2: Install Xcode command line tools

Open **Terminal** (search for it in Launchpad) and run:

```bash
xcode-select --install
```

This installs the developer tools that Docker and the bootstrap script depend on. If Xcode is already installed, the command will confirm this and you can continue.

### 3: Clone and bootstrap

In Terminal, run these commands one at a time:

```bash
git clone https://github.com/juliushaertl/nextcloud-docker-dev.git
cd nextcloud-docker-dev
./bootstrap.sh
sudo sh -c "echo '127.0.0.1 nextcloud.local' >> /etc/hosts"
```

- `git clone` downloads the development environment.
- `bootstrap.sh` sets up the Docker configuration. You may be asked for your system password at some point — this is normal.
- The final line adds `nextcloud.local` to your hosts file so your browser can reach the development instance.

> ⏳ The bootstrap step can take 15–20 minutes depending on your internet speed. A lot of output will scroll past — this is expected. The process is not frozen.

### 4: Start Nextcloud

```bash
docker compose up nextcloud proxy
```

The first time you run this, Docker downloads the container images — this may take a few minutes. Subsequent starts are much faster.

Once the log output settles, open `http://nextcloud.local` in your browser and proceed to [Verify your setup](#verify-your-setup).

### 5: Install nvm and Node.js

nvm (Node Version Manager) lets you install and switch between Node.js versions. You will need Node.js later in the course for building app frontends.

Install Homebrew first, if you do not already have it:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Enter your administrator password if prompted. When it finishes, follow any instructions printed in the terminal to add Homebrew to your PATH — this is usually one or two commands shown at the end of the output.

Then install nvm:

```bash
brew update
brew install nvm
mkdir ~/.nvm
echo "export NVM_DIR=~/.nvm\nsource \$(brew --prefix nvm)/nvm.sh" >> ~/.zshrc
source ~/.zshrc
```

Verify nvm is installed:

```bash
nvm -v
```

Then install the latest LTS version of Node.js:

```bash
nvm install --lts
nvm use --lts
```

Confirm both are working:

```bash
node -v
npm -v
```

You should see version numbers for both.

> **Troubleshooting:** If `brew install nvm` does not work, try the curl approach instead:
> ```bash
> curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
> source ~/.zshrc
> ```

---

## Ubuntu / Linux

### 1: Install Docker Desktop

Follow the official Docker Desktop installation guide for Linux: [docs.docker.com/desktop/install/linux](https://docs.docker.com/desktop/install/linux/)

Once installed, open Docker Desktop and accept the terms of service. **Keep it open** while completing the rest of this module.

### 2: Clone and bootstrap

Open a terminal and run:

```bash
git clone https://github.com/juliushaertl/nextcloud-docker-dev.git
cd nextcloud-docker-dev
./bootstrap.sh
sudo sh -c "echo '127.0.0.1 nextcloud.local' >> /etc/hosts"
```

> ⏳ The bootstrap step can take 15–20 minutes. The scrolling output is normal — the process is not frozen.

### 3: Start Nextcloud

```bash
docker compose up nextcloud proxy
```

Once the log output settles, open `http://nextcloud.local` in your browser and proceed to [Verify your setup](#verify-your-setup).

### 4: Install nvm and Node.js

nvm (Node Version Manager) lets you install and switch between Node.js versions. You will need Node.js later in the course for building app frontends.

Run the installer:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

Then reload your shell environment:

```bash
source ~/.bashrc
```

Verify nvm is installed:

```bash
nvm -v
```

Install the latest LTS version of Node.js:

```bash
nvm install --lts
nvm use --lts
```

Confirm both are working:

```bash
node -v
npm -v
```

You should see version numbers for both.

---

## Windows

Windows requires a few extra steps because the development environment runs inside WSL 2 (Windows Subsystem for Linux).

> ⚠️ The steps for Windows are more involved than for macOS or Ubuntu. If you get through this, you have the persistence to build great apps. 😉

### 1: Check your system requirements

Before continuing, confirm your system meets all of these:

- Windows 10 (latest version) or Windows 11
- 8 GB RAM or more
- SSD with at least 40 GB free space
- 4-core / 8-thread CPU or better

Do not skip this check. If your system does not meet these requirements, the environment is unlikely to work reliably.

### 2: Install WSL 2 with Ubuntu

Open **Command Prompt** as Administrator (right-click the Start button → **Run as administrator**) and run:

```
wsl --install -d Ubuntu-24.04
```

This enables WSL 2 and installs Ubuntu 24.04 LTS. Follow the on-screen instructions.

> If you see the error `WSL 2 requires an update to its kernel component`, visit [aka.ms/wsl2kernel](https://aka.ms/wsl2kernel), download and install the kernel update, then re-run the command above.

**Restart your computer** once the installation finishes.

### 3: Set up your Ubuntu user

After restarting, open **Ubuntu** from the Start menu. You will be prompted to create a username and password for your Linux environment. This is separate from your Windows credentials.

> When typing your password, nothing will appear on screen. This is called blind typing and is completely normal.

### 4: Install Docker Desktop

Go to [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) and download the **Windows** installer. Run it and follow the installation procedure. Restart your computer if prompted.

Once installed:

1. Start Docker Desktop from the Start menu.
2. Accept the terms of service.
3. Go to **Settings → General** and confirm **Use the WSL 2 based engine** is checked.
4. Go to **Settings → Resources → WSL Integration** and enable integration for your Ubuntu distribution.

To verify Docker is working, open **Ubuntu** and run:

```bash
docker --version
```

You should see a version number. Then add your user to the `docker` group so you can run Docker commands without `sudo`:

```bash
sudo usermod -aG docker $USER
```

Close and reopen the Ubuntu window for the change to take effect, then verify:

```bash
docker ps
```

You should see a table header (`CONTAINER ID   IMAGE   ...`). If you get a permissions error instead, try toggling WSL integration in Docker Desktop off and on.

### 5: Edit the Windows hosts file

Your browser needs to be able to resolve `nextcloud.local`. Because your browser runs on Windows (not inside WSL 2), you need to add an entry to the **Windows** hosts file.

**5.1 — Open Notepad as Administrator:**
1. Press the Windows key and type **notepad**.
2. Right-click the Notepad result and select **Run as administrator**.
3. Confirm the UAC prompt.

**5.2 — Open the hosts file:**
1. In Notepad, go to **File → Open**.
2. Navigate to `C:\Windows\System32\drivers\etc`.
3. Change the file type filter (bottom-right corner of the dialog) to **All Files**.
4. Select **hosts** and click **Open**.

**5.3 — Add the entry:**

Scroll to the bottom of the file and add this line, then save:

```
127.0.0.1 nextcloud.local
```

### 6: Install nvm and Node.js

You will need Node.js later in the course for building app frontends. Run the following commands in your **Ubuntu** terminal.

Make sure Ubuntu is up to date and has curl:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl
```

Install nvm:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

Reload your shell:

```bash
source ~/.bashrc
```

Verify nvm is installed:

```bash
nvm -v
```

Install the latest LTS version of Node.js:

```bash
nvm install --lts
nvm use --lts
```

Confirm both are working:

```bash
node -v
npm -v
```

You should see version numbers for both.

### 7: Clone and bootstrap

Open **Ubuntu** and run:

```bash
sudo apt install -y git
git clone https://github.com/juliushaertl/nextcloud-docker-dev.git
cd nextcloud-docker-dev
./bootstrap.sh
```

> ⏳ The bootstrap step can take 15–20 minutes. The scrolling output is normal.

### 8: Start Nextcloud

```bash
docker compose up nextcloud proxy
```

Once the log output settles, open `http://nextcloud.local` in your **Windows browser** (not inside Ubuntu) and proceed to [Verify your setup](#verify-your-setup).

---

## GitHub Codespaces

Codespaces is a good option for workshops or if you want to try Nextcloud development without installing anything locally. It spins up a fully working Nextcloud instance in your browser in a few minutes.

> ℹ️ GitHub Codespaces is a paid service, but you are unlikely to hit the paywall if you are only using it for this course. Make sure to stop your codespace when you are done (see below).

### 1: Create your codespace

Log in to GitHub, then go to [codespaces.new/nextcloud/server](https://codespaces.new/nextcloud/server) and click **Create codespace**. You do not need to change any settings.

> ℹ️ If you want to develop against a specific stable Nextcloud version rather than the latest development branch, select a branch named `stableXX` (e.g. `stable34`) before creating the codespace. The `master` branch may occasionally contain breaking changes.

> ℹ️ **Firefox users:** if you see an "Oh no, it looks like you are offline!" error, this is caused by Firefox's Enhanced Tracking Protection. Add the codespace URL as an exception under **Settings → Privacy & Security → Enhanced Tracking Protection → Manage Exceptions**, then refresh.

You will see a "Setting up your codespace" screen. On a normal internet connection this takes a few minutes.

### 2: Access your Nextcloud

Once the codespace is ready, click the **PORTS** tab in the bottom panel. Hover over the forwarded address for port **80** and click the globe icon, or right-click the port 80 entry and select **Open in Browser**.

Log in with username **admin** and password **admin**.

### 3: Node.js

nvm and Node.js are pre-installed in the Codespaces environment. To activate the latest LTS version, open the terminal in your codespace and run:

```bash
nvm install --lts
nvm use --lts
```

### 4: Stop your codespace when done

To avoid charges, stop your codespace when you are finished:

1. Go to [github.com/codespaces](https://github.com/codespaces).
2. Under **By repository**, click **nextcloud/server**.
3. Click the three-dot menu next to your codespace and select **Delete**.

---

## Verify your setup

Whichever path you followed, confirm your environment is working:

1. Open your Nextcloud in the browser (`http://nextcloud.local` for local setups, the forwarded port URL for Codespaces).
2. You should see a Nextcloud login screen. If you are prompted to run an update, click through it.
3. Log in with username **admin** and password **admin**.

If you can see the Nextcloud Files app after logging in, your environment is ready.

> **Troubleshooting (local setups):** If `http://nextcloud.local` does not load, open Docker Desktop and check that the containers `master-nextcloud-1` and `master-proxy-1` are listed as running. On macOS you can also click the **Open in browser** icon next to the container entry in Docker Desktop.

---

## Common commands

You will use these throughout the course. Run them from inside the `nextcloud-docker-dev` folder.

**Start the environment:**
```bash
docker compose up nextcloud proxy
```

**Stop the environment:**
- **macOS:** open Docker Desktop → Containers → click the stop icon next to `master`, then the bin icon to remove it.
- **Ubuntu / Windows:** press `Ctrl+C` in the terminal, then run `docker compose down`.

**Start again later:**
```bash
cd nextcloud-docker-dev
docker compose up nextcloud proxy
```

**Run an occ command:**
```bash
./scripts/occ.sh nextcloud -- <your-command>
```

For example:
```bash
./scripts/occ.sh nextcloud -- maintenance:mode --on
```

The `--` separates the container name from the occ arguments.
