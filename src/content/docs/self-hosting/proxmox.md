---
slug: proxmox-community-script
title: Deploy to Proxmox VE
description: One-line Proxmox VE install
index: 3
coverImage: 
---

### One-Liner

You can easily deploy Domain Locker on Proxmox VE, using the [`domain-locker-install.sh`](https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/install/domain-locker-install.sh), just run:

```
bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/domain-locker.sh)"
```

---

### Details
- Default port: `3000`
- DB credentials: `~/Domain-Locker.creds`
- Config location: `/opt/domain-locker.env`
- For more info, see the script page:
[community-scripts.github.io/ProxmoxVE/scripts?id=domain-locker](https://community-scripts.github.io/ProxmoxVE/scripts?id=domain-locker)

### About
Thank you [@CrazyWolf13](https://github.com/CrazyWolf13) for submitting it ([#9214](https://github.com/community-scripts/ProxmoxVE/pull/9214))!

Proxmox VE Community Scripts is a repository of setup scripts for Proxmox Virtual Environment (Proxmox VE),  made possible by the amazing tteck (rest in peace), and now maintained by the community. Drop them a star on [GitHub](https://github.com/community-scripts/ProxmoxVE) if you find them useful!

[![screenshot](https://storage.googleapis.com/as93-screenshots/domain-locker/domain-locker-proxmox-ve-community-script-screenshot.png)](https://community-scripts.github.io/ProxmoxVE/scripts?id=domain-locker)

