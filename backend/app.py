from flask import Flask, request, Response
from flask_cors import CORS
import subprocess, logging, shutil
from tempfile import TemporaryDirectory
from random import randint
from pathlib import Path
from typing import List, Tuple

# Requires Python >= 3.7

# Maximum Size (In MB) of uploaded file (<= 0 means unlimited)
MAX_CONTENT_MB = 0 
CMD_TIMEOUT_SEC = 60

app = Flask(__name__)
CORS(app)


def run_cmd(args: List[str]) -> Tuple[bytes, bytes]:
    process = subprocess.run(args, capture_output=True, timeout=CMD_TIMEOUT_SEC)
    if process.returncode != 0:
        raise RuntimeError("Command '%s' failed. Details : '%s'" % ( str(args), process.stderr))
    return process.stdout, process.stderr

def is_h264(filename: Path) -> bool:
    _, info = run_cmd(['MP4Box', '-info', str(filename)])
    return 'AVC/H264 Video' in  str(info)

def persist_request(directory: str, req: request) -> Path:
    vname = "video_%d.mp4" % randint(0, 999999999999)
    vname_path = Path(directory, vname)
    with open(vname_path, 'wb') as f:
        f.write(req.get_data())
    return vname_path

def dashify(filename: Path) -> Path:
    """
    Runs dashify.sh script on a MP4 file, and returns a path to a ZIP with its output.
    """
    run_cmd(["/bin/bash", "../cli/dashify.sh", str(filename)])
    output = Path(filename.parent, filename.stem)
    if not output.exists:
        raise RuntimeError("Dashify failed to produce an output")
    zip_path = Path(filename.parent, filename.stem)
    return Path(shutil.make_archive(zip_path, 'zip', output))

@app.route('/size', methods=['GET'])
def size():
    return '%d' % MAX_CONTENT_MB, 200
        
@app.route('/', methods=['POST'])
def index():
    if (MAX_CONTENT_MB > 0) and (request.content_length > (MAX_CONTENT_MB * 1024 * 1024)):
        return "Maximum allowed size is '%d' MB" % MAX_CONTENT_MB, 400

    if request.mimetype != 'video/mp4':
        return "No video was uploaded", 400

    try:
        with TemporaryDirectory() as temp_dir:
            vname = persist_request(temp_dir, request)
            if not is_h264(vname):
                return "Not a AVC/H264 video file", 400
            zipname = dashify(vname)
            content = zipname.read_bytes()
            return Response(content, mimetype='application/zip', status=200)
            
    except Exception as e:
        logging.error("Request failed with exception. "+ str(e))
        return "Failed to process video", 500

if __name__ == "__main__":
    app.run("0.0.0.0", 5000)
