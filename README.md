This repository includes a couple variations of websocket servers written in Node.js.

## Purpose

The included websocket server scripts are designed to allow self-hosting of some of the apps and services provided by Steve Seguin, including caption.ninja, vdo.ninja, chat.overlay.ninja, and more.

### basic server
The basic websocket server, `server.js`, can be used with a number of apps provided by Steve Seguin, including vdo.ninja, caption.ninja, chat.overlay.ninja, and more.

Due to the simplicity and generic nature of its basic fan-out design, it's really only suitable for personal or private use, as published data is broadcasted to everyone connected.

### VDO.Ninja optimized version server

VDO.Ninja is intentionally designed to work with a basic websocket server, due to a core tenant of the VDO.Ninja's design philosophy being: "be as serverless as possible". This develoment mindset allows VDO.Ninja to not only have a low-cost to operate, but also allows it to work over public blockchain networks, mesh-networks, RabbitMQ, IRC chat rooms, and probably even Twitter. It's a good idea to use a secure password in such cases though, to ensure message encryption over public channels.

That said, it's fairly easy to optimize the message routing to get better performance and security when using VDO.Ninja.  To demonstrate this, I've also included in this repository an optimized version of the websocket server (`vdoninja.js`), specifically designed to fill the role of a VDO.Ninja handshake server. Either the basic or this optimized version would work as a VDO.Ninja handshake server, however the optimized version can handle more clients and has better routing isolation.

### VDO.Ninja advanced routing server

The new `vdoninja_advanced.js` file evolves the optimized server further by adding multi-room awareness, stream ownership tracking, lightweight callback queues, and optional director-style room control. It is the recommended option when you want production-style routing and the behaviour you get when `session.customWSS` is **false** inside VDO.Ninja. In that mode VDO.Ninja expects a stateful handshake service, and the advanced script implements the same message flow as the public hosted infrastructure.

Key notes about the advanced server:

* Licensed under **AGPLv3** — keep that in mind if you distribute modified versions.
* Supports HTTPS out of the box via `SERVER_CERT`/`SERVER_KEY` (or `CERT_PATH`/`KEY_PATH`) environment variables; falls back to HTTP if no certificate is found. You can also override the listen port with `PORT`.
* Requires the additional `uuid` dependency (`npm install uuid`).
* Works with the default VDO.Ninja experience (`customWSS=false`), including director rooms, migration, and stream notifications.

The optimized `vdoninja.js` and generic `server.js` continue to shine when `session.customWSS` is **true**. That keeps the handshake nearly stateless, making it easier to plug into third-party messaging layers like IRC, MQTT, or blockchain relays.

### Offline use, when Internet isn't available

There's a version of VDO.Ninja handshake server located here, https://github.com/steveseguin/offline_deployment/, which combines the websocket (handshake) server with a Node.js-based webserver. It adds to the complexity by also focusing on being Dockerfile friendly, as well as being offline-focused, however it would work for an online option also.

### Dockers

This repository isn't focused on offering a Docker specifically, however https://github.com/steveseguin/offline_deployment/ contains one, as well as there is a community Docker for VDO.Ninja forked over at https://github.com/steveseguin/docker-vdon/.

### Alternative options

You can use services like piesocket.com or Cloudflare workers, instead of self-hosting a websocket server as well. Just pointing that out, as self-hosting servers is a responsibility..

## Installation
```
sudo apt-get update
sudo apt-get upgrade
sudo apt-get install nodejs -y
sudo apt-get install npm -y
sudo npm install express
sudo npm install ws
sudo npm install cors
sudo npm install uuid
```

You will very likely also require SSL, so either use something like Cloudflare SSL, or grab a self-hosted SSL certificate. WebRTC clients generally refuse to publish or play media over insecure `ws://` endpoints, so plan for TLS (`wss://`) from day one. Certbot is a free way to get SSL certificates that you need to renewal every 90-days, and the setup for that is as follows:
```
sudo add-apt-repository ppa:certbot/certbot  
sudo apt-get install certbot -y
sudo certbot certonly // register your domain
```
If you are starting from a clean server, the standalone mode is usually the fastest path:
```
sudo certbot certonly --standalone -d wss.example.com
```
Certbot will drop the certificate and private key in `/etc/letsencrypt/live/wss.example.com/`. Point the legacy scripts at those paths and set `SERVER_CERT`/`SERVER_KEY` (or `CERT_PATH`/`KEY_PATH`) when launching `vdoninja_advanced.js`. Certbot also installs a systemd timer that renews the certificate automatically; just make sure TCP 80/443 are reachable during renewal.

As well, you will probably need a domain name in most cases, so perhaps consider a cloud host that offers a server hostname or be prepared to spend a few dollars on a domain name. (namescheap.com has them for as low as $2)

In the case of an offline deployment, you may need self-signed certicates, but that topic is outside the scope of this guide.

(Oh, also, I've added support for `npm install`, if you want a quick way to install the vdoninja.js script that way.)

## To run the basic server manually
```
sudo nodejs server.js // port 443 needs to be open. THIS STARTS THE SERVER
```
But you'll probably want to create a service and have the script auto start on system load or restart on a crash.

## If using with VDO.Ninja

To run the VDO.Ninja optimized version manually,
```
sudo nodejs vdoninja.js // port 443 needs to be open. THIS STARTS THE SERVER
```
Whether you use the optimized version or not, if using this with a self-hosted version of VDO.Ninja, you'll need to update the `index.html` of your VDO.Ninja installation with the WSS connection details.

Specially, you'll need to enable the `customWSS` mode and set the wss server address to whatever you setup, such as with:
```
session.wss = "wss://wss.contribute.cam:443";
session.customWSS = true;
```
You can also just specify the new WSS URL as a URL parameter, such as:
```
https://vdo.ninja?wss=wss://yourdomain.com
```

### Index.html tweaks worth considering when self-hosting

* **Handshake selection** – leave `session.customWSS` as `false` if you are running `vdoninja_advanced.js`, or set it to `true` when using the simpler `vdoninja.js`/`server.js` so that the client treats your server as stateless.
* **Password prompts** – `session.defaultPassword`, `session.password`, and the commented `prompt("Enter your password")` snippet in `index.html` provide simple protection layers. For stronger guarantees consider HTTP Basic Auth or Cloudflare Zero Trust as described in the inline comments.
* **Hide landing page** – setting `session.hidehome = true` or using the `&hidehome` URL parameter removes the home UI for guests. There is also a commented one-liner that blanks the page unless a query string is present.
* **TURN credentials** – the sample blocks in `index.html` show how to hard-code TURN servers or fetch dynamic credentials via `turn-credentials.php`. Remember to clear `session.ws` only after credentials load if you go that route.

These in-page snippets are already present in the upstream `index.html`; you just need to uncomment or edit them to suit your deployment.

### Running as a systemd service

For unattended operation you can wrap any of the scripts with systemd. Example for the advanced server (adjust paths to match your deployment):

```
[Unit]
Description=VDO.Ninja Advanced WebSocket
After=network.target

[Service]
User=vdoninja
Group=vdoninja
Environment=SERVER_CERT=/etc/letsencrypt/live/wss.example.com/fullchain.pem
Environment=SERVER_KEY=/etc/letsencrypt/live/wss.example.com/privkey.pem
WorkingDirectory=/opt/websocket_server
ExecStart=/usr/bin/node /opt/websocket_server/vdoninja_advanced.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Save that to `/etc/systemd/system/vdoninja-advanced.service`, run `sudo systemctl daemon-reload`, then enable and start it with:
```
sudo systemctl enable --now vdoninja-advanced.service
sudo systemctl status vdoninja-advanced.service
```
Duplicate the unit with a different `ExecStart` if you want to run the basic or optimized server instead.

## Disclaimer

No guarentee is made on security, privacy, support, or reliability of these scripts; nor anything else for that matter. You're on your own if you choose to go this path. The code is DIY / AS-IS, and any terms of service are those imposed by the respective open-source licenses (AGPLv3 for the advanced server, and AGPLv3 for the legacy scripts unless otherwise noted). I am not responsible for outages or misconfiguration issues that arise from self-deployment, and I do not offer free support for deployments you manage yourself.

Good luck!
