import sys, re
import xml.etree.ElementTree as ET
from pathlib import Path
from arweave.arweave_lib import Wallet, Transaction
from typing import List, Callable
import requests
import logging
import time

DEBUG_SIGN_ONLY = True
MAX_RETRIES = 4


class TransactionWithRetries(Transaction):
    """
    Extension of arweave_lib.Transaction that assumes that some requests to the network may fail.
    Retry logic was added, and some logging spamming was removed as well.
    """

    def send(self) -> requests.Response:
        url = "{}/tx".format(self.api_url)
        response = requests.post(url, data=self.json_data)
        return response

    @staticmethod
    def _request_with_retries(max_retries: int, request_to_wrap: Callable, *request_to_wrap_args) -> str:
        retries=0
        wait_to_retry_sec = 0
        while retries <= max_retries:
            if wait_to_retry_sec > 0:
                if response is not None:
                    logging.warning("Request failed: '%s'. Retrying after '%d' seconds..." %
                                    (response.text, wait_to_retry_sec))
                time.sleep(wait_to_retry_sec)
            response = request_to_wrap(*request_to_wrap_args)
            if response.status_code == 200:
                return response.text
            retries += 1
            wait_to_retry_sec = 1 + (wait_to_retry_sec * 2 )

        raise Exception("Unable to send request after '%d' retries." % retries)

    def get_reward(self, data, target_address=None) -> str:
        data_length = len(data)
        url = "{}/price/{}".format(self.api_url, data_length)
        if target_address:
            url = "{}/price/{}/{}".format(self.api_url, data_length, target_address)
        reward = TransactionWithRetries._request_with_retries(MAX_RETRIES, requests.get, url)
        return reward

    def send_with_retries(self):
        if DEBUG_SIGN_ONLY is True:
            return
        TransactionWithRetries._request_with_retries(MAX_RETRIES, self.send)


def get_file_attrib_name(segment: ET.Element):
    is_initialization_segment = 'Initialization' in segment.tag
    return 'sourceURL' if is_initialization_segment else 'media'


def ensure_all_segments_exist(segments: list, base_path: Path):
    """Asserts that all segments exist on disk"""
    for segment in segments:
        file_attrib_name = get_file_attrib_name(segment)
        assert file_attrib_name in segment.attrib, "MPF file has not been properly formatted"
        file_path = base_path.joinpath(segment.attrib[file_attrib_name])
        assert file_path.exists(), "Segment '%s' was not found" % file_path


def upload_segment(base_path: Path, ar_wallet: Wallet, segment: ET.Element):
    file_attrib_name = get_file_attrib_name(segment)
    segment_path = base_path.joinpath(segment.attrib[file_attrib_name])
    tx = TransactionWithRetries(ar_wallet, data=segment_path.read_bytes())
    tx.sign()
    tx.send_with_retries()
    segment.attrib[file_attrib_name] = tx.id


def upload_segments(ar_wallet: Wallet, segments: List[ET.Element], base_path: Path):
    ensure_all_segments_exist(segments, base_path)
    for ix, segment in enumerate(segments):
        print("Uploading segment '%d' out of '%d'" % (ix+1, len(segments)))
        upload_segment(base_path, ar_wallet, segment)


def upload_mpd(ar_wallet: Wallet, mpd_xml: ET.ElementTree):
    mpd_str = ET.tostring(mpd_xml.getroot(), encoding='utf8').decode('utf8')
    tx = TransactionWithRetries(ar_wallet, data=mpd_str)
    tx.sign()
    tx.send_with_retries()
    if DEBUG_SIGN_ONLY:
        print(mpd_str)
    else:
        print ("Upload completed. MPD file available at transaction '%s'" % tx.id)


def remove_all_base_url_el(mpd_xml: ET.Element, namespace: str = ''):
    all_representations = mpd_xml.findall('.//{%s}Representation' % namespace)
    for rep in all_representations:
        base_url = rep.find('./{%s}BaseURL' % namespace)
        if base_url is not None:
            rep.remove(base_url)


def set_title(mpd_xml: ET.Element, namespace: str, title_value: str):
    title_el = mpd_xml.find('.//{%s}Title' % namespace)
    title_el.text = title_value


def main(wallet_path: Path, mpd_path: Path):
    mpd_xml = ET.parse(mpd_path)

    root_tag = mpd_xml.getroot().tag
    ns = re.search(r"\{(.+)\}", root_tag).groups()[0]
    ET.register_namespace('', ns)

    all_initialization_urls = mpd_xml.findall('.//{%s}Initialization' % ns)
    all_segment_urls = mpd_xml.findall('.//{%s}SegmentURL' % ns)
    all_segments = all_initialization_urls + all_segment_urls

    ar_wallet = Wallet(wallet_path)

    upload_segments(ar_wallet, all_segments, mpd_path.parents[0])

    remove_all_base_url_el(mpd_xml, ns)

    set_title(mpd_xml, ns, "Transaction for '%s' created with Ardash" % mpd_path.name)

    upload_mpd(ar_wallet, mpd_xml)


def usage():
    print('python3 dash_upload.py <wallet.json> <to_be_uploaded.mpd>')
    exit(1)


if __name__ == "__main__":

    if len(sys.argv) < 3:
        usage()

    wallet = Path(sys.argv[1])
    mpd_file = Path(sys.argv[2])

    if not wallet.exists() or not mpd_file.exists():
        usage()

    main(wallet, mpd_file)

