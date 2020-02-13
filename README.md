# Gatrobe Knowledge Library

## Table of content

1.  [About GKL](#about-gkl)
2.  [Dependencies](#dependencies)
3.  [Getting started](#getting-started)
4.  [Setting up autostart](#setting-up-autostart-systemd)
5.  [Setting up apache](#setting-up-apache)

### About GKL

The `Gatrobe Knowledge Lib, (GKL)` is there to browse and view all documents from the `Gatrobe Library`.
You can view the individual files (currently only PDF files!) and add them to your shopping cart.
In the next step you can have a look at all pages again in an overview and if necessary select individual
pages which are not desired or not needed.
In the last step a PDF file is created, which contains all pages and can be printed afterwards by a
member of the community by input of a password.

![Application Schema](docs/schema.png)

### Dependencies

In order to use GKL, you need to install the following main dependencies:
  1. Python 3
  2. Python 3 Virtual Environment
  3. git
  4. lp and cups

```bash
$ sudo apt install python3 python3-venv git cups
```

### Getting started

Add an account for the GKL called `gkl_user`:

```bash
$ sudo useradd gkl_user
```

Next we will create a directory for the installation of GKL and change the owner to the `gkl_user` account:

```bash
$ cd /srv
$ sudo git clone https://github.com/Gatrobe/GatrobeKnowledgeLibrary.git
$ sudo chown -R gkl_user:gkl_user GatrobeKnowledgeLibrary
```

Next up is to create and change to a virtual environment for GKL. This will be done as the `gkl_user` account:

```bash
$ sudo su -s /bin/bash gkl_user
$ cd /srv/GatrobeKnowledgeLibrary
$ python3 -m venv venv
$ source venv/bin/activate
```

Copy the `credentials.js.example` file to `credentials.js` and change the content:

```bash
(venv) cp static/credentials.js.example static/credentials.js
(venv) # Now do your changes to the credentials.js file
```

Do the same for the Flask configuration:

```bash
(venv) cp configuration.example.py configuration.py
(venv) # Now do your changes to the configuration.py
```

Install all requirements:

```bash
(venv) pip install -r requirements.txt
(venv) cd static
(venv) npm install
```

### Setting up cups

- Configure cups via port forwarding ```ssh root@gat-lib -L 12345:localhost:631```. Go to http://localhost:12345/ in your browser.
    - Make sure, that duplex and black/white printing is enabled!
    - Do not forget to set the UserCode via the web interface.
- Be sure, a default printer is set:
    - List all available printers: ```lpstat -p -d```
    - If the command returns "no system default destination", no default printer is set!
    - Set the default printer: ```lpadmin -d <PRINTERNAME>```.
- You can do a test print by invoking ```echo "test" | lp``` from the commandline.

### Setting up autostart (systemd)

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

### Setting up apache


Below you can see the apache configuration file for GKL, which goes in
`/etc/apache2/sites-available/gatrobe_knowledge_library.conf`:

```bash
<IfModule mod_ssl.c>
    <VirtualHost _default_:80>
        ServerName <Your Domain>
        ServerSignature Off
        RewriteEngine On
        RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]
        ErrorLog /var/log/apache2/redirect.error.log
        LogLevel warn
    </VirtualHost>
    
    <VirtualHost _default_:443>
        ServerName <Your Domain>
    
        ProxyPass / http://127.0.0.1:8000/
        ProxyPassReverse / http://127.0.0.1:8000/
    
        ErrorLog ${APACHE_LOG_DIR}/gkl_error.log
        CustomLog ${APACHE_LOG_DIR}/gkl_access.log combined
    
        SSLEngine on
    
        #SSLOptions +FakeBasicAuth +ExportCertData +StrictRequire
        <FilesMatch "\.(cgi|shtml|phtml|php)$">
                        SSLOptions +StdEnvVars
        </FilesMatch>
        <Directory /usr/lib/cgi-bin>
                        SSLOptions +StdEnvVars
        </Directory>
    
        BrowserMatch    "MSIE [2-6]" nokeepalive ssl-unclean-shutdown downgrade-1.0 force-response-1.0
        # MSIE 7 and newer should be able to use keepalive
        BrowserMatch "MSIE [17-9]" ssl-unclean-shutdown
    
        Include /etc/letsencrypt/options-ssl-apache.conf
        SSLCertificateFile <Your certificate>
        SSLCertificateKeyFile <Your key>
    </VirtualHost>
</IfModule>
```

Create a symlink to enable your virtual host and restart apache2:

```bash
$ cd /etc/apache2/sites-enabled/
$ sudo ln -s ../sites-available/gatrobe_knowledge_library.conf .
$ sudo systemctl restart apache2
```


