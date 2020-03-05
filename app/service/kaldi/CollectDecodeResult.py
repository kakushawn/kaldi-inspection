
from flask import current_app as app
import os


def _getAudioPosInScp(line0):
    tokens = line0.split()
    if len(tokens) == 2:
        return 1
    for i, token in enumerate(tokens):
        if token[-4:] == '.wav':
            return i
    return -1


def _checkConsistency(content):
    if len(content['per_utt']) != len(content['wav']):
        return False
    for utt in content['per_utt']:
        if utt not in content['wav']:
            return False
    for utt in content['wav']:
        if utt not in content['per_utt']:
            return False
    return True


def _getWer(csid):
    occs = sum([float(t) for t in csid])
    errs = sum([float(t) for t in csid[1:]])
    return errs/occs


def run(param):
    content = {'per_utt': {}, 'wav': {}}
    if param['decode_id'] in os.listdir(app.config['DECODE_FOLDER']):
        per_utt = app.config['DECODE_FOLDER']+'/'+param['decode_id'] + \
            '/scoring_kaldi/'+param['criterion']+'_details/per_utt'

        # read per utt
        count = 0
        with open(per_utt) as fp:
            lines = fp.read().splitlines()
        for line in lines:
            tokens = line.split()
            if count == 0:
                content['per_utt'][tokens[0]] = {}
            content['per_utt'][tokens[0]][tokens[1]] = tokens[2:]
            if count == 3:
                content['per_utt'][tokens[0]]['wer'] = _getWer(tokens[2:])
                count = -1
            count += 1
    else:
        return None

    if param['data'] in os.listdir(app.config['DATA_FOLDER']):
        corpus_dir_depth = len(
            app.config['CORPUS_FOLDER'].strip('/').split('/'))
        wavscp = app.config['DATA_FOLDER']+'/'+param['data'] + '/wav.scp'
        with open(wavscp) as fp:
            lines = fp.read().splitlines()
        audio_file_pos = _getAudioPosInScp(lines[0])
        if audio_file_pos == -1:
            return None

        for line in lines:
            tokens = line.split()
            content['wav'][tokens[0]] = "/static/" + \
                "/".join(tokens[audio_file_pos].split('/')[corpus_dir_depth:])

    else:
        return None

    if not _checkConsistency(content):
        return None

    return content
