from flask import current_app as app
import os
import sys
import json


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


def showDecode(param):
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


def fetchCtm(param):
    # get mir ctm
    expdir = app.config['DECODE_FOLDER']
    decode_dir = expdir+"/decode_"+param['decode_id']
    mir_ctm_file = decode_dir + "/mir/"+param['uttid']+'.json'
    if not os.path.exists(mir_ctm_file):
        return {}
    with open(mir_ctm_file, encoding="utf8") as fp:
        ctm = json.load(fp)

    # get corpus name
    corpus_file = decode_dir+"/corpus"
    with open(corpus_file) as fp:
        lines = fp.read().splitlines()
    if len(lines) != 1:
        return {}
    corpus = lines[0]

    # get wav path
    wavscp = decode_dir + "/data/wav.scp"
    if not os.path.exists(wavscp):
        return {}
    with open(wavscp) as fp:
        lines = fp.read().splitlines()
    wav_relative_path = ""
    for line in lines:
        tokens = line.split()
        if tokens[0] == param['uttid']:
            audio_file_pos = _getAudioPosInScp(line)
            if audio_file_pos == -1:
                return {}
            wav_relative_path = "/static/dataset/" + corpus + \
                tokens[audio_file_pos].split(corpus)[1]
    if wav_relative_path == "":
        return {}

    return {
        'wav': wav_relative_path,
        'ctm': ctm
    }
