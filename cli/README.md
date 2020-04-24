# Command-line tools for pre-processing MPEG-Dash videos

Command-line utilities for converting H.264 MP4 videos into MPEG-Dash segments, and uploading them into the Arweave permaweb.

## Requirements

* MP4Box (part of gpac)
* zip (command line utils)
* Python >= 3.7

If you are using Ubuntu, all dependencies may be installed with the following command line

```
apt-get install -y gpac python3.7 zip
```

## Running

### Creating DASH segments

You may convert a video into DASH segments using the following command-line:

```
./dashify.sh <video.mp4>
```

If successfull, a directory named `<video>/` will be created alongside the mp4 file. It will contain all segments. If you wish to automatically zip the output directory, you may also run:

```
./dashify.sh <video.mp4> -z
```

### Uploading

Before running the upload script, install the requirements by running:

```
pip3.7 install -r requirements.txt
```

Then simply upload the pre-processed segments:

```
python3.7 dash_upload.py <ar_wallet.json> <video>/<to_be_uploaded.mpd>
```

NOTE (1): This step deployes segments into the permaweb, it cannot be reversed. 

NOTE (2): It is recommended to use the dApp for uploading instead, as it is faster.
