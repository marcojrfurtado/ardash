#!/bin/bash

set -e

# Defaults script:
HELP=0
DO_ZIP=0

# Defaults output
SEGMENT_SIZE_MS=4000

while getopts "zhs:" opt; do
    case $opt in
        h) HELP=1 ;;
        z) DO_ZIP=1 ;;
        s) SEGMENT_SIZE_MS=${OPTARG} ;;
        *) echo 'Error in command line parsing' >&2
           exit 1
    esac
done
shift $((OPTIND-1))

usage() {
    echo "Usage:"
    echo "  ./dashify.sh [options] <input video> "
    echo "Options:"
    echo "  h: This message"
    echo "  s: Segment size used for the split (in ms) (Default: ${SEGMENT_SIZE_MS})"
    echo "  z: Zip dashified output"
}

if [ "$HELP" -eq 1 ]; then
    usage
    exit 0
fi

if [[ $# -eq 0 ]] ; then
    usage
    exit 1
fi

INPUT=$( realpath $1 )

if [ ! -f $INPUT ]; then
    >&2 echo "File '${INPUT}' was not found. Please provide a valid file"
    exit 1
fi

INPUT_DIR=$( dirname $INPUT )
INPUT_FILENAME=$( basename $INPUT )
INPUT_BASENAME="${INPUT_FILENAME%.*}"

OUTPUT_DIR="${INPUT_DIR}/${INPUT_BASENAME}"
MPD_OUTPUT=${OUTPUT_DIR}/${INPUT_BASENAME}.mpd

mkdir -p ${OUTPUT_DIR}

SINGLE_TRACK_CONFIRM="$(MP4Box -info ${INPUT} 2>&1 | grep '1 track' || true)"

SECOND_TRACK=""
if [ -z "$SINGLE_TRACK_CONFIRM" ]; then
    SECOND_TRACK=${INPUT}#audio:baseURL=${OUTPUT_DIR}/a/
fi

MP4Box -dash ${SEGMENT_SIZE_MS} -frag ${SEGMENT_SIZE_MS} -rap -segment-name seg_ -out ${MPD_OUTPUT} \
             ${INPUT}#video:baseURL=${OUTPUT_DIR}/v/ ${SECOND_TRACK}

# Follow up with some hacky post-processing on the MPD file

# Get rid of double slashes. TODO: remove it once this is gotten right with MP4Box.
sed -i -E 's#(media=".+)//(.+")#\1/\2#g' ${MPD_OUTPUT}
sed -i -E 's#(sourceURL=".+)//(.+")#\1/\2#g' ${MPD_OUTPUT}

# Remove BaseURL
sed -i "/<BaseURL>/d" ${MPD_OUTPUT}

# Set doc title
NEW_TITLE="${INPUT_BASENAME} processed by GPAC"
sed -i -E "s#(<Title>).+(</Title>)#\1${NEW_TITLE}\2#g" ${MPD_OUTPUT}

if [ $DO_ZIP -eq 1 ]; then
    zip -r ${INPUT_DIR}/${INPUT_BASENAME}.zip ${OUTPUT_DIR}
fi



