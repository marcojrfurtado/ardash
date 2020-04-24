# ardash

Stream videos directly from the decentralized Arweave permaweb.

This tool allows you to deploy MPEG-DASH encoded videos directly into Arweave's permaweb. Those videos can later be viewed through Arweave's gateway.

# Getting started

A pre-built version of Ardash is available at https://marcojrfurtado.github.io/ardash/

This is a static page, and not a service. This means that your wallet and content are never stored in any server. If you wish, you may also build it locally. For more information, please check [dapp/README.md](dapp/README.md).

## Enable video pre-processing

The dApp is not able to encode videos in-browser just yet. For that we rely on [MP4Box](https://github.com/gpac/gpac/wiki/MP4Box). You can install it in your own computer, and connect it to the dApp

Assuming you are using Ubuntu, simply install required packages by running

```
apt-get install -y gpac python3.7 zip
```

Then start the server locally

```
cd backend && python3.7 app.py
```

This should start a local server on your machine, under port `5000`. 

Once the dApp is able to communicate with the local backend, you should see its video processing button change from

* Video upload unavailable

to

* Drop H.264 Video

## (Alternative) No dApp video processing support

If you do not wish to run the local server in your machine, you may process the video through a command-line command, and simply drop the zip containing the dash segments into the app.

```
./dashify.sh <video.mp4> -z
```

For more information, please check [cli/README.md](cli/README.md)

## Previewing 

The dApp also allows you to preview commited videos, once all its transactions have been mined. Its goal is to teach users how to embed videos into their own websites. It relies on Arweave's gateway for displaying those transactions. For more information, please refer to  https://www.arweave.org/technology

Would you like to preview an existing video? Try transaction `wxY3H9lXY9tc5DhF3IcvsneFcS_3kKD7FdJT9f4rMts` as an example.

You can try embedding this on your website with the following snippet

```html
<script src="https://cdn.dashjs.org/latest/dash.all.min.js"></script>
...
<body>
 <div>
  <video data-dashjs-player autoplay
    src="https://arweave.net/wxY3H9lXY9tc5DhF3IcvsneFcS_3kKD7FdJT9f4rMts"
    controls></video>
 </div>
</body>
```


## Sponsoring

If you benefited from the tool, and would like to see it being maintained, please consider contributing

* AR : ojThvC30aNfH-lLbpoRxZ1Y76p72bP7rQL2VIhxDRj4

* ETH/ERC-20 : 0x394220e29b61E3b10BA4eEfD0D887Fcffd16e656