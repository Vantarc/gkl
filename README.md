# Gatrobe Knowledge Library

## Description

[TODO]

## Getting started

Add an account for the GKL called `gkl_user`. Since this account is only for running GKL
the extra arguments of -r is added to create a system account without creating a home directory:

```bash
$ sudo useradd -r gkl_user
```

Next we will create a directory for the installation of GKL and change the owner to the `gkl_user` account:

```bash
$ cd /srv
$ sudo git clone git@github.com:Gatrobe/GatrobeKnowledgeLibrary.git
$ sudo chown -R gkl_user:gkl_user GatrobeKnowledgeLibrary
```

Next up is to create and change to a virtual environment for GKL. This will be done as the `gkl_user` account:

```bash
$ sudo su -s /bin/bash gkl_user
$ cd /srv/GatrobeKnowledgeLibrary
$ python3 -m venv venv
$ source activate venv/bin/activate
(venv) pip install -r requirements.txt
(venv) cd static
(venv) npm install
```

## Set up autostart (systemd)

It is advisable to run GKL as a systemd service:

```bash
(venv) $ exit # To switch back to the root user
$ sudo nano /etc/systemd/system/gatrobe-knowledge-library@gkl_user.service
```

The file must have the following content:

```bash
[Unit]
Description=Gatrobe Knowledge Library
After=network-online.target

[Service]
Type=simple
User=%i
ExecStart=/srv/GatrobeKnowledgeLibrary/bin/python3 /srv/GatrobeKnowledgeLibrary/wsgi.py

[Install]
WantedBy=multi-user.target
```

You need to reload systemd to make the daemon aware of the new configuration:
```bash
$ sudo systemctl --system daemon-reload
```

To have GKL start automatically at boot, enable the service:
```bash
$ sudo systemctl enable gatrobe-knowledge-library@gkl_user
```

To disable the automatic start, use this command:
```bash
$ sudo systemctl disable gatrobe-knowledge-library@gkl_user
```

To start GKL now, use this command:
```bash
$ sudo systemctl start gatrobe-knowledge-library@gkl_user
```


