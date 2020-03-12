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
    if len(content['utts']) != len(content['wav']):
        return False
    for utt in content['utts']:
        if utt not in content['wav']:
            return False
    for utt in content['wav']:
        if utt not in content['utts']:
            return False
    return True


def _getWer(csid):
    errs = float(csid[1]) + float(csid[2]) + float(csid[3])
    occs = float(csid[0]) + float(csid[1]) + float(csid[3])
    if occs == 0.0:
        return 0
    return errs/occs


def showDecode(param):
    content = {'utts': {}}
    decode_dir = param['decode_id']
    if decode_dir in os.listdir(app.config['DECODES_FOLDER']):
        per_utt = app.config['DECODES_FOLDER'] + "/" + decode_dir + \
            '/scoring_kaldi/'+param['criterion']+'_details/per_utt'

        # read per utt
        count = 0
        with open(per_utt) as fp:
            lines = fp.read().splitlines()
        for line in lines:
            tokens = line.split()
            if count == 0:
                content['utts'][tokens[0]] = {}
            if count == 3:
                content['utts'][tokens[0]]["csid"] = tokens[2:]
                content['utts'][tokens[0]]['wer'] = _getWer(tokens[2:])
                content['utts'][tokens[0]]['ctm_link'] = "/ctm/?decode_id=" + \
                    param['decode_id']+"&uttid="+tokens[0]
                count = -1
            else:
                content['utts'][tokens[0]][tokens[1]] = tokens[2:]
            count += 1
    else:
        return None

    return content


def fetchCtm(param):
    # get mir ctm
    expdir = app.config['DECODES_FOLDER']
    decode_dir = expdir+"/"+param['decode_id']
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
            wav_tokens = tokens[audio_file_pos].split("/"+corpus+"/")
            if len(wav_tokens) != 2:
                return {}
            wav_relative_path = "/static/dataset/" + \
                corpus + "/" + wav_tokens[1]
    # utt not found
    if wav_relative_path == "":
        return {}

    return {
        'wav': wav_relative_path,
        'ctm': ctm
    }


def getDecodes():
    return os.listdir(app.config['DECODES_FOLDER'])